/**
 * SELOASA - Motor de Pop-ups y Avisos Emergentes en el Sitio Web
 * Gestiona la visualización de avisos oficiales, alertas COFEPRIS y comunicados
 * con soporte para 4 diseños visuales (Top, Left, Right, BG), 3 estilos temáticos,
 * botones de acción opcionales (ocultos si no se definen) y sin etiquetas fijas invasivas.
 */
(function () {
  'use strict';

  const STORAGE_KEY_POPUPS = 'seloasa_site_popups';
  const STORAGE_KEY_ACTIVE_ID = 'seloasa_active_popup_id';
  const SESSION_DISMISSED_PREFIX = 'seloasa_popup_dismissed_';

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getPopups() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_POPUPS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading popups from localStorage:', e);
    }
    return [];
  }

  function getActivePopup() {
    const popups = getPopups();
    const active = popups.find(p => p.active === true);
    if (active) return active;

    const explicitActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    if (explicitActiveId) {
      const found = popups.find(p => p.id === explicitActiveId);
      if (found) return found;
    }

    return null;
  }

  function isDismissedInSession(popupId) {
    try {
      return Boolean(sessionStorage.getItem(SESSION_DISMISSED_PREFIX + popupId));
    } catch (e) {
      return false;
    }
  }

  function markDismissedInSession(popupId) {
    try {
      sessionStorage.setItem(SESSION_DISMISSED_PREFIX + popupId, 'true');
    } catch (e) {
      // Ignorar si storage restringido
    }
  }

  function normalizeLang(lang) {
    if (!lang) return 'es';
    const value = String(lang).toLowerCase();
    if (value === 'de') return 'al';
    return ['es', 'en', 'al', 'pt', 'fr'].includes(value) ? value : 'es';
  }

  function getCurrentLang() {
    return normalizeLang(localStorage.getItem('site-language') || document.documentElement.lang || 'es');
  }

  function getLocalizedPopup(popup, lang) {
    if (!popup) return popup;
    const safeLang = normalizeLang(lang);
    const t = (popup.translations && popup.translations[safeLang]) ? popup.translations[safeLang] : null;
    if (!t) return popup;
    return {
      ...popup,
      title: t.title || popup.title,
      subtitle: t.subtitle !== undefined ? t.subtitle : popup.subtitle,
      message: t.message || popup.message,
      btn_primary_text: t.btn_primary_text !== undefined ? t.btn_primary_text : popup.btn_primary_text,
      btn_secondary_text: t.btn_secondary_text !== undefined ? t.btn_secondary_text : popup.btn_secondary_text,
      custom_footer: t.custom_footer !== undefined ? t.custom_footer : popup.custom_footer
    };
  }

  let currentlyDisplayedRawPopup = null;

  function createPopupOverlay(rawPopup) {
    if (!rawPopup) return null;
    currentlyDisplayedRawPopup = rawPopup;
    const popup = getLocalizedPopup(rawPopup, getCurrentLang());

    const existing = document.getElementById('seloasaSitePopupOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'seloasaSitePopupOverlay';
    overlay.className = 'seloasa-popup-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const typeKey = popup.type === 'alerta' ? 'alerta' : popup.type === 'comunicado' ? 'comunicado' : 'informativo';
    const layoutKey = ['top', 'left', 'right', 'bg'].includes(popup.layout) ? popup.layout : 'top';

    const footerTag = popup.custom_footer ? `
      <span class="seloasa-popup-footer-tag">
        <i class="fa fa-certificate me-1"></i> ${escapeHtml(popup.custom_footer)}
      </span>
    ` : (typeKey === 'alerta'
      ? '<span class="seloasa-popup-footer-tag"><i class="fa fa-shield-alt me-1"></i> Circular Normativa COFEPRIS</span>'
      : typeKey === 'comunicado'
      ? '<span class="seloasa-popup-footer-tag"><i class="fa fa-building me-1"></i> Comunicado Oficial SELOASA</span>'
      : '<span class="seloasa-popup-footer-tag"><i class="fa fa-info-circle me-1"></i> Atención al Cliente & Monitoreo 24/7</span>');

    // Botones de acción opcionales
    const hasPrimary = Boolean(popup.btn_primary_text && popup.btn_primary_text.trim());
    const hasSecondary = Boolean(popup.btn_secondary_text && popup.btn_secondary_text.trim());

    let actionsHtml = '';
    if (hasPrimary || hasSecondary) {
      actionsHtml = `
        <div class="seloasa-popup-actions">
          ${hasPrimary ? `
            <a href="${popup.btn_primary_url ? popup.btn_primary_url : 'javascript:void(0)'}" class="seloasa-popup-btn-primary" id="btnPopupPrimaryAction">
              <span>${popup.btn_primary_text}</span>
              <i class="fa fa-arrow-right"></i>
            </a>
          ` : ''}
          ${hasSecondary ? `
            <button type="button" class="seloasa-popup-btn-secondary" id="btnPopupSecondaryAction">
              ${popup.btn_secondary_text}
            </button>
          ` : ''}
        </div>
      `;
    }

    const footerHtml = `
      <div class="seloasa-popup-footer">
        <div class="seloasa-popup-footer-brand">
          <img src="img/logotipo.png" alt="SELOASA">
          <span>Servicios Logísticos Alsera</span>
        </div>
        ${footerTag}
      </div>
    `;

    let cardHtml = '';

    // ==========================================
    // 1. LAYOUT BG (IMAGEN DE FONDO COMPLETO)
    // ==========================================
    if (layoutKey === 'bg') {
      const bgStyle = popup.image
        ? `background-image: url('${popup.image}');`
        : 'background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);';

      cardHtml = `
        <div class="seloasa-popup-card style-${typeKey} layout-bg" id="seloasaPopupCard" style="${bgStyle}">
          <div class="seloasa-popup-bg-overlay"></div>
          <button type="button" class="seloasa-popup-close-btn" id="btnCloseSeloasaPopup" aria-label="Cerrar aviso">
            <i class="fa fa-times"></i>
          </button>
          <div class="seloasa-popup-content">
            ${popup.subtitle ? `<div class="seloasa-popup-subtitle">${popup.subtitle}</div>` : ''}
            <h3 class="seloasa-popup-title">${popup.title}</h3>
            <div class="seloasa-popup-message">
              ${popup.message}
            </div>
            ${actionsHtml}
            ${footerHtml}
          </div>
        </div>
      `;
    }
    // ==========================================
    // 2 & 3. LAYOUT LEFT / RIGHT (SPLIT HORIZONTAL)
    // ==========================================
    else if (layoutKey === 'left' || layoutKey === 'right') {
      const imgSideHtml = popup.image ? `
        <div class="seloasa-popup-hero-img-wrap">
          <img src="${popup.image}" alt="${popup.title || ''}" class="seloasa-popup-hero-img" onerror="this.parentElement.style.display='none'">
        </div>
      ` : '';

      cardHtml = `
        <div class="seloasa-popup-card style-${typeKey} layout-${layoutKey}" id="seloasaPopupCard">
          <button type="button" class="seloasa-popup-close-btn" id="btnCloseSeloasaPopup" aria-label="Cerrar aviso">
            <i class="fa fa-times"></i>
          </button>
          ${imgSideHtml}
          <div class="seloasa-popup-content">
            ${popup.subtitle ? `<div class="seloasa-popup-subtitle">${popup.subtitle}</div>` : ''}
            <h3 class="seloasa-popup-title">${popup.title}</h3>
            <div class="seloasa-popup-message">
              ${popup.message}
            </div>
            ${actionsHtml}
            ${footerHtml}
          </div>
        </div>
      `;
    }
    // ==========================================
    // 4. LAYOUT TOP (BANNER ARRIBA - CLÁSICO)
    // ==========================================
    else {
      const imageTopHtml = popup.image ? `
        <div class="seloasa-popup-hero-img-wrap">
          <img src="${popup.image}" alt="${popup.title || ''}" class="seloasa-popup-hero-img" onerror="this.parentElement.style.display='none'">
        </div>
      ` : '';

      cardHtml = `
        <div class="seloasa-popup-card style-${typeKey} layout-top" id="seloasaPopupCard">
          <button type="button" class="seloasa-popup-close-btn" id="btnCloseSeloasaPopup" aria-label="Cerrar aviso">
            <i class="fa fa-times"></i>
          </button>
          ${imageTopHtml}
          <div class="seloasa-popup-content">
            ${popup.subtitle ? `<div class="seloasa-popup-subtitle">${popup.subtitle}</div>` : ''}
            <h3 class="seloasa-popup-title">${popup.title}</h3>
            <div class="seloasa-popup-message">
              ${popup.message}
            </div>
            ${actionsHtml}
            ${footerHtml}
          </div>
        </div>
      `;
    }

    overlay.innerHTML = cardHtml;
    document.body.appendChild(overlay);

    // Eventos de cierre
    function closePopup() {
      overlay.classList.remove('active');
      markDismissedInSession(popup.id);
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 400);
    }

    document.getElementById('btnCloseSeloasaPopup')?.addEventListener('click', closePopup);
    document.getElementById('btnPopupSecondaryAction')?.addEventListener('click', closePopup);

    // Cerrar al hacer clic en el backdrop oscurecido fuera de la tarjeta
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closePopup();
      }
    });

    // Cerrar con tecla Escape
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closePopup();
        document.removeEventListener('keydown', escHandler);
      }
    });

    return overlay;
  }

  function showPopup(popup) {
    if (!popup) return;
    const overlay = createPopupOverlay(popup);
    // Forzar reflow para animación suave
    setTimeout(() => {
      overlay.classList.add('active');
    }, 50);
  }

  function initSitePopup() {
    // Si estamos en páginas de administración o edición, no auto-lanzar el popup
    if (window.location.pathname.includes('/admin/') || window.location.pathname.includes('editor')) {
      return;
    }

    function getBackendApiUrl(endpoint) {
      if (typeof window.getBackendApiUrl === 'function') {
        return window.getBackendApiUrl(endpoint);
      }
      const isFile = window.location.protocol === 'file:';
      const port = window.location.port;
      const isDevServer = port && port !== '80' && port !== '443';
      if (isFile || isDevServer) {
        const host = window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1';
        return `http://${host}/shipping/` + endpoint.replace(/^\/+/, '');
      }
      return endpoint;
    }

    // Consultar el pop-up activo en la API
    fetch(getBackendApiUrl('php/popup_api.php?active=1'))
      .then(res => res.json())
      .then(data => {
        const activePopup = (data && data.success && data.popup && data.popup.active) ? data.popup : null;
        if (!activePopup) return;

        // Regla de frecuencia: si es por sesión y ya se cerró en esta sesión, no volver a mostrar
        if (activePopup.frequency === 'session' && isDismissedInSession(activePopup.id)) {
          return;
        }

        const delayMs = Math.max(500, (parseFloat(activePopup.delay) || 1.5) * 1000);
        setTimeout(() => {
          showPopup(activePopup);
        }, delayMs);
      })
      .catch(() => {
        // Respaldo de cache local si la petición fetch no responde
        const fallback = getActivePopup();
        if (fallback && fallback.active) {
          if (fallback.frequency === 'session' && isDismissedInSession(fallback.id)) return;
          const delayMs = Math.max(500, (parseFloat(fallback.delay) || 1.5) * 1000);
          setTimeout(() => showPopup(fallback), delayMs);
        }
      });
  }

  // Re-renderizar dinámicamente si el pop-up está abierto y se cambia de idioma
  function onLanguageChange() {
    const existing = document.getElementById('seloasaSitePopupOverlay');
    if (existing && existing.classList.contains('active') && currentlyDisplayedRawPopup) {
      showPopup(currentlyDisplayedRawPopup);
    }
  }

  document.addEventListener('site-language-changed', onLanguageChange);
  window.addEventListener('languageChanged', onLanguageChange);

  // Exponer API global para pruebas o llamadas desde el admin
  window.SeloasaPopup = {
    getPopups: getPopups,
    getActivePopup: getActivePopup,
    show: showPopup,
    init: initSitePopup
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSitePopup);
  } else {
    initSitePopup();
  }
})();
