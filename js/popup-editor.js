/**
 * SELOASA - Controlador del Estudio de Pop-ups y Avisos Oficiales
 * Gestiona la edición con formulario en tiempo real (50% izquierda)
 * y renderizado de la ventana emergente flotante en directo (50% derecha)
 * con soporte para 4 diseños visuales (Top, Left, Right, BG), 3 temas
 * y botones de acción 100% opcionales y sin etiquetas fijas invasivas.
 */
(function () {
  'use strict';

  const STORAGE_KEYS = {
    POPUPS_DATA: 'seloasa_site_popups',
    ACTIVE_POPUP_ID: 'seloasa_active_popup_id'
  };

  let currentPopups = [];
  let editingPopupId = null;
  let isNewPopup = false;

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function loadPopupsFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.POPUPS_DATA);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentPopups = parsed;
        }
      }
    } catch (e) {
      console.warn('Error al leer popups en editor:', e);
    }

    // Consultar directamente la Base de Datos MySQL
    fetch('php/popup_api.php')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.items)) {
          currentPopups = data.items;
          localStorage.setItem(STORAGE_KEYS.POPUPS_DATA, JSON.stringify(currentPopups));
        }
      })
      .catch(err => console.warn('Sync popups BD error:', err));

    return currentPopups;
  }

  function savePopupsToStorage(popups) {
    try {
      localStorage.setItem(STORAGE_KEYS.POPUPS_DATA, JSON.stringify(popups, null, 2));
      const activePopup = popups.find(p => p.active === true);
      if (activePopup) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_POPUP_ID, activePopup.id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_POPUP_ID);
      }
      fetch('php/popup_api.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: popups })
      }).catch(err => console.warn('Error al sincronizar popups con BD MySQL:', err));
    } catch (e) {
      console.error('Error al guardar popups:', e);
    }
  }

  function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  function generateSlug(text) {
    return 'popup-' + (text || 'aviso')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 32) + '-' + Math.floor(100 + Math.random() * 900);
  }

  function getFormData() {
    const type = document.getElementById('popupTypeHidden')?.value || 'alerta';
    const layout = document.getElementById('popupLayoutHidden')?.value || 'top';
    return {
      id: document.getElementById('popupIdInput')?.value.trim() || generateSlug(document.getElementById('popupTitleInput')?.value),
      title: document.getElementById('popupTitleInput')?.value.trim() || 'Título del Pop-up',
      subtitle: document.getElementById('popupSubtitleInput')?.value.trim() || '',
      type: type,
      layout: layout,
      message: document.getElementById('popupMessageInput')?.value.trim() || '<p>Escribe aquí el texto que verán los usuarios.</p>',
      image: document.getElementById('popupImageInput')?.value.trim() || '',
      btn_primary_text: document.getElementById('popupBtnPrimaryTextInput')?.value.trim() || '',
      btn_primary_url: document.getElementById('popupBtnPrimaryUrlInput')?.value.trim() || '',
      btn_secondary_text: document.getElementById('popupBtnSecondaryTextInput')?.value.trim() || '',
      custom_footer: document.getElementById('popupFooterTextInput')?.value.trim() || '',
      active: document.getElementById('popupActiveCheckbox')?.checked || false,
      frequency: document.getElementById('popupFrequencySelect')?.value || 'session',
      delay: parseFloat(document.getElementById('popupDelayInput')?.value) || 1.5
    };
  }

  function setFormData(data) {
    if (!data) return;

    if (document.getElementById('popupIdInput')) {
      document.getElementById('popupIdInput').value = data.id || '';
    }
    if (document.getElementById('popupTitleInput')) {
      document.getElementById('popupTitleInput').value = data.title || '';
    }
    if (document.getElementById('popupSubtitleInput')) {
      document.getElementById('popupSubtitleInput').value = data.subtitle || '';
    }
    if (document.getElementById('popupMessageInput')) {
      document.getElementById('popupMessageInput').value = data.message || '';
    }
    if (document.getElementById('popupImageInput')) {
      document.getElementById('popupImageInput').value = data.image || '';
    }
    if (document.getElementById('popupBtnPrimaryTextInput')) {
      document.getElementById('popupBtnPrimaryTextInput').value = data.btn_primary_text || '';
    }
    if (document.getElementById('popupBtnPrimaryUrlInput')) {
      document.getElementById('popupBtnPrimaryUrlInput').value = data.btn_primary_url || '';
    }
    if (document.getElementById('popupBtnSecondaryTextInput')) {
      document.getElementById('popupBtnSecondaryTextInput').value = data.btn_secondary_text || '';
    }
    if (document.getElementById('popupFooterTextInput')) {
      document.getElementById('popupFooterTextInput').value = data.custom_footer || '';
    }
    if (document.getElementById('popupFrequencySelect')) {
      document.getElementById('popupFrequencySelect').value = data.frequency || 'session';
    }
    if (document.getElementById('popupDelayInput')) {
      document.getElementById('popupDelayInput').value = data.delay !== undefined ? data.delay : 1.5;
    }
    if (document.getElementById('popupActiveCheckbox')) {
      document.getElementById('popupActiveCheckbox').checked = Boolean(data.active);
    }
    if (document.getElementById('headerActiveSwitch')) {
      document.getElementById('headerActiveSwitch').checked = Boolean(data.active);
    }

    selectLayout(data.layout || 'top');
    selectType(data.type || 'alerta');
  }

  function selectLayout(layout) {
    const validLayouts = ['top', 'left', 'right', 'bg'];
    const selectedLayout = validLayouts.includes(layout) ? layout : 'top';
    const hidden = document.getElementById('popupLayoutHidden');
    if (hidden) hidden.value = selectedLayout;

    document.querySelectorAll('.popup-layout-card').forEach(card => {
      if (card.getAttribute('data-layout') === selectedLayout) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    renderLivePreview();
  }

  function selectType(type) {
    const hidden = document.getElementById('popupTypeHidden');
    if (hidden) hidden.value = type;

    document.querySelectorAll('.popup-type-card').forEach(card => {
      if (card.getAttribute('data-type') === type) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    renderLivePreview();
  }

  function renderLivePreview() {
    const canvas = document.getElementById('livePopupPreviewCanvas');
    if (!canvas) return;

    const data = getFormData();
    const typeKey = data.type === 'alerta' ? 'alerta' : data.type === 'comunicado' ? 'comunicado' : 'informativo';
    const layoutKey = ['top', 'left', 'right', 'bg'].includes(data.layout) ? data.layout : 'top';

    const footerTag = data.custom_footer ? `
      <span class="seloasa-popup-footer-tag">
        <i class="fa fa-certificate me-1"></i> ${escapeHtml(data.custom_footer)}
      </span>
    ` : (typeKey === 'alerta'
      ? '<span class="seloasa-popup-footer-tag"><i class="fa fa-shield-alt me-1"></i> Circular Normativa COFEPRIS</span>'
      : typeKey === 'comunicado'
      ? '<span class="seloasa-popup-footer-tag"><i class="fa fa-building me-1"></i> Comunicado Oficial SELOASA</span>'
      : '<span class="seloasa-popup-footer-tag"><i class="fa fa-info-circle me-1"></i> Atención al Cliente & Monitoreo 24/7</span>');

    // Botones de acción 100% opcionales
    const hasPrimary = Boolean(data.btn_primary_text && data.btn_primary_text.trim());
    const hasSecondary = Boolean(data.btn_secondary_text && data.btn_secondary_text.trim());

    let actionsHtml = '';
    if (hasPrimary || hasSecondary) {
      actionsHtml = `
        <div class="seloasa-popup-actions">
          ${hasPrimary ? `
            <a href="javascript:void(0)" class="seloasa-popup-btn-primary" ${data.btn_primary_url ? `title="Enlace: ${data.btn_primary_url}"` : ''}>
              <span>${data.btn_primary_text}</span>
              <i class="fa fa-arrow-right"></i>
            </a>
          ` : ''}
          ${hasSecondary ? `
            <button type="button" class="seloasa-popup-btn-secondary" id="previewBtnSecondary">
              ${data.btn_secondary_text}
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
      const bgStyle = data.image
        ? `background-image: url('${data.image}');`
        : 'background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);';

      cardHtml = `
        <div class="seloasa-popup-card style-${typeKey} layout-bg shadow-lg" id="previewPopupCard" style="${bgStyle} margin: 0 auto; position: relative;">
          <div class="seloasa-popup-bg-overlay"></div>
          <button type="button" class="seloasa-popup-close-btn" id="previewBtnClose" title="Simular Clic en Cerrar" aria-label="Cerrar aviso">
            <i class="fa fa-times"></i>
          </button>
          <div class="seloasa-popup-content">
            ${data.subtitle ? `<div class="seloasa-popup-subtitle">${data.subtitle}</div>` : ''}
            <h3 class="seloasa-popup-title">${data.title}</h3>
            <div class="seloasa-popup-message">
              ${data.message}
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
      const imgSideHtml = data.image ? `
        <div class="seloasa-popup-hero-img-wrap">
          <img src="${data.image}" alt="${data.title || ''}" class="seloasa-popup-hero-img" onerror="this.parentElement.style.display='none'">
        </div>
      ` : '';

      cardHtml = `
        <div class="seloasa-popup-card style-${typeKey} layout-${layoutKey} shadow-lg" id="previewPopupCard" style="margin: 0 auto; position: relative;">
          <button type="button" class="seloasa-popup-close-btn" id="previewBtnClose" title="Simular Clic en Cerrar" aria-label="Cerrar aviso">
            <i class="fa fa-times"></i>
          </button>
          ${imgSideHtml}
          <div class="seloasa-popup-content">
            ${data.subtitle ? `<div class="seloasa-popup-subtitle">${data.subtitle}</div>` : ''}
            <h3 class="seloasa-popup-title">${data.title}</h3>
            <div class="seloasa-popup-message">
              ${data.message}
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
      const imageTopHtml = data.image ? `
        <div class="seloasa-popup-hero-img-wrap">
          <img src="${data.image}" alt="${data.title || ''}" class="seloasa-popup-hero-img" onerror="this.parentElement.style.display='none'">
        </div>
      ` : '';

      cardHtml = `
        <div class="seloasa-popup-card style-${typeKey} layout-top shadow-lg" id="previewPopupCard" style="margin: 0 auto; position: relative;">
          <button type="button" class="seloasa-popup-close-btn" id="previewBtnClose" title="Simular Clic en Cerrar" aria-label="Cerrar aviso">
            <i class="fa fa-times"></i>
          </button>
          ${imageTopHtml}
          <div class="seloasa-popup-content">
            ${data.subtitle ? `<div class="seloasa-popup-subtitle">${data.subtitle}</div>` : ''}
            <h3 class="seloasa-popup-title">${data.title}</h3>
            <div class="seloasa-popup-message">
              ${data.message}
            </div>
            ${actionsHtml}
            ${footerHtml}
          </div>
        </div>
      `;
    }

    canvas.innerHTML = cardHtml;

    // Interacción de cierre en el simulador
    const cardEl = document.getElementById('previewPopupCard');
    function simulateClose() {
      if (!cardEl) return;
      cardEl.style.transition = 'all 0.3s ease';
      cardEl.style.opacity = '0';
      cardEl.style.transform = 'translateY(15px) scale(0.95)';
      const closedNotice = document.getElementById('previewClosedNotice');
      if (closedNotice) closedNotice.classList.remove('d-none');
    }

    document.getElementById('previewBtnClose')?.addEventListener('click', simulateClose);
    document.getElementById('previewBtnSecondary')?.addEventListener('click', simulateClose);
  }

  function replayPreview() {
    const closedNotice = document.getElementById('previewClosedNotice');
    if (closedNotice) closedNotice.classList.add('d-none');

    const cardWrap = document.getElementById('livePopupPreviewCanvas');
    if (cardWrap) {
      cardWrap.classList.remove('animate-pop-in');
      void cardWrap.offsetWidth; // Reflow
      cardWrap.classList.add('animate-pop-in');
    }
    renderLivePreview();
  }

  function savePopup(publishNow = false) {
    const data = getFormData();

    if (!data.title || data.title === 'Título del Pop-up') {
      alert('Por favor escribe un título descriptivo para el pop-up.');
      document.getElementById('popupTitleInput')?.focus();
      return;
    }

    if (!data.message) {
      alert('Por favor escribe un mensaje para el pop-up.');
      document.getElementById('popupMessageInput')?.focus();
      return;
    }

    if (publishNow) {
      data.active = true;
    }

    currentPopups = loadPopupsFromStorage();

    const existingIndex = currentPopups.findIndex(p => p.id === data.id);

    if (existingIndex >= 0) {
      currentPopups[existingIndex] = {
        ...currentPopups[existingIndex],
        ...data,
        updated_at: new Date().toISOString()
      };
    } else {
      currentPopups.push({
        ...data,
        created_at: new Date().toISOString()
      });
    }

    // Si este pop-up se activa, desactivar los demás para mantener solo 1 activo
    if (data.active) {
      currentPopups.forEach(p => {
        p.active = (p.id === data.id);
      });
    }

    savePopupsToStorage(currentPopups);

    // Actualizar UI
    editingPopupId = data.id;
    isNewPopup = false;
    const subTitleEl = document.getElementById('popupStudioSubtitle');
    if (subTitleEl) {
      subTitleEl.textContent = `Editando: ${data.id} (${data.active ? 'Activo en Web' : 'Inactivo'})`;
    }

    const toast = document.getElementById('saveSuccessToast');
    if (toast) {
      toast.classList.remove('d-none');
      setTimeout(() => toast.classList.add('d-none'), 3500);
    } else {
      alert(data.active ? '¡Pop-up guardado y ACTIVADO en el sitio web con éxito!' : '¡Pop-up guardado con éxito!');
    }
  }

  /* ==========================================================================
     INICIALIZACIÓN
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    currentPopups = loadPopupsFromStorage();

    const urlId = getQueryParam('id');
    const isNew = getQueryParam('new') === '1';

    if (urlId) {
      const found = currentPopups.find(p => p.id === urlId);
      if (found) {
        editingPopupId = found.id;
        setFormData(found);
        const subTitleEl = document.getElementById('popupStudioSubtitle');
        if (subTitleEl) subTitleEl.textContent = `Editando: ${found.id}`;
      } else {
        isNewPopup = true;
        setFormData({
          id: urlId,
          title: 'Nuevo Aviso Operativo',
          subtitle: 'Aviso Oficial SELOASA',
          type: 'alerta',
          layout: 'top',
          message: '<p>Escribe aquí el contenido oficial que se mostrará a los visitantes.</p>',
          image: 'img/patio_unidades_dia_banner.jpg',
          btn_primary_text: '',
          btn_primary_url: '',
          btn_secondary_text: 'Entendido, continuar navegando',
          custom_footer: '',
          active: false,
          frequency: 'session',
          delay: 1.5
        });
      }

      // Consultar la versión más reciente en MySQL
      fetch('php/popup_api.php?id=' + encodeURIComponent(urlId))
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.item) {
            editingPopupId = data.item.id;
            isNewPopup = false;
            setFormData(data.item);
            const subTitleEl = document.getElementById('popupStudioSubtitle');
            if (subTitleEl) subTitleEl.textContent = `Editando: ${data.item.id}`;
            renderLivePreview();
          }
        })
        .catch(err => console.warn('Fetch popup BD error:', err));
    } else {
      isNewPopup = true;
      const initialId = generateSlug('aviso');
      setFormData({
        id: initialId,
        title: 'Nueva Notificación Operativa 2026',
        subtitle: 'Aviso Oficial SELOASA',
        type: 'alerta',
        layout: 'top',
        message: '<p>Informamos a nuestros clientes sobre las nuevas disposiciones operativas y de aseguramiento de calidad en rutas de alta especialidad.</p>',
        image: 'img/patio_unidades_dia_banner.jpg',
        btn_primary_text: 'Ver Comunicado Oficial',
        btn_primary_url: 'blog/articulo.html?id=featured',
        btn_secondary_text: 'Entendido, continuar navegando',
        custom_footer: '',
        active: false,
        frequency: 'session',
        delay: 1.5
      });
      const subTitleEl = document.getElementById('popupStudioSubtitle');
      if (subTitleEl) subTitleEl.textContent = 'Creando Nuevo Pop-up';
    }

    // Vincular todos los inputs con el preview en vivo
    const liveInputs = [
      'popupTitleInput',
      'popupSubtitleInput',
      'popupMessageInput',
      'popupImageInput',
      'popupBtnPrimaryTextInput',
      'popupBtnPrimaryUrlInput',
      'popupBtnSecondaryTextInput',
      'popupFooterTextInput',
      'popupFrequencySelect',
      'popupDelayInput'
    ];

    liveInputs.forEach(inputId => {
      const el = document.getElementById(inputId);
      if (el) {
        el.addEventListener('input', renderLivePreview);
        el.addEventListener('change', renderLivePreview);
      }
    });

    // Sincronizar switches activo en header y formulario
    const formActiveCheck = document.getElementById('popupActiveCheckbox');
    const headerActiveSwitch = document.getElementById('headerActiveSwitch');

    if (formActiveCheck && headerActiveSwitch) {
      formActiveCheck.addEventListener('change', function () {
        headerActiveSwitch.checked = this.checked;
        const lbl = document.getElementById('headerActiveLabel');
        if (lbl) lbl.textContent = this.checked ? 'Activo en Web' : 'Inactivo';
      });

      headerActiveSwitch.addEventListener('change', function () {
        formActiveCheck.checked = this.checked;
        const lbl = document.getElementById('headerActiveLabel');
        if (lbl) lbl.textContent = this.checked ? 'Activo en Web' : 'Inactivo';
      });
    }

    // Tarjetas selectoras de layout (4 diseños: top, left, right, bg)
    document.querySelectorAll('.popup-layout-card').forEach(card => {
      card.addEventListener('click', function () {
        const layout = this.getAttribute('data-layout');
        selectLayout(layout);
      });
    });

    // Botones de tipo visual (3 estilos: alerta, comunicado, informativo)
    document.querySelectorAll('.popup-type-card').forEach(card => {
      card.addEventListener('click', function () {
        const type = this.getAttribute('data-type');
        selectType(type);
      });
    });

    // Botón reiniciar animación preview
    document.getElementById('btnReplayPreview')?.addEventListener('click', replayPreview);
    document.getElementById('btnReplayPreviewHeader')?.addEventListener('click', replayPreview);
    document.getElementById('btnReopenFromNotice')?.addEventListener('click', replayPreview);

    // Botones de guardar
    document.getElementById('btnSavePopupStudio')?.addEventListener('click', function () {
      savePopup(false);
    });

    document.getElementById('btnPublishAndActivate')?.addEventListener('click', function () {
      savePopup(true);
    });

    // Render inicial
    renderLivePreview();
  });
})();
