/**
 * SELOASA - Sistema de Gestión y Consentimiento de Cookies (GDPR / LFPDPPP)
 * Proporciona un banner interactivo, persistencia en localStorage y cookies,
 * integración con Google Analytics (Consent Mode v2) y soporte multilingüe.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'seloasa_cookie_consent';
  var COOKIE_NAME = 'seloasa_cookie_consent';

  var I18N_COOKIES = {
    es: {
      title: 'Control de Cookies y Privacidad',
      badge: 'Cumplimiento Normativo',
      desc: 'Utilizamos cookies técnicas necesarias para el funcionamiento del portal y cookies analíticas para medir el rendimiento de manera anónima conforme a nuestro <a href="privacy-notice/" target="_blank" class="cookie-policy-link">Aviso de Privacidad</a>.',
      accept_all: 'Aceptar Todas',
      only_necessary: 'Solo Necesarias',
      configure: 'Personalizar',
      save: 'Guardar Elección',
      necessary_title: 'Cookies Técnicas Necesarias',
      necessary_badge: 'Obligatorias',
      necessary_desc: 'Indispensables para la navegación, seguridad de sesión y visualización de recursos.',
      analytics_title: 'Cookies Analíticas y Métricas',
      analytics_desc: 'Nos permiten medir visitas y fuentes de tráfico para optimizar la plataforma.',
      close: 'Cerrar'
    },
    en: {
      title: 'Cookie Consent & Privacy',
      badge: 'Regulatory Compliance',
      desc: 'We use necessary cookies for site operation and optional analytics cookies to measure performance anonymously in accordance with our <a href="privacy-notice/" target="_blank" class="cookie-policy-link">Privacy Notice</a>.',
      accept_all: 'Accept All',
      only_necessary: 'Necessary Only',
      configure: 'Customize',
      save: 'Save Choice',
      necessary_title: 'Strictly Necessary Cookies',
      necessary_badge: 'Required',
      necessary_desc: 'Essential for browsing, session security, and technical operations.',
      analytics_title: 'Analytics & Performance Cookies',
      analytics_desc: 'Help us measure traffic and page interactions to improve load speeds.',
      close: 'Close'
    },
    al: {
      title: 'Cookie-Einstellungen & Datenschutz',
      badge: 'Datenschutzkonform',
      desc: 'Wir verwenden technisch notwendige Cookies sowie analytische Cookies zur anonymen Reichweitenmessung gemäß unserer <a href="privacy-notice/" target="_blank" class="cookie-policy-link">Datenschutzerklärung</a>.',
      accept_all: 'Alle akzeptieren',
      only_necessary: 'Nur notwendige',
      configure: 'Anpassen',
      save: 'Auswahl speichern',
      necessary_title: 'Notwendige Cookies',
      necessary_badge: 'Pflicht',
      necessary_desc: 'Unerlässlich für Sicherheit, Navigation und Grundfunktionen.',
      analytics_title: 'Analyse-Cookies',
      analytics_desc: 'Helfen uns, Nutzungsmuster anonym zu verstehen und Ladezeiten zu verbessern.',
      close: 'Schließen'
    },
    pt: {
      title: 'Controle de Cookies e Privacidade',
      badge: 'Conformidade',
      desc: 'Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos para medir o tráfego anonimamente de acordo com nosso <a href="privacy-notice/" target="_blank" class="cookie-policy-link">Aviso de Privacidade</a>.',
      accept_all: 'Aceitar Todos',
      only_necessary: 'Apenas Necessários',
      configure: 'Personalizar',
      save: 'Salvar Escolha',
      necessary_title: 'Cookies Necessários',
      necessary_badge: 'Obrigatórios',
      necessary_desc: 'Essenciais para navegação, segurança de sessão e operação técnica.',
      analytics_title: 'Cookies Analíticos',
      analytics_desc: 'Permitem medir o tráfego anônimo para aprimorar a plataforma.',
      close: 'Fechar'
    },
    fr: {
      title: 'Gestion des Cookies et Confidentialité',
      badge: 'Conformité',
      desc: 'Nous utilisons des cookies indispensables au fonctionnement du site et des cookies d’analyse pour mesurer anonymement les performances, conformément à notre <a href="privacy-notice/" target="_blank" class="cookie-policy-link">Avis de Confidentialité</a>.',
      accept_all: 'Tout Accepter',
      only_necessary: 'Nécessaires Seuls',
      configure: 'Personnaliser',
      save: 'Enregistrer',
      necessary_title: 'Cookies Nécessaires',
      necessary_badge: 'Obligatoire',
      necessary_desc: 'Indispensables pour la navigation, la sécurité et les fonctionnalités de base.',
      analytics_title: 'Cookies Analytiques',
      analytics_desc: 'Permettent de mesurer le trafic de manière anonyme afin d’optimiser le site.',
      close: 'Fermer'
    }
  };

  function getCurrentLang() {
    var docLang = document.documentElement.lang || 'es';
    docLang = docLang.toLowerCase().slice(0, 2);
    if (docLang === 'de') docLang = 'al';
    return I18N_COOKIES[docLang] ? docLang : 'es';
  }

  function getConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // Fallback a cookie
    }
    var match = document.cookie.match(new RegExp('(^|;\\s*)' + COOKIE_NAME + '=([^;]*)'));
    if (match) {
      return {
        status: match[2],
        analytics: match[2] === 'all',
        necessary: true
      };
    }
    return null;
  }

  function setConsent(choice) {
    var data = {
      status: choice.analytics ? 'all' : 'necessary',
      necessary: true,
      analytics: Boolean(choice.analytics),
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage no disponible para cookies');
    }

    // Persistir cookie por 365 días
    var maxAge = 365 * 24 * 60 * 60;
    document.cookie = COOKIE_NAME + '=' + data.status + '; max-age=' + maxAge + '; path=/; SameSite=Lax';

    // Actualizar Google Consent Mode si gtag está presente
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: data.analytics ? 'granted' : 'denied'
      });
    }

    hideBanner();
  }

  var bannerEl = null;

  function createBannerHtml() {
    var lang = getCurrentLang();
    var t = I18N_COOKIES[lang] || I18N_COOKIES.es;

    return `
      <div id="seloasaCookieBanner" class="seloasa-cookie-banner" role="dialog" aria-modal="false" aria-label="${t.title}">
        <div class="seloasa-cookie-card">
          <div class="seloasa-cookie-head">
            <div class="seloasa-cookie-icon"><i class="fa fa-cookie-bite"></i></div>
            <div class="seloasa-cookie-titles">
              <span class="seloasa-cookie-badge">${t.badge}</span>
              <h5 class="seloasa-cookie-title mb-0">${t.title}</h5>
            </div>
            <button type="button" class="seloasa-cookie-close-btn" id="seloasaCookieClose" aria-label="${t.close}">&times;</button>
          </div>
          
          <p class="seloasa-cookie-text mb-2">${t.desc}</p>
          
          <div id="seloasaCookiePrefsBox" class="seloasa-cookie-prefs-box d-none mb-3">
            <div class="seloasa-cookie-opt border-bottom pb-2 mb-2">
              <div class="d-flex align-items-center justify-content-between">
                <span class="fw-bold small text-dark">${t.necessary_title}</span>
                <span class="badge bg-secondary-subtle text-secondary small px-2 py-1">${t.necessary_badge}</span>
              </div>
              <p class="small text-muted mb-0 mt-1">${t.necessary_desc}</p>
            </div>
            <div class="seloasa-cookie-opt">
              <div class="d-flex align-items-center justify-content-between">
                <label class="form-check-label fw-bold small text-dark mb-0" for="seloasaCookieAnalyticsCheck" style="cursor: pointer;">${t.analytics_title}</label>
                <div class="form-check form-switch mb-0">
                  <input class="form-check-input" type="checkbox" role="switch" id="seloasaCookieAnalyticsCheck" checked style="cursor: pointer;">
                </div>
              </div>
              <p class="small text-muted mb-0 mt-1">${t.analytics_desc}</p>
            </div>
          </div>

          <div class="seloasa-cookie-actions">
            <button type="button" id="seloasaCookieAcceptAll" class="btn btn-primary btn-sm rounded-pill px-3 py-2 fw-bold text-nowrap">${t.accept_all}</button>
            <button type="button" id="seloasaCookieNecessaryOnly" class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-2 fw-semibold text-nowrap">${t.only_necessary}</button>
            <button type="button" id="seloasaCookieTogglePrefs" class="btn btn-link btn-sm text-muted p-0 text-decoration-none fw-semibold ms-auto text-nowrap">${t.configure}</button>
            <button type="button" id="seloasaCookieSavePrefs" class="btn btn-dark btn-sm rounded-pill px-3 py-2 fw-bold d-none text-nowrap">${t.save}</button>
          </div>
        </div>
      </div>
    `;
  }

  function showBanner() {
    if (!bannerEl) {
      var wrapper = document.createElement('div');
      wrapper.innerHTML = createBannerHtml();
      bannerEl = wrapper.firstElementChild;
      document.body.appendChild(bannerEl);
      bindEvents();
    }

    setTimeout(function () {
      if (bannerEl) bannerEl.classList.add('show');
    }, 100);
  }

  function hideBanner() {
    if (bannerEl) {
      bannerEl.classList.remove('show');
      setTimeout(function () {
        if (bannerEl && bannerEl.parentNode) {
          bannerEl.parentNode.removeChild(bannerEl);
          bannerEl = null;
        }
      }, 400);
    }
  }

  function bindEvents() {
    if (!bannerEl) return;

    var acceptAllBtn = bannerEl.querySelector('#seloasaCookieAcceptAll');
    var necessaryBtn = bannerEl.querySelector('#seloasaCookieNecessaryOnly');
    var togglePrefsBtn = bannerEl.querySelector('#seloasaCookieTogglePrefs');
    var savePrefsBtn = bannerEl.querySelector('#seloasaCookieSavePrefs');
    var closeBtn = bannerEl.querySelector('#seloasaCookieClose');
    var prefsBox = bannerEl.querySelector('#seloasaCookiePrefsBox');
    var analyticsCheck = bannerEl.querySelector('#seloasaCookieAnalyticsCheck');

    if (acceptAllBtn) {
      acceptAllBtn.addEventListener('click', function () {
        setConsent({ analytics: true });
      });
    }

    if (necessaryBtn) {
      necessaryBtn.addEventListener('click', function () {
        setConsent({ analytics: false });
      });
    }

    if (togglePrefsBtn && prefsBox) {
      togglePrefsBtn.addEventListener('click', function () {
        var isHidden = prefsBox.classList.contains('d-none');
        if (isHidden) {
          prefsBox.classList.remove('d-none');
          togglePrefsBtn.classList.add('d-none');
          if (savePrefsBtn) savePrefsBtn.classList.remove('d-none');
          if (acceptAllBtn) acceptAllBtn.classList.add('d-none');
          if (necessaryBtn) necessaryBtn.classList.add('d-none');
        }
      });
    }

    if (savePrefsBtn) {
      savePrefsBtn.addEventListener('click', function () {
        var wantsAnalytics = analyticsCheck ? analyticsCheck.checked : false;
        setConsent({ analytics: wantsAnalytics });
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        // Al cerrar sin aceptar se asume solo necesarias
        setConsent({ analytics: false });
      });
    }
  }

  // Inicialización automática
  function init() {
    var existingConsent = getConsent();
    if (!existingConsent) {
      setTimeout(showBanner, 800);
    } else {
      // Si ya hay consentimiento previo, aplicar al gtag
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: existingConsent.analytics ? 'granted' : 'denied'
        });
      }
    }
  }

  // Exponer API global para reabrir preferencias desde el footer
  window.openCookieConsent = function () {
    showBanner();
    if (bannerEl) {
      var prefsBox = bannerEl.querySelector('#seloasaCookiePrefsBox');
      var togglePrefsBtn = bannerEl.querySelector('#seloasaCookieTogglePrefs');
      var savePrefsBtn = bannerEl.querySelector('#seloasaCookieSavePrefs');
      var acceptAllBtn = bannerEl.querySelector('#seloasaCookieAcceptAll');
      var necessaryBtn = bannerEl.querySelector('#seloasaCookieNecessaryOnly');
      if (prefsBox) prefsBox.classList.remove('d-none');
      if (togglePrefsBtn) togglePrefsBtn.classList.add('d-none');
      if (savePrefsBtn) savePrefsBtn.classList.remove('d-none');
      if (acceptAllBtn) acceptAllBtn.classList.add('d-none');
      if (necessaryBtn) necessaryBtn.classList.add('d-none');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
