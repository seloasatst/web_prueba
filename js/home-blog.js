/**
 * SELOASA - Integración Dinámica de Blog y Noticias en Home
 * Carga las publicaciones publicadas desde la API de noticias (php/noticias_api.php)
 * y el almacenamiento local sincronizado por el panel de administración.
 */
(function () {
  'use strict';

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

  function getButtonText(type, lang) {
    const safeLang = normalizeLang(lang);
    if (type === 'comunicado') {
      const dict = {
        es: 'Leer comunicado',
        en: 'Read statement',
        al: 'Mitteilung ansehen',
        pt: 'Ver comunicado',
        fr: 'Voir communiqué'
      };
      return dict[safeLang] || dict.es;
    }
    if (type === 'noticia') {
      const dict = {
        es: 'Ver noticia',
        en: 'View news',
        al: 'Nachricht ansehen',
        pt: 'Ver notícia',
        fr: 'Voir actualité'
      };
      return dict[safeLang] || dict.es;
    }
    const dict = {
      es: 'Leer artículo',
      en: 'Read article',
      al: 'Artikel lesen',
      pt: 'Ler artigo',
      fr: 'Lire l\'article'
    };
    return dict[safeLang] || dict.es;
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
            <img src="${media.thumbnailUrl}" alt="${item.title}" class="img-fluid w-100" style="height: 220px; object-fit: cover;" loading="lazy" onerror="this.onerror=null;this.src='img/feature.jpg';">
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
          <img src="${media.src || 'img/feature.jpg'}" alt="${item.title}" class="img-fluid w-100" style="height: 220px; object-fit: cover;" loading="lazy" onerror="this.onerror=null;this.src='img/feature.jpg';">
        </a>
        ${badgeHtml}
      </div>
    `;
  }

  function getBadgeLabel(item, lang) {
    const safeLang = normalizeLang(lang);
    if (item.translations && item.translations[safeLang] && item.translations[safeLang].category) {
      return item.translations[safeLang].category;
    }
    if (item.type === 'comunicado') {
      const dict = {
        es: 'Comunicado Oficial',
        en: 'Official Statement',
        al: 'Offizielle Mitteilung',
        pt: 'Comunicado Oficial',
        fr: 'Communiqué Officiel'
      };
      return dict[safeLang] || item.category || dict.es;
    }
    if (item.type === 'noticia') {
      const dict = {
        es: 'Noticia Operativa',
        en: 'Operations News',
        al: 'Operative Nachricht',
        pt: 'Notícia Operacional',
        fr: 'Actualité Opérationnelle'
      };
      return dict[safeLang] || item.category || dict.es;
    }
    const dict = {
      es: 'Artículo de Blog',
      en: 'Blog Article',
      al: 'Blogbeitrag',
      pt: 'Artigo do Blog',
      fr: 'Article de Blog'
    };
    return dict[safeLang] || item.category || dict.es;
  }

  function sortPosts(items) {
    if (!Array.isArray(items)) return [];
    const published = items.filter(p => (p.status || 'draft') === 'published');
    return published.sort((a, b) => {
      const featA = a.is_featured ? 1 : 0;
      const featB = b.is_featured ? 1 : 0;
      if (featA !== featB) {
        return featB - featA;
      }
      const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
      const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });
  }

  let cachedPosts = [];

  function renderHomeBlog(postsToRender) {
    const container = document.getElementById('homeBlogCardsContainer');
    if (!container) return;

    const lang = getCurrentLang();

    // Estado cuando no hay artículos en el backend/admin
    if (!Array.isArray(postsToRender) || postsToRender.length === 0) {
      const emptyMessages = {
        es: {
          title: 'No hay publicaciones disponibles por el momento',
          desc: 'Próximamente compartiremos nuevos comunicados, notas operativas y artículos especializados.'
        },
        en: {
          title: 'No publications available at this time',
          desc: 'We will soon share new official statements, operational updates, and specialized articles.'
        },
        al: {
          title: 'Zur Zeit keine Veröffentlichungen verfügbar',
          desc: 'In Kürze werden wir neue offizielle Mitteilungen und Fachartikel veröffentlichen.'
        },
        pt: {
          title: 'Nenhuma publicação disponível no momento',
          desc: 'Em breve compartilharemos novos comunicados oficiais, notas operacionais e artigos especializados.'
        },
        fr: {
          title: 'Aucune publication disponible pour le moment',
          desc: 'Nous partagerons bientôt de nouveaux communiqués officiels, actualités et articles spécialisés.'
        }
      };
      const msg = emptyMessages[lang] || emptyMessages.es;

      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="p-4 p-md-5 rounded-3 bg-light d-inline-block shadow-sm w-100" style="max-width: 600px;">
            <i class="fa fa-newspaper fa-3x text-muted mb-3 d-block"></i>
            <h5 class="fw-bold mb-2">${msg.title}</h5>
            <p class="text-muted mb-0" style="font-size: 0.95rem;">${msg.desc}</p>
          </div>
        </div>
      `;
      return;
    }

    const top3 = postsToRender.slice(0, 3);

    container.innerHTML = top3.map((rawItem, index) => {
      const item = getLocalizedItem(rawItem, lang);
      const badgeClass = item.badge_class || (item.type === 'comunicado' ? 'badge-pill-comunicado' : item.type === 'noticia' ? 'badge-pill-noticia' : 'badge-pill-blog');
      const badgeIcon = item.type === 'comunicado' ? 'fa-bullhorn' : item.type === 'noticia' ? 'fa-newspaper' : 'fa-bookmark';
      const badgeText = getBadgeLabel(rawItem, lang);
      const btnText = getButtonText(item.type, lang);
      const targetUrl = `blog/articulo.html?id=${encodeURIComponent(item.id || index)}`;
      const delay = (0.2 * (index + 1)).toFixed(1);
      const imageSrc = item.image || 'img/feature.jpg';
      const dateText = item.date || '';
      const readTimeText = item.read_time || '3 min';

      return `
        <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="${delay}s" style="visibility: visible;">
          <div class="service-item service-card blog-card h-100 p-4 d-flex flex-column blog-card-clickable" data-post-id="${item.id || index}">
            ${renderCardMediaHtml(item, targetUrl, `
              <span class="home-blog-pill ${badgeClass}">
                <i class="fa ${badgeIcon} me-1"></i> <span>${badgeText}</span>
              </span>
            `)}
            <div class="service-card-body d-flex flex-column flex-grow-1">
              <h4 class="service-card-title mb-2">
                <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="post-title-link">${item.title}</a>
              </h4>
              <p class="service-card-text mb-3 flex-grow-1 text-muted" style="font-size: 0.92rem; line-height: 1.55;">${item.summary}</p>
              <div class="home-blog-meta mb-3 pt-2 border-top d-flex align-items-center justify-content-between text-muted">
                <span><i class="far fa-calendar-alt text-muted me-1"></i> <span class="home-blog-date">${dateText}</span></span>
                <span><i class="far fa-clock text-muted me-1"></i> ${readTimeText}</span>
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

    // Asignar evento click a cada card completa
    container.querySelectorAll('.blog-card-clickable').forEach(card => {
      card.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        const link = card.querySelector('a.post-title-link');
        if (link && link.href) {
          window.open(link.href, '_blank', 'noopener,noreferrer');
        }
      });
    });
  }

  function initHomeBlog() {
    // 1. Cargar inmediatamente desde localStorage para render sin latencia si existe
    try {
      const stored = localStorage.getItem('seloasa_blog_posts');
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          cachedPosts = sortPosts(parsed);
          renderHomeBlog(cachedPosts);
        }
      }
    } catch (e) {
      console.warn('Error leyendo posts locales en home:', e);
    }

    // 2. Consultar la API del backend para sincronizar datos frescos del admin
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
          cachedPosts = sortPosts(data.items);
          renderHomeBlog(cachedPosts);
          try {
            localStorage.setItem('seloasa_blog_posts', JSON.stringify(data.items));
          } catch (_) {}
        }
      })
      .catch(err => {
        console.warn('No se pudo sincronizar noticias_api en home:', err);
      });
  }

  document.addEventListener('DOMContentLoaded', initHomeBlog);

  document.addEventListener('site-language-changed', function () {
    renderHomeBlog(cachedPosts);
  });
})();
