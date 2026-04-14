/**
 * includePartials:
 * Recorre todo el documento buscando elementos con atributo [data-include].
 * Para cada uno:
 *  - Lee el valor de data-include (ruta del archivo .html)
 *  - Hace fetch() para obtener el contenido
 *  - Inserta ese contenido dentro del elemento
 *  - Si el contenido inyectado contiene un carousel o el spinner,
 *    llama a las funciones globales definidas en main.js para inicializarlos.
 */
function updateNavbarOffset() {
  const nav = document.querySelector('.site-navbar');
  if (!nav) return;

  const navHeight = nav.offsetHeight || 96;
  document.documentElement.style.setProperty('--nav-offset', `${navHeight}px`);
}

function updateFooterYear(root = document) {
  root.querySelectorAll('#currentYear').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
}

const NAV_ROUTE_ALIASES = {
  home: ['', 'index', 'home'],
  storage: ['storage'],
  transport: ['transport'],
  distribution: ['distribution'],
  security: ['security'],
  'about-us': ['about-us', 'about'],
  'environmental-responsibility': ['environmental-responsibility'],
  'privacy-notice': ['privacy-notice'],
  'human-rights': ['human-rights'],
  standards: ['standards'],
  contact: ['contact']
};

function getCurrentRouteSlug() {
  const siteRoot = new URL('.', document.baseURI).pathname.replace(/\/+$/, '/');
  let currentPath = window.location.pathname.replace(/\\/g, '/');
  const trimmedSiteRoot = siteRoot.replace(/\/$/, '');

  if (currentPath.toLowerCase().startsWith(siteRoot.toLowerCase())) {
    currentPath = currentPath.slice(siteRoot.length);
  } else if (currentPath.toLowerCase() === trimmedSiteRoot.toLowerCase()) {
    currentPath = '';
  } else {
    currentPath = currentPath.replace(/^\/+/, '');
  }

  return currentPath
    .toLowerCase()
    .replace(/\/index\.html$/i, '')
    .replace(/\.html$/i, '')
    .replace(/^\/+|\/+$/g, '');
}

function getCurrentNavKey() {
  const currentSlug = getCurrentRouteSlug();

  return Object.entries(NAV_ROUTE_ALIASES).find(([, aliases]) => aliases.includes(currentSlug))?.[0] || null;
}

function setActiveNavbarLink(root = document) {
  const nav = root.querySelector('.site-navbar') || document.querySelector('.site-navbar');
  if (!nav) return;

  nav.querySelectorAll('[data-nav-key].active, [data-nav-group].active').forEach((element) => {
    element.classList.remove('active');
    element.removeAttribute('aria-current');
  });

  const currentKey = getCurrentNavKey();
  if (!currentKey) return;

  const activeLink = nav.querySelector(`[data-nav-key="${currentKey}"]`);
  if (!activeLink) return;

  activeLink.classList.add('active');
  activeLink.setAttribute('aria-current', 'page');

  const parentGroup = activeLink.getAttribute('data-nav-parent');
  if (!parentGroup) return;

  const parentToggle = nav.querySelector(`[data-nav-group="${parentGroup}"]`);
  parentToggle?.classList.add('active');
}

async function includePartials() {
  const includeEls = document.querySelectorAll('[data-include]');
  if (!includeEls.length) return;

  for (const el of includeEls) {
    const partialPath = el.getAttribute('data-include');
    if (!partialPath) continue;

    try {
      const response = await fetch(partialPath);
      if (!response.ok) {
        console.error(`Error cargando '${partialPath}': ${response.status}`);
        continue;
      }

      const html = await response.text();
      el.innerHTML = html;

      if (typeof window.optimizeMediaLoading === 'function') {
        window.optimizeMediaLoading(el);
      }

      if (html.includes('header-carousel') && typeof window.initCarousels === 'function') {
        window.initCarousels();
      }

      if (document.getElementById('spinner') && typeof window.initSpinner === 'function') {
        window.initSpinner();
      }

      if (typeof translatePage === 'function') {
        translatePage();
      }

      updateFooterYear(el);

      if (html.includes('site-navbar')) {
        setActiveNavbarLink(el);
        requestAnimationFrame(updateNavbarOffset);
        setTimeout(updateNavbarOffset, 150);
      }
    } catch (error) {
      console.error(`Error haciendo fetch a '${partialPath}':`, error);
    }
  }

  updateNavbarOffset();
  updateFooterYear(document);
  setActiveNavbarLink(document);
}

document.addEventListener('DOMContentLoaded', includePartials);
window.addEventListener('load', updateNavbarOffset);
window.addEventListener('resize', updateNavbarOffset);
