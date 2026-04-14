(function () {
  const MAX_CV_SIZE = 5 * 1024 * 1024;
  const ALLOWED_CV_EXTENSIONS = ['pdf', 'doc', 'docx'];
  const APPLICATION_STATUS_COOKIE = 'career_application_status';
  const VACANCIES_ENDPOINT = 'php/careers_vacancies.php';
  const VACANCY_UI_COPY = {
    es: {
      emptyTitle: 'No hay vacantes activas',
      emptyMessage: 'Por ahora no hay vacantes publicadas. Vuelve pronto para revisar nuevas oportunidades.',
      selectPlaceholder: 'No hay vacantes disponibles',
      formDisabled: 'En este momento no hay vacantes disponibles para postular.'
    },
    en: {
      emptyTitle: 'No active openings',
      emptyMessage: 'There are no published openings right now. Please check back soon for new opportunities.',
      selectPlaceholder: 'No openings available',
      formDisabled: 'There are no openings available to apply for right now.'
    },
    al: {
      emptyTitle: 'Keine aktiven Stellen',
      emptyMessage: 'Aktuell sind keine Stellen veroffentlicht. Bitte schau bald wieder vorbei.',
      selectPlaceholder: 'Keine Stellen verfugbar',
      formDisabled: 'Derzeit sind keine Stellen fur Bewerbungen verfugbar.'
    },
    pt: {
      emptyTitle: 'Sem vagas ativas',
      emptyMessage: 'No momento nao ha vagas publicadas. Volte em breve para consultar novas oportunidades.',
      selectPlaceholder: 'Sem vagas disponiveis',
      formDisabled: 'No momento nao ha vagas disponiveis para candidatura.'
    },
    fr: {
      emptyTitle: 'Aucun poste actif',
      emptyMessage: 'Aucun poste publie pour le moment. Revenez bientot pour voir de nouvelles opportunites.',
      selectPlaceholder: 'Aucun poste disponible',
      formDisabled: 'Aucun poste n est disponible pour candidater actuellement.'
    }
  };
  const STATUS_DIALOG_COPY = {
    es: {
      eyebrow: 'Estado de postulación',
      successTitle: 'Postulación enviada',
      warningTitle: 'Atención',
      errorTitle: 'No se pudo enviar',
      close: 'Continuar'
    },
    en: {
      eyebrow: 'Application status',
      successTitle: 'Application sent',
      warningTitle: 'Attention',
      errorTitle: 'Unable to send',
      close: 'Continue'
    },
    al: {
      eyebrow: 'Bewerbungsstatus',
      successTitle: 'Bewerbung gesendet',
      warningTitle: 'Hinweis',
      errorTitle: 'Senden nicht möglich',
      close: 'Weiter'
    },
    pt: {
      eyebrow: 'Status da candidatura',
      successTitle: 'Candidatura enviada',
      warningTitle: 'Atenção',
      errorTitle: 'Não foi possível enviar',
      close: 'Continuar'
    },
    fr: {
      eyebrow: 'Statut de candidature',
      successTitle: 'Candidature envoyee',
      warningTitle: 'Attention',
      errorTitle: 'Envoi impossible',
      close: 'Continuer'
    }
  };
  let vacancyItemsCache = null;
  let vacancyItemsCacheSource = '';
  let vacancyFetchPromise = null;
  let careersRenderRequestId = 0;

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
    return (window.I18N_PAGE_TRANSLATIONS && window.I18N_PAGE_TRANSLATIONS[safeLang] && window.I18N_PAGE_TRANSLATIONS[safeLang].careersPage)
      || (window.I18N_PAGE_TRANSLATIONS && window.I18N_PAGE_TRANSLATIONS.es && window.I18N_PAGE_TRANSLATIONS.es.careersPage)
      || null;
  }

  function isUnsupportedLocalPhpEnvironment() {
    const host = window.location.hostname;
    const port = window.location.port;
    const isLocalHost = host === '127.0.0.1' || host === 'localhost';
    const isLiveServerPort = ['5500', '5501', '5502', '5503', '5504'].includes(port);
    const serverHeader = String(window.location.href || '').toLowerCase();
    const isPhpRouter = isLocalHost && port === '5500' && !serverHeader.includes('live-server');
    return isLocalHost && isLiveServerPort && !isPhpRouter;
  }

  function getValidationMessages(lang) {
    const content = getPageContent(lang);
    return content && content.validation ? content.validation : {};
  }

  function getDialogCopy(lang) {
    return STATUS_DIALOG_COPY[normalizeLang(lang)] || STATUS_DIALOG_COPY.es;
  }

  function getVacancyUiCopy(lang) {
    return VACANCY_UI_COPY[normalizeLang(lang)] || VACANCY_UI_COPY.es;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getFallbackVacancyItems(lang) {
    const content = getPageContent(lang);
    return content && content.vacancies && Array.isArray(content.vacancies.items) ? content.vacancies.items : [];
  }

  function normalizeVacancyPoints(points) {
    if (!Array.isArray(points)) return [];

    return points
      .map((point) => String(point || '').trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  function normalizeVacancyItem(item) {
    if (!item || typeof item !== 'object') return null;

    const id = String(item.id || '').trim();
    const title = String(item.title || '').trim();
    const area = String(item.area || '').trim();
    const mode = String(item.mode || '').trim();
    const location = String(item.location || '').trim();
    const schedule = String(item.schedule || '').trim();
    const summary = String(item.summary || '').trim();
    const points = normalizeVacancyPoints(item.points);

    if (!id || !title || !area || !mode || !location || !schedule || !summary || !points.length) {
      return null;
    }

    return {
      id,
      title,
      area,
      mode,
      location,
      schedule,
      summary,
      points
    };
  }

  async function loadVacancyItems(lang) {
    if (Array.isArray(vacancyItemsCache) && vacancyItemsCacheSource === 'remote') {
      return vacancyItemsCache;
    }

    if (vacancyFetchPromise) {
      return vacancyFetchPromise;
    }

    vacancyFetchPromise = window.fetch(VACANCIES_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      cache: 'no-store'
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Vacancy endpoint returned ${response.status}`);
        }

        return response.json();
      })
      .then((data) => {
        const items = Array.isArray(data && data.items) ? data.items.map(normalizeVacancyItem).filter(Boolean) : [];
        vacancyItemsCache = items;
        vacancyItemsCacheSource = 'remote';
        return items;
      })
      .catch(() => getFallbackVacancyItems(lang).map(normalizeVacancyItem).filter(Boolean))
      .finally(() => {
        vacancyFetchPromise = null;
      });

    return vacancyFetchPromise;
  }

  function getStatusTone(statusKey) {
    if (statusKey === 'success') return 'success';
    if (statusKey === 'file_too_large' || statusKey === 'local_dev_unsupported') return 'warning';
    return 'error';
  }

  function getStatusTitle(lang, statusKey) {
    const copy = getDialogCopy(lang);
    const tone = getStatusTone(statusKey);

    if (tone === 'success') return copy.successTitle;
    if (tone === 'warning') return copy.warningTitle;
    return copy.errorTitle;
  }

  function getStatusIconClass(statusKey) {
    const tone = getStatusTone(statusKey);

    if (tone === 'success') return 'fa-check';
    if (tone === 'warning') return 'fa-exclamation';
    return 'fa-times';
  }

  function renderInlineStatus(statusConfig) {
    const container = document.getElementById('careersApplicationStatus');
    if (!container) return;

    if (!statusConfig) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `<div class="alert ${statusConfig.type}" role="alert">${statusConfig.message}</div>`;
  }

  function ensureStatusModalStyles() {
    if (document.getElementById('careersStatusModalStyles')) return;

    const style = document.createElement('style');
    style.id = 'careersStatusModalStyles';
    style.textContent = `
      .careers-status-dialog{max-width:460px}
      .careers-status-modal-content{position:relative;border:0;border-radius:28px;overflow:hidden;background:radial-gradient(circle at top right, rgba(228,59,20,.10), transparent 42%),linear-gradient(180deg,#ffffff 0%,#fffaf8 100%);box-shadow:0 28px 60px rgba(31,37,43,.20)}
      .careers-status-modal-content::before{content:"";position:absolute;inset:0 0 auto;height:7px;background:linear-gradient(90deg,#e43b14 0%,#bf2f0f 100%)}
      .careers-status-close{position:absolute;top:18px;right:18px;z-index:2;width:38px;height:38px;border-radius:50%;background-color:rgba(31,37,43,.06);padding:0;box-shadow:none;opacity:1}
      .careers-status-close:hover,.careers-status-close:focus{background-color:rgba(31,37,43,.10);box-shadow:none;opacity:1}
      .careers-status-modal-body{padding:38px 34px 18px;text-align:center}
      .careers-status-kicker{display:inline-flex;align-items:center;justify-content:center;min-height:30px;padding:6px 14px;border-radius:999px;background:rgba(228,59,20,.08);color:#bf2f0f;font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
      .careers-status-icon-wrap{width:86px;height:86px;margin:22px auto 18px;border-radius:28px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,rgba(228,59,20,.14) 0%,rgba(228,59,20,.08) 100%);color:#e43b14;box-shadow:inset 0 0 0 1px rgba(228,59,20,.12)}
      .careers-status-icon-wrap i{font-size:2rem}
      .careers-status-modal-title{margin:0;color:#1f252b;font-size:1.7rem;font-weight:800;line-height:1.15}
      .careers-status-modal-message{margin:14px auto 0;max-width:30ch;color:#4d5258;font-size:1rem;line-height:1.75}
      .careers-status-modal-hint{margin-top:16px;color:#7a8086;font-size:.9rem;line-height:1.6}
      .careers-status-modal-footer{padding:0 34px 32px}
      .careers-status-modal-button{width:100%;min-height:54px;border-radius:16px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
      #careersStatusModal[data-status-tone="success"] .careers-status-kicker,#careersStatusModal[data-status-tone="success"] .careers-status-icon-wrap{background:rgba(44,156,76,.10);color:#1f7a39;box-shadow:inset 0 0 0 1px rgba(44,156,76,.16)}
      #careersStatusModal[data-status-tone="warning"] .careers-status-kicker,#careersStatusModal[data-status-tone="warning"] .careers-status-icon-wrap{background:rgba(255,189,89,.16);color:#b36a00;box-shadow:inset 0 0 0 1px rgba(255,189,89,.28)}
      #careersStatusModal[data-status-tone="error"] .careers-status-kicker,#careersStatusModal[data-status-tone="error"] .careers-status-icon-wrap{background:rgba(228,59,20,.10);color:#bf2f0f;box-shadow:inset 0 0 0 1px rgba(228,59,20,.14)}
      #careersStatusModal[data-status-tone="success"] .careers-status-kicker{color:#1f7a39}
      #careersStatusModal[data-status-tone="warning"] .careers-status-kicker{color:#b36a00}
      @media (max-width:575.98px){
        .careers-status-dialog{margin:1rem}
        .careers-status-modal-body{padding:34px 22px 16px}
        .careers-status-modal-footer{padding:0 22px 24px}
        .careers-status-modal-title{font-size:1.45rem}
        .careers-status-modal-message{max-width:none;font-size:.96rem}
        .careers-status-icon-wrap{width:74px;height:74px;border-radius:24px}
      }
    `;

    document.head.appendChild(style);
  }

  function ensureStatusModal() {
    let modal = document.getElementById('careersStatusModal');
    if (modal) return modal;

    ensureStatusModalStyles();

    modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'careersStatusModal';
    modal.tabIndex = -1;
    modal.setAttribute('aria-labelledby', 'careersStatusModalTitle');
    modal.setAttribute('aria-describedby', 'careersStatusModalMessage');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered careers-status-dialog">
        <div class="modal-content careers-status-modal-content">
          <button type="button" class="btn-close careers-status-close" data-bs-dismiss="modal" aria-label="Close"></button>
          <div class="careers-status-modal-body">
            <div class="careers-status-kicker" id="careersStatusModalEyebrow"></div>
            <div class="careers-status-icon-wrap" id="careersStatusModalIconWrap" aria-hidden="true">
              <i id="careersStatusModalIcon" class="fa"></i>
            </div>
            <h5 class="careers-status-modal-title" id="careersStatusModalTitle"></h5>
            <p class="careers-status-modal-message" id="careersStatusModalMessage"></p>
            <div class="careers-status-modal-hint" id="careersStatusModalHint"></div>
          </div>
          <div class="careers-status-modal-footer">
            <button type="button" class="btn btn-primary btn-hero-primary careers-status-modal-button" data-bs-dismiss="modal" id="careersStatusModalButton"></button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  function getBootstrapModal(modalElement) {
    if (!window.bootstrap || !window.bootstrap.Modal) return null;

    if (typeof window.bootstrap.Modal.getOrCreateInstance === 'function') {
      return window.bootstrap.Modal.getOrCreateInstance(modalElement);
    }

    if (typeof window.bootstrap.Modal.getInstance === 'function') {
      return window.bootstrap.Modal.getInstance(modalElement) || new window.bootstrap.Modal(modalElement);
    }

    return new window.bootstrap.Modal(modalElement);
  }

  function readCookie(name) {
    const cookie = document.cookie
      .split('; ')
      .find((item) => item.indexOf(`${name}=`) === 0);

    if (!cookie) return '';
    return decodeURIComponent(cookie.substring(name.length + 1));
  }

  function clearCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }

  function getUrlWithoutStatusParam(paramName) {
    const url = new URL(window.location.href);
    url.searchParams.delete(paramName);
    const nextSearch = url.searchParams.toString();
    return `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`;
  }

  function showStatusPopup(lang, statusKey, statusConfig, options = {}) {
    if (!statusConfig || window.__careersStatusPopupShown === statusKey) return;

    window.__careersStatusPopupShown = statusKey;

    const title = getStatusTitle(lang, statusKey);
    const copy = getDialogCopy(lang);
    const reloadUrl = options.reloadUrl || '';
    const tone = getStatusTone(statusKey);
    const iconClass = getStatusIconClass(statusKey);

    if (!window.bootstrap || !window.bootstrap.Modal) {
      window.alert(`${title}\n\n${statusConfig.message}`);
      if (reloadUrl) {
        window.location.replace(reloadUrl);
      }
      return;
    }

    const modalElement = ensureStatusModal();
    const eyebrowElement = modalElement.querySelector('#careersStatusModalEyebrow');
    const iconWrapElement = modalElement.querySelector('#careersStatusModalIconWrap');
    const iconElement = modalElement.querySelector('#careersStatusModalIcon');
    const titleElement = modalElement.querySelector('#careersStatusModalTitle');
    const messageElement = modalElement.querySelector('#careersStatusModalMessage');
    const hintElement = modalElement.querySelector('#careersStatusModalHint');
    const buttonElement = modalElement.querySelector('#careersStatusModalButton');
    const closeElement = modalElement.querySelector('.btn-close');

    if (!eyebrowElement || !iconWrapElement || !iconElement || !titleElement || !messageElement || !hintElement || !buttonElement || !closeElement) {
      window.alert(`${title}\n\n${statusConfig.message}`);
      return;
    }

    modalElement.setAttribute('data-status-tone', tone);
    eyebrowElement.textContent = copy.eyebrow;
    iconWrapElement.setAttribute('data-status-tone', tone);
    iconElement.className = `fa ${iconClass}`;
    titleElement.textContent = title;
    messageElement.textContent = statusConfig.message;
    hintElement.textContent = '';
    hintElement.hidden = true;
    buttonElement.textContent = copy.close;
    closeElement.setAttribute('aria-label', copy.close);

    if (reloadUrl) {
      modalElement.addEventListener('hidden.bs.modal', () => {
        window.location.replace(reloadUrl);
      }, { once: true });
    }

    const modal = getBootstrapModal(modalElement);
    if (!modal || typeof modal.show !== 'function') {
      window.alert(`${title}\n\n${statusConfig.message}`);
      if (reloadUrl) {
        window.location.replace(reloadUrl);
      }
      return;
    }

    modal.show();
  }

  function sanitizePhoneValue(value) {
    return String(value || '')
      .replace(/[^0-9+\s()-]/g, '')
      .replace(/(?!^)\+/g, '')
      .replace(/\s{2,}/g, ' ')
      .trimStart();
  }

  function getPhoneDigits(value) {
    return String(value || '').replace(/\D+/g, '');
  }

  function normalizeFullNameValue(value, commit) {
    const source = String(value || '').replace(/[^\p{L}\p{M}\s.'-]/gu, '');
    const collapsed = source.replace(/\s{2,}/g, ' ');
    return commit ? collapsed.trim() : collapsed.replace(/^\s+/, '');
  }

  function validateFullNameField(field, messages, commit = false) {
    const displayValue = normalizeFullNameValue(field.value, commit);
    const value = displayValue.trim();
    const hasTwoWords = /\S+\s+\S+/.test(value);
    const hasValidChars = /^[\p{L}\p{M}\s.'-]+$/u.test(value);
    const isValid = value.length >= 5 && hasTwoWords && hasValidChars;

    field.value = displayValue;
    field.setCustomValidity(isValid ? '' : (messages.full_name_invalid || 'Ingresa un nombre completo válido.'));
    return isValid;
  }

  function validateEmailField(field, messages) {
    const value = String(field.value || '').trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    field.value = value;
    field.setCustomValidity(isValid ? '' : (messages.email_invalid || 'Ingresa un correo válido.'));
    return isValid;
  }

  function validatePhoneField(field, messages) {
    const cleaned = sanitizePhoneValue(field.value);
    const digits = getPhoneDigits(cleaned);
    const isValid = digits.length >= 10 && digits.length <= 15;

    field.value = cleaned;
    field.setCustomValidity(isValid ? '' : (messages.phone_invalid || 'Ingresa un teléfono válido con lada.'));
    return isValid;
  }

  function validateVacancyField(field, messages) {
    const isValid = String(field.value || '').trim() !== '';
    field.setCustomValidity(isValid ? '' : (messages.vacancy_invalid || 'Selecciona una vacante válida.'));
    return isValid;
  }

  function validateCvField(field, messages) {
    const file = field.files && field.files[0] ? field.files[0] : null;

    if (!file) {
      field.setCustomValidity(messages.cv_required || 'Adjunta tu CV para continuar.');
      return false;
    }

    const extension = String(file.name || '').split('.').pop().toLowerCase();
    if (!ALLOWED_CV_EXTENSIONS.includes(extension)) {
      field.setCustomValidity(messages.cv_invalid || 'El CV debe estar en formato PDF, DOC o DOCX.');
      return false;
    }

    if (file.size > MAX_CV_SIZE) {
      field.setCustomValidity(messages.cv_too_large || 'El CV no debe exceder 5 MB.');
      return false;
    }

    field.setCustomValidity('');
    return true;
  }

  function renderVacancies(lang, vacancyItems) {
    const content = getPageContent(lang);
    const container = document.getElementById('careersVacancyList');
    if (!container || !content || !content.vacancies) return;

    if (!Array.isArray(vacancyItems) || !vacancyItems.length) {
      const uiCopy = getVacancyUiCopy(lang);
      container.innerHTML = `
        <div class="col-12">
          <article class="careers-vacancy-card h-100">
            <h3 class="careers-vacancy-title mb-3">${escapeHtml(uiCopy.emptyTitle)}</h3>
            <p class="careers-vacancy-summary mb-0">${escapeHtml(uiCopy.emptyMessage)}</p>
          </article>
        </div>
      `;
      return;
    }

    container.innerHTML = vacancyItems.map((job) => `
      <div class="col-lg-4 col-md-6">
        <article class="careers-vacancy-card h-100">
          <div class="careers-vacancy-top">
            <span class="careers-vacancy-pill">${escapeHtml(job.area)}</span>
            <span class="careers-vacancy-pill">${escapeHtml(job.mode)}</span>
          </div>
          <h3 class="careers-vacancy-title mb-3">${escapeHtml(job.title)}</h3>
          <div class="careers-vacancy-meta">
            <div class="careers-vacancy-meta-row"><i class="fa fa-map-marker-alt"></i><span>${escapeHtml(job.location)}</span></div>
            <div class="careers-vacancy-meta-row"><i class="fa fa-clock"></i><span>${escapeHtml(job.schedule)}</span></div>
          </div>
          <p class="careers-vacancy-summary mb-0">${escapeHtml(job.summary)}</p>
          <ul class="careers-vacancy-list">
            ${job.points.map((point) => `<li><i class="fa fa-check-circle"></i><span>${escapeHtml(point)}</span></li>`).join('')}
          </ul>
          <div class="careers-vacancy-actions">
            <button type="button" class="btn btn-primary btn-hero-primary" data-careers-apply="${escapeHtml(job.id)}">${escapeHtml(content.vacancies.apply_button)}</button>
          </div>
        </article>
      </div>
    `).join('');
  }

  function updateApplicationAvailability(lang, vacancyItems) {
    const select = document.getElementById('careerVacancySelect');
    const submitButton = document.querySelector('#careerApplicationForm button[type="submit"]');
    const hasVacancies = Array.isArray(vacancyItems) && vacancyItems.length > 0;
    const uiCopy = getVacancyUiCopy(lang);

    if (select) {
      select.disabled = !hasVacancies;
    }

    if (submitButton) {
      submitButton.disabled = !hasVacancies;
      submitButton.title = hasVacancies ? '' : uiCopy.formDisabled;
    }
  }

  function populateVacancySelect(lang, vacancyItems) {
    const content = getPageContent(lang);
    const select = document.getElementById('careerVacancySelect');
    const titleInput = document.getElementById('careerVacancyTitle');
    if (!select || !titleInput || !content || !content.form) return;

    const previous = select.value;
    const uiCopy = getVacancyUiCopy(lang);
    select.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = Array.isArray(vacancyItems) && vacancyItems.length
      ? content.form.vacancy_placeholder
      : uiCopy.selectPlaceholder;
    placeholder.selected = true;
    select.appendChild(placeholder);

    (Array.isArray(vacancyItems) ? vacancyItems : []).forEach((job) => {
      const option = document.createElement('option');
      option.value = job.id;
      option.textContent = job.title;
      option.setAttribute('data-title', job.title);
      select.appendChild(option);
    });

    if (previous && Array.from(select.options).some((option) => option.value === previous)) {
      select.value = previous;
    }

    const selectedOption = select.options[select.selectedIndex];
    titleInput.value = selectedOption && selectedOption.value ? selectedOption.getAttribute('data-title') || selectedOption.textContent : '';
    updateApplicationAvailability(lang, vacancyItems);
  }

  function updateStatus(lang) {
    const content = getPageContent(lang);
    if (!content || !content.applicationStatus) return;

    const cookieStatus = readCookie(APPLICATION_STATUS_COOKIE);
    if (cookieStatus && content.applicationStatus[cookieStatus]) {
      clearCookie(APPLICATION_STATUS_COOKIE);
      renderInlineStatus(null);
      showStatusPopup(lang, cookieStatus, content.applicationStatus[cookieStatus], {
        reloadUrl: window.location.pathname + window.location.search + window.location.hash
      });
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const status = params.get('application');

    if (!status || !content.applicationStatus[status]) {
      renderInlineStatus(null);
      return;
    }

    const statusConfig = content.applicationStatus[status];
    renderInlineStatus(null);
    showStatusPopup(lang, status, statusConfig, { reloadUrl: getUrlWithoutStatusParam('application') });
  }

  function showStatusMessage(lang, statusKey) {
    const content = getPageContent(lang);
    if (!content || !content.applicationStatus || !content.applicationStatus[statusKey]) return;

    const statusConfig = content.applicationStatus[statusKey];
    renderInlineStatus(null);
    showStatusPopup(lang, statusKey, statusConfig);
  }

  function syncSelectedVacancyTitle() {
    const select = document.getElementById('careerVacancySelect');
    const titleInput = document.getElementById('careerVacancyTitle');
    if (!select || !titleInput) return;

    const selectedOption = select.options[select.selectedIndex];
    titleInput.value = selectedOption && selectedOption.value ? selectedOption.getAttribute('data-title') || selectedOption.textContent : '';
  }

  function scrollToApplication() {
    const section = document.getElementById('careersApplySection');
    if (!section) return;

    const nav = document.querySelector('.site-navbar');
    const offset = nav ? nav.offsetHeight + 16 : 16;
    const top = section.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  function bindInteractions() {
    const select = document.getElementById('careerVacancySelect');
    if (select && !select.dataset.bound) {
      select.dataset.bound = 'true';
      select.addEventListener('change', syncSelectedVacancyTitle);
    }

    if (!document.body.dataset.careersApplyBound) {
      document.body.dataset.careersApplyBound = 'true';
      document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-careers-apply]');
        if (!trigger) return;

        const vacancyId = trigger.getAttribute('data-careers-apply');
        const vacancySelect = document.getElementById('careerVacancySelect');
        if (!vacancySelect) return;

        vacancySelect.value = vacancyId;
        syncSelectedVacancyTitle();
        scrollToApplication();
        vacancySelect.focus();
      });
    }
  }

  function bindFormValidation() {
    const form = document.getElementById('careerApplicationForm');
    if (!form || form.dataset.validationBound === 'true') return;

    const fullName = document.getElementById('careerFullName');
    const email = document.getElementById('careerEmail');
    const phone = document.getElementById('careerPhone');
    const vacancy = document.getElementById('careerVacancySelect');
    const cv = document.getElementById('careerCvFile');

    const getMessages = () => getValidationMessages(getCurrentLang());

    if (fullName) {
      fullName.addEventListener('input', () => validateFullNameField(fullName, getMessages(), false));
      fullName.addEventListener('blur', () => validateFullNameField(fullName, getMessages(), true));
    }

    if (email) {
      email.addEventListener('input', () => validateEmailField(email, getMessages()));
      email.addEventListener('blur', () => validateEmailField(email, getMessages()));
    }

    if (phone) {
      phone.addEventListener('input', () => {
        phone.value = sanitizePhoneValue(phone.value);
        validatePhoneField(phone, getMessages());
      });
      phone.addEventListener('blur', () => validatePhoneField(phone, getMessages()));
    }

    if (vacancy) {
      vacancy.addEventListener('change', () => validateVacancyField(vacancy, getMessages()));
    }

    if (cv) {
      cv.addEventListener('change', () => validateCvField(cv, getMessages()));
    }

    form.addEventListener('submit', (event) => {
      const messages = getMessages();
      const checks = [
        fullName ? { field: fullName, valid: validateFullNameField(fullName, messages, true) } : null,
        email ? { field: email, valid: validateEmailField(email, messages) } : null,
        phone ? { field: phone, valid: validatePhoneField(phone, messages) } : null,
        vacancy ? { field: vacancy, valid: validateVacancyField(vacancy, messages) } : null,
        cv ? { field: cv, valid: validateCvField(cv, messages) } : null
      ].filter(Boolean);

      const firstInvalid = checks.find((item) => !item.valid);
      if (!firstInvalid) return;

      event.preventDefault();
      firstInvalid.field.reportValidity();
      firstInvalid.field.focus();
      return;
    });

    form.addEventListener('submit', (event) => {
      if (!isUnsupportedLocalPhpEnvironment()) return;

      event.preventDefault();
      showStatusMessage(getCurrentLang(), 'local_dev_unsupported');
    });

    form.dataset.validationBound = 'true';
  }

  async function renderCareersPage(lang) {
    const requestId = ++careersRenderRequestId;
    const vacancyItems = await loadVacancyItems(lang);
    if (requestId !== careersRenderRequestId) {
      return;
    }

    renderVacancies(lang, vacancyItems);
    populateVacancySelect(lang, vacancyItems);
    updateStatus(lang);
    bindInteractions();
    bindFormValidation();
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderCareersPage(getCurrentLang());
  });

  document.addEventListener('site-language-changed', function (event) {
    renderCareersPage(event.detail && event.detail.lang ? event.detail.lang : getCurrentLang());
  });
})();
