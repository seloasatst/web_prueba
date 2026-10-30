(function () {
  'use strict';

  let activeFilter = 'all';
  let searchQuery = '';
  let currentPostItems = [];
  let featuredPost = null;

  function normalizeLang(lang) {
    if (!lang) return 'es';
    const value = String(lang).toLowerCase();
    if (value === 'de') return 'al';
    return ['es', 'en', 'al', 'pt', 'fr'].includes(value) ? value : 'es';
  }

  function getCurrentLang() {
    return normalizeLang(localStorage.getItem('site-language') || document.documentElement.lang || 'es');
  }

  function getBackendApiUrl(endpoint) {
    const isFile = window.location.protocol === 'file:';
    const port = window.location.port;
    const isDevServer = port && port !== '80' && port !== '443';

    if (isFile || isDevServer) {
      const host = window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1';
      return `http://${host}/shipping/` + endpoint.replace(/^\/+/, '');
    }
    return endpoint;
  }

  function getPageContent(lang) {
    const safeLang = normalizeLang(lang);
    let baseContent = (window.I18N_PAGE_TRANSLATIONS
      && window.I18N_PAGE_TRANSLATIONS[safeLang]
      && window.I18N_PAGE_TRANSLATIONS[safeLang].blogPage)
      || (window.I18N_PAGE_TRANSLATIONS
        && window.I18N_PAGE_TRANSLATIONS.es
        && window.I18N_PAGE_TRANSLATIONS.es.blogPage)
      || null;

    if (!baseContent) return null;

    try {
      const storedPosts = localStorage.getItem('seloasa_blog_posts');
      if (storedPosts !== null) {
        const posts = JSON.parse(storedPosts);
        if (Array.isArray(posts)) {
          const published = posts.filter(p => (p.status || 'draft') === 'published');
          if (published.length > 0) {
            const featured = published.find(p => p.is_featured) || published[0];
            const latestItems = published.filter(p => p !== featured);

            return {
              ...baseContent,
              featured: featured ? { ...featured } : null,
              latest: {
                ...baseContent.latest,
                items: latestItems
              }
            };
          } else {
            return {
              ...baseContent,
              featured: null,
              latest: {
                ...baseContent.latest,
                items: []
              }
            };
          }
        }
      }
    } catch (e) {
      console.warn('Error reading admin posts in blog-page:', e);
    }

    return {
      ...baseContent,
      featured: null,
      latest: {
        ...baseContent.latest,
        items: []
      }
    };
  }

  function getLocalizedItem(item, lang) {
    if (!item) return item;
    const safeLang = normalizeLang(lang);
    const t = (item.translations && item.translations[safeLang]) ? item.translations[safeLang] : null;
    if (!t) return item;
    return {
      ...item,
      title: t.title || item.title,
      summary: t.summary || item.summary,
      content: t.content || item.content,
      category: t.category || item.category,
      badge: t.badge || item.badge,
      dept: t.dept || item.dept
    };
  }

  function isVideoString(str) {
    if (!str) return false;
    return /(?:youtube\.com|youtu\.be|vimeo\.com|\.(mp4|webm|ogg))|<iframe|<video/i.test(str);
  }

  function parseMediaSource(mediaInput, fallbackTime = '1') {
    let videoUrl = '';
    let imageUrl = '';
    let videoTime = fallbackTime || '1';

    if (typeof mediaInput === 'object' && mediaInput !== null) {
      videoUrl = (mediaInput.video_url || '').trim();
      imageUrl = (mediaInput.image || '').trim();
      videoTime = mediaInput.video_time || fallbackTime || '1';
    } else {
      const clean = String(mediaInput || '').trim();
      if (isVideoString(clean)) {
        videoUrl = clean;
      } else {
        imageUrl = clean;
      }
    }

    if (!videoUrl && isVideoString(imageUrl)) {
      videoUrl = imageUrl;
      imageUrl = '';
    }

    if (videoUrl) {
      // 1. YouTube
      const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
      if (ytMatch) {
        const id = ytMatch[1];
        return {
          type: 'youtube',
          id: id,
          embedUrl: `https://www.youtube.com/embed/${id}`,
          thumbnailUrl: imageUrl || `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
          videoTime: videoTime
        };
      }

      // 2. Vimeo
      const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
      if (vimeoMatch) {
        const id = vimeoMatch[1];
        return {
          type: 'vimeo',
          id: id,
          embedUrl: `https://player.vimeo.com/video/${id}`,
          thumbnailUrl: imageUrl || 'img/feature.jpg',
          videoTime: videoTime
        };
      }

      // 3. Direct HTML embed (<iframe or <video)
      if (videoUrl.startsWith('<iframe') || videoUrl.startsWith('<video')) {
        return {
          type: 'html',
          html: videoUrl,
          thumbnailUrl: imageUrl || 'img/feature.jpg',
          videoTime: videoTime
        };
      }

      // 4. Video file (.mp4, .webm, .ogg)
      if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl)) {
        const baseSrc = videoUrl.split('#')[0];
        const timedSrc = `${baseSrc}#t=${videoTime}`;
        return {
          type: 'video',
          src: timedSrc,
          baseSrc: baseSrc,
          videoTime: videoTime,
          thumbnailUrl: imageUrl || ''
        };
      }
    }

    return {
      type: 'image',
      src: imageUrl || 'img/feature.jpg',
      thumbnailUrl: imageUrl || 'img/feature.jpg',
      videoTime: videoTime
    };
  }

  function renderCardMediaHtml(item, targetUrl, badgeHtml) {
    const media = parseMediaSource(item);

    if (media.type === 'youtube' || (media.type === 'video' && media.thumbnailUrl)) {
      return `
        <div class="overflow-hidden service-media mb-3 position-relative">
          <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="video-card-thumb-wrap">
            <img src="${media.thumbnailUrl}" alt="${item.image_alt || item.title}" class="img-fluid w-100" style="height: 220px; object-fit: cover;" loading="lazy" onerror="this.onerror=null;this.src='img/feature.jpg';">
            <div class="video-play-overlay">
              <span class="video-play-badge"><i class="fa fa-play text-white"></i></span>
            </div>
          </a>
          ${badgeHtml}
        </div>
      `;
    }

    if (media.type === 'video') {
      return `
        <div class="overflow-hidden service-media mb-3 position-relative">
          <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="video-card-thumb-wrap">
            <video src="${media.src}" class="img-fluid w-100" style="height: 220px; object-fit: cover; background: #111;" muted playsinline preload="metadata"></video>
            <div class="video-play-overlay">
              <span class="video-play-badge"><i class="fa fa-play text-white"></i></span>
            </div>
          </a>
          ${badgeHtml}
        </div>
      `;
    }

    return `
      <div class="overflow-hidden service-media mb-3 position-relative">
        <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="d-block">
          <img src="${media.src || 'img/feature.jpg'}" alt="${item.image_alt || item.title}" class="img-fluid w-100" style="height: 220px; object-fit: cover;" loading="lazy" onerror="this.onerror=null;this.src='img/feature.jpg';">
        </a>
        ${badgeHtml}
      </div>
    `;
  }

  function renderFeatured(content) {
    const section = document.getElementById('blogFeaturedSection') || document.querySelector('.blog-featured-section');

    if (!content || !content.featured) {
      if (section) section.classList.add('d-none');
      featuredPost = null;
      return;
    }

    if (section) section.classList.remove('d-none');

    const lang = getCurrentLang();
    const feat = getLocalizedItem(content.featured, lang);
    featuredPost = feat;

    const image = document.getElementById('blogFeaturedImage');
    const imageLink = document.getElementById('blogFeaturedImageLink') || (image ? image.closest('a') : null);
    const kicker = document.getElementById('blogFeaturedKicker');
    const category = document.getElementById('blogFeaturedCategory') || document.getElementById('blogFeaturedBadge');
    const date = document.getElementById('blogFeaturedDate');
    const title = document.getElementById('blogFeaturedTitle');
    const summary = document.getElementById('blogFeaturedSummary');
    const readBtn = document.getElementById('blogFeaturedReadBtn');

    const targetUrl = `blog/articulo.html?id=${encodeURIComponent(feat.id || 'featured')}`;

    if (imageLink) {
      const media = parseMediaSource(feat);
      if (media.type === 'video') {
        if (media.thumbnailUrl) {
          imageLink.innerHTML = `
            <img id="blogFeaturedImage" src="${media.thumbnailUrl}" alt="${feat.image_alt || feat.title}" class="img-fluid w-100 blog-featured-image h-100" style="object-fit: cover; min-height: 320px;" onerror="this.onerror=null;this.src='img/feature.jpg';">
            <div class="video-play-overlay">
              <span class="video-play-badge"><i class="fa fa-play text-white"></i></span>
            </div>
          `;
        } else {
          imageLink.innerHTML = `
            <video id="blogFeaturedVideo" src="${media.src}" class="img-fluid w-100 blog-featured-image h-100" style="object-fit: cover; min-height: 320px; background: #111;" muted playsinline preload="metadata"></video>
            <div class="video-play-overlay">
              <span class="video-play-badge"><i class="fa fa-play text-white"></i></span>
            </div>
          `;
        }
        imageLink.classList.add('position-relative', 'video-card-thumb-wrap');
      } else {
        const thumbSrc = media.thumbnailUrl || media.src || 'img/feature.jpg';
        imageLink.innerHTML = `
          <img id="blogFeaturedImage" src="${thumbSrc}" alt="${feat.image_alt || feat.title}" class="img-fluid w-100 blog-featured-image h-100" style="object-fit: cover; min-height: 320px;" onerror="this.onerror=null;this.src='img/feature.jpg';">
        `;
        if (media.type === 'youtube' || media.type === 'vimeo') {
          imageLink.classList.add('position-relative', 'video-card-thumb-wrap');
          const overlay = document.createElement('div');
          overlay.className = 'video-play-overlay';
          overlay.innerHTML = '<span class="video-play-badge"><i class="fa fa-play text-white"></i></span>';
          imageLink.appendChild(overlay);
        } else {
          imageLink.classList.remove('video-card-thumb-wrap');
        }
      }
      imageLink.setAttribute('href', targetUrl);
    }
    if (kicker) {
      if (feat.kicker) {
        kicker.textContent = feat.kicker;
      } else if (feat.type === 'comunicado') {
        kicker.textContent = 'Comunicado Oficial Destacado';
      } else if (feat.type === 'noticia') {
        kicker.textContent = 'Noticia Operativa Destacada';
      } else {
        kicker.textContent = 'Artículo Destacado';
      }
    }
    if (category) {
      category.textContent = feat.category || (feat.type === 'comunicado' ? 'Comunicado Oficial' : feat.type === 'noticia' ? 'Noticia Operativa' : 'Blog Farma');
      const badgeParent = category.closest('.home-blog-pill, .blog-meta-pill');
      if (badgeParent) {
        const badgeClass = feat.badge_class || (feat.type === 'comunicado' ? 'badge-pill-comunicado' : feat.type === 'noticia' ? 'badge-pill-noticia' : 'badge-pill-blog');
        badgeParent.className = `home-blog-pill ${badgeClass}`;
      }
    }
    if (date) date.textContent = feat.date || '';
    if (title) title.textContent = feat.title;
    if (summary) summary.textContent = feat.summary;

    if (readBtn) {
      readBtn.setAttribute('href', targetUrl);
      readBtn.setAttribute('target', '_blank');
      readBtn.setAttribute('rel', 'noopener noreferrer');

      let btnLabel = feat.type === 'comunicado' ? 'Leer comunicado completo' : feat.type === 'noticia' ? 'Ver noticia completa' : 'Leer artículo completo';
      const span = readBtn.querySelector('span');
      if (span) span.textContent = btnLabel;
    }
  }

  function getFilteredItems() {
    const lang = getCurrentLang();
    return currentPostItems.map(it => getLocalizedItem(it, lang)).filter((item) => {
      const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
      if (!matchesFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const summaryMatch = (item.summary || '').toLowerCase().includes(q);
      const catMatch = (item.category || '').toLowerCase().includes(q);
      const deptMatch = (item.dept || '').toLowerCase().includes(q);
      return titleMatch || summaryMatch || catMatch || deptMatch;
    });
  }

  function renderGrid() {
    const container = document.getElementById('blogNewsGrid');
    const noResults = document.getElementById('blogNoResults');
    if (!container) return;

    const itemsToRender = getFilteredItems();

    if (itemsToRender.length === 0) {
      container.innerHTML = '';
      if (noResults) noResults.classList.remove('d-none');
      return;
    }

    if (noResults) noResults.classList.add('d-none');

    container.innerHTML = itemsToRender.map((item, index) => {
      const badgeClass = item.badge_class || (item.type === 'comunicado' ? 'badge-pill-comunicado' : item.type === 'noticia' ? 'badge-pill-noticia' : 'badge-pill-blog');
      const badgeIcon = item.type === 'comunicado' ? 'fa-bullhorn' : item.type === 'noticia' ? 'fa-newspaper' : 'fa-bookmark';

      const lang = getCurrentLang();
      let btnText = item.type === 'comunicado' ? 'Ver comunicado' : 'Leer más';
      if (lang === 'en') btnText = item.type === 'comunicado' ? 'View statement' : 'Read more';
      else if (lang === 'al') btnText = item.type === 'comunicado' ? 'Mitteilung ansehen' : 'Weiterlesen';
      else if (lang === 'pt') btnText = item.type === 'comunicado' ? 'Ver comunicado' : 'Ler mais';
      else if (lang === 'fr') btnText = item.type === 'comunicado' ? 'Voir communiqué' : 'Lire la suite';

      const targetUrl = `blog/articulo.html?id=${encodeURIComponent(item.id || index)}`;

      return `
        <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="${(0.1 + (index % 3) * 0.15).toFixed(2)}s">
          <div class="service-item service-card blog-card h-100 p-4 d-flex flex-column blog-card-clickable" data-post-id="${item.id || index}">
            ${renderCardMediaHtml(item, targetUrl, `
              <span class="home-blog-pill ${badgeClass}">
                <i class="fa ${badgeIcon} me-1"></i> ${item.category}
              </span>
            `)}
            <div class="service-card-body d-flex flex-column flex-grow-1">
              <h4 class="service-card-title mb-2">
                <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="post-title-link">${item.title}</a>
              </h4>
              <p class="service-card-text mb-3 flex-grow-1 text-muted" style="font-size: 0.92rem; line-height: 1.55;">${item.summary}</p>
              <div class="home-blog-meta mb-3 pt-2 border-top d-flex align-items-center justify-content-between text-muted">
                <span><i class="far fa-calendar-alt text-muted me-1"></i> ${item.date}</span>
                <span><i class="far fa-clock text-muted me-1"></i> ${item.read_time || '3 min'}</span>
              </div>
              <div class="mt-auto">
                <a class="btn-slide" href="${targetUrl}" target="_blank" rel="noopener noreferrer">
                  <i class="fa fa-arrow-right"></i><span>${btnText}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to cards to open article in new tab
    container.querySelectorAll('.blog-card-clickable').forEach((card) => {
      const postId = card.getAttribute('data-post-id');
      const post = currentPostItems.find((p, idx) => (p.id || String(idx)) === postId);
      if (!post) return;

      card.addEventListener('click', function (e) {
        if (e.target.closest('a')) {
          return;
        }
        window.open(`blog/articulo.html?id=${encodeURIComponent(post.id || '')}`, '_blank', 'noopener,noreferrer');
      });
    });
  }

  function initFilterButtons() {
    const buttons = document.querySelectorAll('.blog-filter-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', function () {
        buttons.forEach((b) => b.classList.remove('active'));
        this.classList.add('active');
        activeFilter = this.getAttribute('data-filter') || 'all';
        renderGrid();
      });
    });
  }

  function initSearchInput() {
    const input = document.getElementById('blogSearchInput');
    if (!input) return;

    input.addEventListener('input', function () {
      searchQuery = this.value || '';
      renderGrid();
    });
  }

  function renderBlogPage(lang) {
    const content = getPageContent(lang);
    if (content) {
      if (content.latest && Array.isArray(content.latest.items)) {
        currentPostItems = content.latest.items;
      } else {
        currentPostItems = [];
      }
      renderFeatured(content);
      renderGrid();
    }

    // Consultar API del backend
    const apiUrl = getBackendApiUrl('php/noticias_api.php?status=published');
    fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    })
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(data => {
        if (data && data.success && Array.isArray(data.items)) {
          const published = data.items.filter(p => (p.status || 'draft') === 'published');
          if (published.length > 0) {
            const featured = published.find(p => p.is_featured) || published[0];
            const latestItems = published.filter(p => p !== featured);

            currentPostItems = latestItems;
            renderFeatured({ featured: featured });
            renderGrid();
          } else {
            currentPostItems = [];
            renderFeatured({ featured: null });
            renderGrid();
          }

          try {
            localStorage.setItem('seloasa_blog_posts', JSON.stringify(data.items));
          } catch (_) { }
        }
      })
      .catch(err => console.warn('Fetch noticias API error en blog-page:', err));
  }

  document.addEventListener('DOMContentLoaded', function () {
    initFilterButtons();
    initSearchInput();
    renderBlogPage(getCurrentLang());
  });

  document.addEventListener('site-language-changed', function (event) {
    renderBlogPage(event.detail && event.detail.lang ? event.detail.lang : getCurrentLang());
  });
})();
