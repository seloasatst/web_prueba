(function () {
  const STORAGE_KEY = 'site-language';
  const DEFAULT_LANG = 'es';
  const LANGUAGE_META = {
    es: { code: 'ES', flagSrc: 'img/flags/mx.svg' },
    en: { code: 'EN', flagSrc: 'img/flags/us.svg' },
    al: { code: 'DE', flagSrc: 'img/flags/de.svg' },
    pt: { code: 'PT', flagSrc: 'img/flags/br.svg' },
    fr: { code: 'FR', flagSrc: 'img/flags/fr.svg' }
  };

  function isObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function mergeDeep(target, source) {
    const output = { ...(target || {}) };
    if (!isObject(source)) return output;

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];
      const targetValue = output[key];

      if (isObject(sourceValue) && isObject(targetValue)) {
        output[key] = mergeDeep(targetValue, sourceValue);
      } else {
        output[key] = sourceValue;
      }
    });

    return output;
  }

  let currentLang = normalizeLang(localStorage.getItem(STORAGE_KEY) || document.documentElement.lang || DEFAULT_LANG);
  let translations = {};
  let loadPromise = null;

  function normalizeLang(lang) {
    if (!lang) return DEFAULT_LANG;
    const value = String(lang).toLowerCase();
    if (value === 'de') return 'al';
    return ['es', 'en', 'al', 'pt', 'fr'].includes(value) ? value : DEFAULT_LANG;
  }

  function getByPath(obj, path) {
    return path.split('.').reduce((acc, part) => (acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined), obj);
  }

  async function loadTranslations(lang) {
    const safeLang = normalizeLang(lang);
    const response = await fetch(`lang/${safeLang}.json`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`No se pudo cargar el idioma: ${safeLang}`);
    const base = await response.json();
    const pageTranslations = window.I18N_PAGE_TRANSLATIONS && window.I18N_PAGE_TRANSLATIONS[safeLang]
      ? window.I18N_PAGE_TRANSLATIONS[safeLang]
      : null;
    return pageTranslations ? mergeDeep(base, pageTranslations) : base;
  }

  function applyTranslations(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.getAttribute('data-i18n');
      const value = getByPath(translations, key);
      if (typeof value === 'string') {
        element.textContent = value;
      }
    });

    root.querySelectorAll('[data-i18n-html]').forEach((element) => {
      const key = element.getAttribute('data-i18n-html');
      const value = getByPath(translations, key);
      if (typeof value === 'string') {
        element.innerHTML = value;
      }
    });

    root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      const key = element.getAttribute('data-i18n-placeholder');
      const value = getByPath(translations, key);
      if (typeof value === 'string') {
        element.setAttribute('placeholder', value);
      }
    });

    root.querySelectorAll('[data-i18n-alt]').forEach((element) => {
      const key = element.getAttribute('data-i18n-alt');
      const value = getByPath(translations, key);
      if (typeof value === 'string') {
        element.setAttribute('alt', value);
      }
    });

    root.querySelectorAll('[data-i18n-content]').forEach((element) => {
      const key = element.getAttribute('data-i18n-content');
      const value = getByPath(translations, key);
      if (typeof value === 'string') {
        element.setAttribute('content', value);
      }
    });

    root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      const key = element.getAttribute('data-i18n-aria-label');
      const value = getByPath(translations, key);
      if (typeof value === 'string') {
        element.setAttribute('aria-label', value);
      }
    });

    updateLanguageUI(root);
  }

  function updateLanguageUI(root = document) {
    const currentLanguage = LANGUAGE_META[currentLang] || LANGUAGE_META[DEFAULT_LANG];

    root.querySelectorAll('.lang-code').forEach((element) => {
      element.textContent = currentLanguage.code;
    });

    root.querySelectorAll('.lang-flag-current-image').forEach((element) => {
      element.setAttribute('src', currentLanguage.flagSrc);
    });

    root.querySelectorAll('.lang-switch [data-lang]').forEach((element) => {
      const isActive = normalizeLang(element.getAttribute('data-lang')) === currentLang;
      element.classList.toggle('active', isActive);
    });
  }

  async function ensureTranslations(lang = currentLang) {
    const safeLang = normalizeLang(lang);
    if (loadPromise && safeLang === currentLang) {
      return loadPromise;
    }

    loadPromise = loadTranslations(safeLang)
      .then((data) => {
        translations = data;
        currentLang = safeLang;
        document.documentElement.lang = safeLang === 'al' ? 'de' : safeLang;
        localStorage.setItem(STORAGE_KEY, safeLang);
        applyTranslations(document);
        document.dispatchEvent(new CustomEvent('site-language-changed', {
          detail: {
            lang: currentLang,
            translations
          }
        }));
        return data;
      })
      .catch((error) => {
        console.error(error);
      });

    return loadPromise;
  }

  async function setLanguage(lang) {
    await ensureTranslations(lang);
  }

  // Use capture phase to ensure language clicks are caught before other handlers
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-lang]');
    if (!trigger) return;

    try {
      event.preventDefault();
    } catch (e) {}
    setLanguage(trigger.getAttribute('data-lang'));
  }, true);

  window.translatePage = function (root = document) {
    if (Object.keys(translations).length) {
      applyTranslations(root);
      return Promise.resolve();
    }

    return ensureTranslations(currentLang);
  };

  window.setLanguage = setLanguage;

  document.addEventListener('DOMContentLoaded', () => {
    ensureTranslations(currentLang);
  });
})();
