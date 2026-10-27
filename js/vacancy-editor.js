/**
 * SELOASA - Controlador del Estudio de Vacantes & Empleo
 * Gestiona la edición con formulario en tiempo real (50% izquierda)
 * y renderizado de la tarjeta de vacante en directo 1:1 (50% derecha)
 * con asignación específica de correos de notificación de postulaciones.
 */
(function () {
  'use strict';

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

  const STORAGE_KEYS = {
    VACANCIES_DATA: 'seloasa_careers_vacancies'
  };

  const API_ENDPOINT = getBackendApiUrl('php/vacantes_api.php');

  let currentVacancies = [];
  let editingVacancyId = null;
  let isNewVacancy = false;
  let currentVacancyLang = 'es';
  let vacancyTranslations = {
    es: {},
    en: {},
    al: {},
    pt: {},
    fr: {}
  };

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  function generateSlug(text) {
    return (text || 'vacante')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 40);
  }

  function loadVacanciesFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VACANCIES_DATA);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentVacancies = parsed;
        }
      }
    } catch (e) {
      console.warn('Error al leer vacantes de localStorage:', e);
    }

    // Consultar directamente la Base de Datos MySQL
    fetch(API_ENDPOINT)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.items)) {
          currentVacancies = data.items;
          localStorage.setItem(STORAGE_KEYS.VACANCIES_DATA, JSON.stringify(currentVacancies));
        }
      })
      .catch(err => console.warn('Sync vacantes BD error:', err));

    return currentVacancies;
  }

  function saveVacanciesToStorage(vacancies) {
    try {
      localStorage.setItem(STORAGE_KEYS.VACANCIES_DATA, JSON.stringify(vacancies, null, 2));
      window.dispatchEvent(new Event('storage'));
      fetch(API_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: vacancies })
      }).catch(err => console.warn('Error sincronizando vacantes con BD:', err));
    } catch (e) {
      console.error('Error al guardar vacantes:', e);
    }
  }

  function getFormData() {
    const points = [];
    document.querySelectorAll('.vacancy-point-input').forEach(input => {
      const val = input.value.trim();
      if (val) points.push(val);
    });

    const isPublished = Boolean(document.getElementById('headerActiveSwitch')?.checked);

    return {
      id: document.getElementById('vacancyIdInput')?.value.trim() || generateSlug(document.getElementById('vacancyTitleInput')?.value),
      title: document.getElementById('vacancyTitleInput')?.value.trim() || 'Título del Puesto',
      status: isPublished ? 'published' : 'draft',
      sort_order: parseInt(document.getElementById('vacancySortOrderInput')?.value, 10) || 10,
      area: document.getElementById('vacancyAreaInput')?.value.trim() || 'General',
      mode: document.getElementById('vacancyModeSelect')?.value || 'Presencial',
      location: document.getElementById('vacancyLocationInput')?.value.trim() || 'Lerma, Estado de México',
      schedule: document.getElementById('vacancyScheduleInput')?.value.trim() || 'Tiempo completo',
      recipient_emails: document.getElementById('vacancyRecipientEmailsInput')?.value.trim() || 'gadiel.palma@SELOASA.com.mx, rh@seloasa.com.mx',
      summary: document.getElementById('vacancySummaryInput')?.value.trim() || 'Descripción detallada de la posición y objetivos del puesto.',
      points: points.length > 0 ? points : ['Requisito o responsabilidad clave de la posición.']
    };
  }

  function getTranslatableVacancyFields() {
    const points = [];
    document.querySelectorAll('.vacancy-point-input').forEach(input => {
      const val = input.value.trim();
      if (val) points.push(val);
    });

    return {
      title: document.getElementById('vacancyTitleInput')?.value.trim() || '',
      area: document.getElementById('vacancyAreaInput')?.value.trim() || '',
      mode: document.getElementById('vacancyModeSelect')?.value || 'Presencial',
      location: document.getElementById('vacancyLocationInput')?.value.trim() || '',
      schedule: document.getElementById('vacancyScheduleInput')?.value.trim() || '',
      summary: document.getElementById('vacancySummaryInput')?.value.trim() || '',
      points: points.length > 0 ? points : ['Requisito o responsabilidad clave de la posición.']
    };
  }

  function setTranslatableVacancyFields(data) {
    data = data || {};
    if (document.getElementById('vacancyTitleInput')) {
      document.getElementById('vacancyTitleInput').value = data.title || '';
    }
    if (document.getElementById('vacancyAreaInput')) {
      document.getElementById('vacancyAreaInput').value = data.area || '';
    }
    if (document.getElementById('vacancyAreaSelect')) {
      document.getElementById('vacancyAreaSelect').value = data.area || 'custom';
    }
    if (document.getElementById('vacancyModeSelect')) {
      document.getElementById('vacancyModeSelect').value = data.mode || 'Presencial';
    }
    if (document.getElementById('vacancyLocationInput')) {
      document.getElementById('vacancyLocationInput').value = data.location || '';
    }
    if (document.getElementById('vacancyScheduleInput')) {
      document.getElementById('vacancyScheduleInput').value = data.schedule || '';
    }
    if (document.getElementById('vacancySummaryInput')) {
      document.getElementById('vacancySummaryInput').value = data.summary || '';
    }

    renderPointsInputs(data.points || []);
  }

  function updateVacancyLangBadges() {
    const langKeys = ['es', 'en', 'al', 'pt', 'fr'];
    langKeys.forEach(l => {
      const badge = document.getElementById(`vacLangBadge-${l}`);
      if (!badge) return;
      const data = vacancyTranslations[l] || {};
      const isTranslated = Boolean(data.title && data.title.trim().length > 0);
      if (l === 'es') {
        badge.textContent = isTranslated ? 'Base OK' : 'Base';
        badge.className = 'badge bg-success ms-1 small';
      } else {
        badge.textContent = isTranslated ? '✓ Traducido' : 'Pendiente';
        badge.className = isTranslated ? 'badge bg-success ms-1 small' : 'badge bg-light text-muted border ms-1 small';
      }
    });
  }

  function switchVacancyLanguage(newLang) {
    if (newLang === currentVacancyLang) return;

    vacancyTranslations[currentVacancyLang] = getTranslatableVacancyFields();
    updateVacancyLangBadges();

    currentVacancyLang = newLang;

    document.querySelectorAll('.vacancy-lang-tab-btn').forEach(btn => {
      const bLang = btn.getAttribute('data-lang');
      if (bLang === newLang) {
        btn.className = 'btn btn-sm btn-outline-primary active rounded-pill fw-bold px-3 py-1.5 vacancy-lang-tab-btn';
      } else {
        btn.className = 'btn btn-sm btn-outline-secondary rounded-pill fw-bold px-3 py-1.5 vacancy-lang-tab-btn';
      }
    });

    const langNames = {
      es: { flag: '🇪🇸', name: 'Español (Principal)' },
      en: { flag: '🇺🇸', name: 'English' },
      al: { flag: '🇩🇪', name: 'Deutsch' },
      pt: { flag: '🇧🇷', name: 'Português' },
      fr: { flag: '🇫🇷', name: 'Français' }
    };
    const info = langNames[newLang] || { flag: '🌐', name: newLang };
    const indicator = document.getElementById('vacancyActiveLangIndicator');
    if (indicator) {
      indicator.innerHTML = `<span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5 rounded-pill"><i class="fa fa-pen me-1"></i> Idioma en edición: ${info.flag} ${info.name}</span>`;
    }

    const targetData = vacancyTranslations[newLang] || {};
    setTranslatableVacancyFields(targetData);
    renderLivePreview();
  }

  function setFormData(data) {
    if (!data) return;

    if (document.getElementById('vacancyIdInput')) {
      document.getElementById('vacancyIdInput').value = data.id || '';
    }
    if (document.getElementById('vacancySortOrderInput')) {
      document.getElementById('vacancySortOrderInput').value = data.sort_order !== undefined ? data.sort_order : 10;
    }
    if (document.getElementById('vacancyRecipientEmailsInput')) {
      document.getElementById('vacancyRecipientEmailsInput').value = data.recipient_emails || 'gadiel.palma@SELOASA.com.mx, rh@seloasa.com.mx';
    }

    const isPublished = data.status === 'published';
    const switchEl = document.getElementById('headerActiveSwitch');
    const labelEl = document.getElementById('headerActiveLabel');
    if (switchEl) switchEl.checked = isPublished;
    if (labelEl) labelEl.textContent = isPublished ? 'Publicada en Web' : 'Borrador Interno';

    // Cargar matriz de traducciones para los 5 idiomas
    vacancyTranslations = {
      es: (data.translations && data.translations.es) ? { ...data.translations.es } : {
        title: data.title || '',
        area: data.area || 'Monitoreo',
        mode: data.mode || 'Presencial',
        location: data.location || 'Lerma, Estado de México',
        schedule: data.schedule || 'Tiempo completo',
        summary: data.summary || '',
        points: Array.isArray(data.points) ? data.points : ['Requisito o responsabilidad clave de la posición.']
      },
      en: (data.translations && data.translations.en) ? { ...data.translations.en } : {},
      al: (data.translations && data.translations.al) ? { ...data.translations.al } : {},
      pt: (data.translations && data.translations.pt) ? { ...data.translations.pt } : {},
      fr: (data.translations && data.translations.fr) ? { ...data.translations.fr } : {}
    };

    currentVacancyLang = 'es';
    updateVacancyLangBadges();

    // Cargar la versión en Español por defecto
    setTranslatableVacancyFields(vacancyTranslations.es);
    renderLivePreview();
  }

  function renderPointsInputs(points) {
    const container = document.getElementById('vacancyPointsContainer');
    if (!container) return;

    container.innerHTML = '';
    const list = Array.isArray(points) && points.length > 0 ? points : [''];

    list.forEach(pt => addPointRow(pt));
  }

  function addPointRow(text = '') {
    const container = document.getElementById('vacancyPointsContainer');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'vacancy-point-row';
    row.innerHTML = `
      <span class="text-muted small ps-1" style="font-size: 11px;"><i class="fa fa-check text-primary"></i></span>
      <input type="text" class="form-control form-control-sm vacancy-point-input" placeholder="Ej: Licenciatura terminada o experiencia mínima de 2 años..." value="${escapeHtml(text)}">
      <button type="button" class="vacancy-point-del-btn" title="Eliminar este punto">
        <i class="fa fa-times"></i>
      </button>
    `;

    row.querySelector('.vacancy-point-del-btn')?.addEventListener('click', function () {
      const allRows = container.querySelectorAll('.vacancy-point-row');
      if (allRows.length > 1) {
        row.remove();
        renderLivePreview();
      } else {
        row.querySelector('input').value = '';
        renderLivePreview();
      }
    });

    row.querySelector('input')?.addEventListener('input', renderLivePreview);

    container.appendChild(row);
  }

  function renderLivePreview() {
    const canvas = document.getElementById('liveVacancyPreviewCanvas');
    if (!canvas) return;

    const data = getFormData();

    const pointsHtml = data.points.map(pt => `
      <li>
        <span class="careers-list-check"><i class="fa fa-check"></i></span>
        <span class="careers-list-text">${escapeHtml(pt)}</span>
      </li>
    `).join('');

    canvas.innerHTML = `
      <article class="careers-vacancy-card" style="box-shadow: 0 14px 35px rgba(0,0,0,0.08); background: #ffffff;">
        <div class="careers-vacancy-accent-bar"></div>
        
        <div class="d-flex align-items-center justify-content-between mb-2">
          <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1 rounded-pill" style="font-size: 11px; font-weight: 700;">
            <i class="fa fa-tag me-1"></i> ${escapeHtml(data.area)}
          </span>
          <span class="badge ${data.status === 'published' ? 'bg-success text-white' : 'bg-secondary text-white'} px-2 py-0.5 rounded-pill" style="font-size: 10px;">
            ${data.status === 'published' ? 'Publicada en Web' : 'Borrador'}
          </span>
        </div>

        <h3 class="careers-vacancy-title">${escapeHtml(data.title)}</h3>

        <div class="careers-vacancy-meta">
          <div class="careers-vacancy-meta-item">
            <i class="fa fa-map-marker-alt"></i>
            <span>${escapeHtml(data.location)}</span>
          </div>
          <div class="careers-vacancy-meta-item">
            <i class="fa fa-briefcase"></i>
            <span>${escapeHtml(data.mode)}</span>
          </div>
          <div class="careers-vacancy-meta-item">
            <i class="fa fa-clock"></i>
            <span>${escapeHtml(data.schedule)}</span>
          </div>
        </div>

        <p class="careers-vacancy-summary">${escapeHtml(data.summary)}</p>

        <div class="careers-vacancy-requirements mb-4">
          <h6 class="fw-bold text-dark small mb-2" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em;">
            Requisitos &amp; Responsabilidades Clave:
          </h6>
          <ul class="careers-vacancy-list">
            ${pointsHtml}
          </ul>
        </div>

        <div class="careers-vacancy-actions mt-auto pt-2 border-top">
          <button type="button" class="btn btn-primary careers-vacancy-btn w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2" id="btnPreviewApplyAction">
            <span>Postularme a esta vacante</span>
            <i class="fa fa-arrow-right"></i>
          </button>
        </div>
      </article>
    `;

    document.getElementById('btnPreviewApplyAction')?.addEventListener('click', openSimulationModal);
  }

  function openSimulationModal() {
    const data = getFormData();

    const existing = document.getElementById('vacancySimOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'vacancySimOverlay';
    overlay.className = 'vacancy-sim-overlay';
    overlay.innerHTML = `
      <div class="vacancy-sim-modal-card">
        <div class="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom">
          <div class="fw-bold text-dark">
            <i class="fa fa-paper-plane text-primary me-2"></i> Formulario de Postulación Web
          </div>
          <button type="button" class="btn-close" id="btnCloseSimModal"></button>
        </div>

        <p class="small text-muted mb-3">
          Completa el formulario con tus datos personales y adjunta tu CV para postularte a esta vacante.
        </p>

        <div class="mb-2.5">
          <label class="form-label small fw-bold text-dark mb-1">Nombre Completo</label>
          <input type="text" class="form-control form-control-sm" value="Lic. Alejandro Morales Rivera" readonly>
        </div>

        <div class="row g-2 mb-2.5">
          <div class="col-6">
            <label class="form-label small fw-bold text-dark mb-1">Correo del Candidato</label>
            <input type="email" class="form-control form-control-sm" value="alejandro.morales@gmail.com" readonly>
          </div>
          <div class="col-6">
            <label class="form-label small fw-bold text-dark mb-1">Teléfono Móvil</label>
            <input type="tel" class="form-control form-control-sm" value="55 4123 9876" readonly>
          </div>
        </div>

        <div class="mb-2.5">
          <label class="form-label small fw-bold text-dark mb-1">Vacante Seleccionada</label>
          <input type="text" class="form-control form-control-sm fw-bold bg-light" value="${escapeHtml(data.title)}" readonly>
        </div>

        <div class="mb-3">
          <label class="form-label small fw-bold text-dark mb-1">Currículum Vitae (CV)</label>
          <div class="p-2 border rounded bg-light small d-flex align-items-center gap-2">
            <i class="fa fa-file-pdf text-danger fa-lg"></i>
            <span class="fw-bold">CV_Alejandro_Morales_2026.pdf</span>
            <span class="text-muted ms-auto" style="font-size: 10px;">1.4 MB</span>
          </div>
        </div>

        <div class="d-grid gap-2">
          <button type="button" class="btn btn-primary btn-sm py-2 fw-bold" id="btnSimulateSend">
            <i class="fa fa-check me-1"></i> Simular Envío de Postulación
          </button>
          <button type="button" class="btn btn-light btn-sm text-muted" id="btnCancelSimModal">Cerrar simulador</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    function closeSim() {
      overlay.remove();
    }

    document.getElementById('btnCloseSimModal')?.addEventListener('click', closeSim);
    document.getElementById('btnCancelSimModal')?.addEventListener('click', closeSim);
    document.getElementById('btnSimulateSend')?.addEventListener('click', function () {
      alert(`¡Simulación exitosa!\n\nLa postulación para "${data.title}" fue enviada satisfactoriamente.`);
      closeSim();
    });
  }

  function saveVacancy(publishNow = false) {
    // 1. Guardar cambios del idioma activo en la matriz
    vacancyTranslations[currentVacancyLang] = getTranslatableVacancyFields();

    const data = getFormData();

    // 2. Adjuntar traducciones de los 5 idiomas
    data.translations = vacancyTranslations;

    // Asegurar que campos base vengan del español
    const esData = vacancyTranslations.es || {};
    if (esData.title) data.title = esData.title;
    if (esData.area) data.area = esData.area;
    if (esData.mode) data.mode = esData.mode;
    if (esData.location) data.location = esData.location;
    if (esData.schedule) data.schedule = esData.schedule;
    if (esData.summary) data.summary = esData.summary;
    if (esData.points && esData.points.length > 0) data.points = esData.points;

    if (!data.title || data.title === 'Título del Puesto') {
      alert('Por favor ingresa un título descriptivo para la vacante en Español.');
      document.getElementById('vacancyTitleInput')?.focus();
      return;
    }

    if (!data.summary) {
      alert('Por favor ingresa un resumen o descripción general del puesto en Español.');
      document.getElementById('vacancySummaryInput')?.focus();
      return;
    }

    if (!data.recipient_emails) {
      alert('Por favor especifica al menos un correo de notificación donde llegarán los CVs.');
      document.getElementById('vacancyRecipientEmailsInput')?.focus();
      return;
    }

    if (publishNow) {
      data.status = 'published';
      const switchEl = document.getElementById('headerActiveSwitch');
      if (switchEl) switchEl.checked = true;
      const lbl = document.getElementById('headerActiveLabel');
      if (lbl) lbl.textContent = 'Publicada en Web';
    }

    currentVacancies = loadVacanciesFromStorage();
    const existingIndex = currentVacancies.findIndex(v => v.id === data.id);

    if (existingIndex >= 0) {
      currentVacancies[existingIndex] = {
        ...currentVacancies[existingIndex],
        ...data,
        updated_at: new Date().toISOString()
      };
    } else {
      currentVacancies.push({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    saveVacanciesToStorage(currentVacancies);

    editingVacancyId = data.id;
    isNewVacancy = false;

    const subTitleEl = document.getElementById('vacancyStudioSubtitle');
    if (subTitleEl) {
      subTitleEl.textContent = `Editando: ${data.title} (${data.status === 'published' ? 'Publicada' : 'Borrador'})`;
    }

    const toast = document.getElementById('saveSuccessToast');
    if (toast) {
      toast.classList.remove('d-none');
      setTimeout(() => toast.classList.add('d-none'), 3500);
    } else {
      alert(data.status === 'published' ? '¡Vacante guardada y PUBLICADA en la bolsa de trabajo con éxito!' : '¡Vacante guardada como borrador con éxito!');
    }
  }

  /* ==========================================================================
     INICIALIZACIÓN
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    currentVacancies = loadVacanciesFromStorage();

    const urlId = getQueryParam('id');
    const isNew = getQueryParam('new') === '1';

    if (urlId) {
      const found = currentVacancies.find(v => v.id === urlId);
      if (found) {
        editingVacancyId = found.id;
        setFormData(found);
        const subTitleEl = document.getElementById('vacancyStudioSubtitle');
        if (subTitleEl) subTitleEl.textContent = `Editando: ${found.title}`;
      } else {
        isNewVacancy = true;
        setFormData({
          id: urlId,
          title: 'Nueva Vacante Operativa',
          area: 'Monitoreo',
          mode: 'Presencial',
          location: 'Lerma, Estado de México',
          schedule: 'Tiempo completo',
          status: 'draft',
          sort_order: 10,
          recipient_emails: 'gadiel.palma@SELOASA.com.mx, rh@seloasa.com.mx',
          summary: 'Responsable de la ejecución operativa y seguimiento de procesos logísticos con altos estándares farmacéuticos.',
          points: [
            'Seguimiento a la operación y cumplimiento de protocolos de calidad.',
            'Comunicación continua con el equipo de operaciones y clientes.',
            'Reporte de incidencias y control de trazabilidad en ruta.'
          ]
        });
      }

      // Consultar la versión más reciente en MySQL
      fetch(API_ENDPOINT + '?id=' + encodeURIComponent(urlId))
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.item) {
            editingVacancyId = data.item.id;
            isNewVacancy = false;
            setFormData(data.item);
            const subTitleEl = document.getElementById('vacancyStudioSubtitle');
            if (subTitleEl) subTitleEl.textContent = `Editando: ${data.item.title}`;
            renderLiveCard();
          }
        })
        .catch(err => console.warn('Fetch vacante BD error:', err));
    } else {
      isNewVacancy = true;
      const initialId = generateSlug('nueva-vacante-' + Math.floor(100 + Math.random() * 900));
      setFormData({
        id: initialId,
        title: 'Nueva Vacante de Empleo',
        area: 'Monitoreo',
        mode: 'Presencial',
        location: 'Lerma, Estado de México',
        schedule: 'Tiempo completo',
        status: 'draft',
        sort_order: 10,
        recipient_emails: 'gadiel.palma@SELOASA.com.mx, rh@seloasa.com.mx',
        summary: 'En SELOASA buscamos talento calificado para integrarse a nuestro equipo especializado en cadena de frío y transporte farmacéutico de alta seguridad.',
        points: [
          'Experiencia previa en el área logística, transporte o farmacéutica.',
          'Enfoque en servicio, puntualidad y cumplimiento de lineamientos sanitarios.',
          'Habilidad para trabajo en equipo y uso de plataformas operativas.'
        ]
      });
      const subTitleEl = document.getElementById('vacancyStudioSubtitle');
      if (subTitleEl) subTitleEl.textContent = 'Creando Nueva Vacante';
    }

    // Auto-generar slug al escribir el título si es nueva
    document.getElementById('vacancyTitleInput')?.addEventListener('input', function () {
      if (isNewVacancy) {
        const slugInput = document.getElementById('vacancyIdInput');
        if (slugInput) slugInput.value = generateSlug(this.value);
      }
    });

    // Sincronizar selector de área con input
    const areaSelect = document.getElementById('vacancyAreaSelect');
    const areaInput = document.getElementById('vacancyAreaInput');
    if (areaSelect && areaInput) {
      areaSelect.addEventListener('change', function () {
        if (this.value !== 'custom') {
          areaInput.value = this.value;
          renderLivePreview();
        }
      });
      areaInput.addEventListener('input', function () {
        renderLivePreview();
      });
    }

    // Inputs que actualizan preview en vivo
    const liveInputs = [
      'vacancyTitleInput',
      'vacancyIdInput',
      'vacancyModeSelect',
      'vacancyLocationInput',
      'vacancyScheduleInput',
      'vacancyRecipientEmailsInput',
      'vacancySummaryInput',
      'vacancySortOrderInput'
    ];

    liveInputs.forEach(inputId => {
      const el = document.getElementById(inputId);
      if (el) {
        el.addEventListener('input', renderLivePreview);
        el.addEventListener('change', renderLivePreview);
      }
    });

    // Botones presets de correos rápidos
    document.querySelectorAll('.vacancy-email-preset-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const emailToAdd = this.getAttribute('data-email');
        const input = document.getElementById('vacancyRecipientEmailsInput');
        if (input && emailToAdd) {
          const current = input.value.trim();
          if (!current) {
            input.value = emailToAdd;
          } else if (!current.includes(emailToAdd)) {
            input.value = current + ', ' + emailToAdd;
          }
          renderLivePreview();
        }
      });
    });

    // Agregar nuevo punto
    document.getElementById('btnAddPointRow')?.addEventListener('click', function () {
      addPointRow('');
      const inputs = document.querySelectorAll('.vacancy-point-input');
      inputs[inputs.length - 1]?.focus();
      renderLivePreview();
    });

    // Switch de estado en el header
    const switchEl = document.getElementById('headerActiveSwitch');
    if (switchEl) {
      switchEl.addEventListener('change', function () {
        const lbl = document.getElementById('headerActiveLabel');
        if (lbl) lbl.textContent = this.checked ? 'Publicada en Web' : 'Borrador Interno';
        renderLivePreview();
      });
    }

    // Botón simular postulación
    document.getElementById('btnTestPostulationHeader')?.addEventListener('click', openSimulationModal);

    // Botones de guardar
    document.getElementById('btnSaveVacancyStudio')?.addEventListener('click', function () {
      saveVacancy(false);
    });

    // Vincular clic en pestañas de idioma de vacantes
    document.querySelectorAll('.vacancy-lang-tab-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const l = this.getAttribute('data-lang');
        if (l) switchVacancyLanguage(l);
      });
    });

    // Copiar desde español en vacantes
    document.getElementById('btnCopyVacancyFromSpanish')?.addEventListener('click', function (e) {
      e.preventDefault();
      if (currentVacancyLang === 'es') {
        alert('Ya estás editando la versión base en Español.');
        return;
      }
      const esData = vacancyTranslations.es || {};
      if (!esData.title) {
        vacancyTranslations.es = getTranslatableVacancyFields();
      }
      setTranslatableVacancyFields(vacancyTranslations.es);
      vacancyTranslations[currentVacancyLang] = JSON.parse(JSON.stringify(vacancyTranslations.es));
      updateVacancyLangBadges();
      renderLivePreview();
    });

    renderLivePreview();
  });
})();
