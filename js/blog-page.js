(function () {
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
    return (window.I18N_PAGE_TRANSLATIONS
      && window.I18N_PAGE_TRANSLATIONS[safeLang]
      && window.I18N_PAGE_TRANSLATIONS[safeLang].blogPage)
      || (window.I18N_PAGE_TRANSLATIONS
      && window.I18N_PAGE_TRANSLATIONS.es
      && window.I18N_PAGE_TRANSLATIONS.es.blogPage)
      || null;
  }

  function renderFeatured(content) {
    if (!content || !content.featured) return;

    const image = document.getElementById('blogFeaturedImage');
    const kicker = document.getElementById('blogFeaturedKicker');
    const category = document.getElementById('blogFeaturedCategory');
    const date = document.getElementById('blogFeaturedDate');
    const title = document.getElementById('blogFeaturedTitle');
    const summary = document.getElementById('blogFeaturedSummary');

    if (image) {
      image.src = content.featured.image;
      image.alt = content.featured.image_alt;
    }
    if (kicker) kicker.textContent = content.featured.kicker;
    if (category) category.textContent = content.featured.category;
    if (date) date.textContent = content.featured.date;
    if (title) title.textContent = content.featured.title;
    if (summary) summary.textContent = content.featured.summary;
  }

  function renderLatest(content) {
    const container = document.getElementById('blogNewsGrid');
    if (!container || !content || !content.latest || !Array.isArray(content.latest.items)) return;

    container.innerHTML = content.latest.items.map((item) => `
      <div class="col-lg-4 col-md-6">
        <article class="blog-news-card h-100">
          <div class="blog-news-image-shell">
            <img src="${item.image}" alt="${item.image_alt}" class="img-fluid w-100 blog-news-image">
          </div>
          <div class="blog-news-body">
            <div class="blog-news-top">
              <span class="blog-news-category">${item.category}</span>
              <span class="blog-news-date">${item.date}</span>
            </div>
            <h3 class="blog-news-title">${item.title}</h3>
            <p class="blog-news-summary mb-0">${item.summary}</p>
          </div>
        </article>
      </div>
    `).join('');
  }

  function renderBlogPage(lang) {
    const content = getPageContent(lang);
    if (!content) return;
    renderFeatured(content);
    renderLatest(content);
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderBlogPage(getCurrentLang());
  });

  document.addEventListener('site-language-changed', function (event) {
    renderBlogPage(event.detail && event.detail.lang ? event.detail.lang : getCurrentLang());
  });
})();
