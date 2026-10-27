(function () {
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
      if (storedPosts) {
        const posts = JSON.parse(storedPosts);
        if (Array.isArray(posts) && posts.length > 0) {
          const published = posts.filter(p => p.status !== 'draft');
          const featured = published.find(p => p.is_featured || p.id === 'featured') || published[0];
          const latestItems = published.filter(p => p !== featured);

          return {
            ...baseContent,
            featured: featured ? { ...featured } : null,
            latest: {
              ...baseContent.latest,
              items: latestItems
            }
          };
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

  function renderFeatured(content) {
    if (!content || !content.featured) return;
    const lang = getCurrentLang();
    const feat = getLocalizedItem(content.featured, lang);
    featuredPost = feat;

    const image = document.getElementById('blogFeaturedImage');
    const kicker = document.getElementById('blogFeaturedKicker');
    const category = document.getElementById('blogFeaturedCategory');
    const date = document.getElementById('blogFeaturedDate');
    const title = document.getElementById('blogFeaturedTitle');
    const summary = document.getElementById('blogFeaturedSummary');
    const readBtn = document.getElementById('blogFeaturedReadBtn');

    if (image) {
      image.src = feat.image;
      image.alt = feat.image_alt || feat.title;
    }
    if (kicker) kicker.textContent = feat.kicker;
    if (category) {
      category.textContent = feat.category;
      category.className = `blog-meta-pill ${feat.badge_class || 'badge-pill-comunicado'}`;
    }
    if (date) date.textContent = feat.date;
    if (title) title.textContent = feat.title;
    if (summary) summary.textContent = feat.summary;

    if (readBtn) {
      const featId = (feat && feat.id) ? feat.id : 'comunicado-gdp-2026';
      readBtn.setAttribute('href', `blog/${encodeURIComponent(featId)}`);
      readBtn.setAttribute('target', '_blank');
      readBtn.setAttribute('rel', 'noopener noreferrer');
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

      const targetUrl = `blog/${encodeURIComponent(item.id || index)}`;

      return `
        <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="${(0.1 + (index % 3) * 0.15).toFixed(2)}s">
          <div class="service-item service-card blog-card h-100 p-4 d-flex flex-column blog-card-clickable" data-post-id="${item.id || index}">
            <div class="overflow-hidden service-media mb-3 position-relative">
              <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="d-block">
                <img src="${item.image}" alt="${item.image_alt || item.title}" class="img-fluid w-100" style="height: 220px; object-fit: cover;" loading="lazy">
              </a>
              <span class="home-blog-pill ${badgeClass}">
                <i class="fa ${badgeIcon} me-1"></i> ${item.category}
              </span>
            </div>
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
        window.open(`blog/${encodeURIComponent(post.id || '')}`, '_blank', 'noopener,noreferrer');
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

    // Consultar Base de Datos MySQL
    fetch('php/noticias_api.php?status=published')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.items) && data.items.length > 0) {
          const published = data.items;
          const featured = published.find(p => p.is_featured || p.id === 'featured') || published[0];
          const latestItems = published.filter(p => p !== featured);

          currentPostItems = latestItems;
          renderFeatured({ featured: featured });
          renderGrid();
        }
      })
      .catch(err => console.warn('Fetch noticias BD error en blog-page:', err));
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
