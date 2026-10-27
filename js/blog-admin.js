/**
 * SELOASA - Blog Admin Dashboard & 2FA Controller
 * Administrador completo de Comunicados, Noticias y Blog con autenticación de correo, contraseña y Google Authenticator 2FA.
 */
(function () {
  'use strict';

  const STORAGE_KEYS = {
    AUTH_SESSION: 'seloasa_admin_auth_session',
    POSTS_DATA: 'seloasa_blog_posts',
    VACANCIES_DATA: 'seloasa_careers_vacancies',
    POPUPS_DATA: 'seloasa_site_popups',
    ACTIVE_POPUP_ID: 'seloasa_active_popup_id'
  };

  let currentPosts = [];
  let currentVacancies = [];
  let currentPopups = [];
  let currentEditingId = null;
  let currentEditingVacancyId = null;
  let activeFilterType = 'all';
  let activeFilterStatus = 'all';
  let activeSearchTerm = '';
  let activeVacancyArea = 'all';
  let activeVacancyStatus = 'all';
  let activeVacancySearchTerm = '';
  let activePopupFilterType = 'all';
  let activePopupSearchTerm = '';
  let totpIntervalId = null;

  /* ==========================================================================
     RESOLUCIÓN DINÁMICA DE APIS (Soporta Apache :80, Live Server :5500-:5501, file://)
     ========================================================================== */
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
  window.getBackendApiUrl = getBackendApiUrl;

  function getApiFetchOptions(method = 'GET', body = null) {
    const isFile = window.location.protocol === 'file:';
    const opts = {
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (!isFile) {
      opts.credentials = 'include';
    }
    if (body !== null) {
      opts.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    return opts;
  }
  window.getApiFetchOptions = getApiFetchOptions;

  /* ==========================================================================
     GESTOR DE SESIÓN Y VISTAS (LOGIN VS DASHBOARD)
     ========================================================================== */

  function isAuthenticated() {
    const sessionToken = sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION) || localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    return Boolean(sessionToken);
  }

  function setAuthenticated(rememberMe = false) {
    const token = 'seloasa_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, token);
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, token);
    }
  }

  function clearAuthentication() {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }

  function showDashboardView() {
    const authWrapper = document.getElementById('authWrapper');
    const dashboardWrapper = document.getElementById('dashboardWrapper');
    if (authWrapper) authWrapper.classList.add('d-none');
    if (dashboardWrapper) dashboardWrapper.classList.remove('d-none');

    // Sincronizar publicaciones, pop-ups y vacantes con el backend
    loadPosts();
    loadPopups();
    loadVacancies();
  }

  function showAuthView() {
    const authWrapper = document.getElementById('authWrapper');
    const dashboardWrapper = document.getElementById('dashboardWrapper');
    if (dashboardWrapper) dashboardWrapper.classList.add('d-none');
    if (authWrapper) authWrapper.classList.remove('d-none');

    const step1Section = document.getElementById('step1Section');
    const step2Section = document.getElementById('step2Section');
    const substepEmailFormWrap = document.getElementById('substepEmailFormWrap');
    const substepEmailCodeWrap = document.getElementById('substepEmailCodeWrap');
    const step1Indicator = document.getElementById('step1Indicator');
    const step2Indicator = document.getElementById('step2Indicator');

    if (step1Section) step1Section.classList.remove('d-none');
    if (step2Section) step2Section.classList.add('d-none');
    if (substepEmailFormWrap) substepEmailFormWrap.classList.remove('d-none');
    if (substepEmailCodeWrap) substepEmailCodeWrap.classList.add('d-none');
    if (step1Indicator) {
      step1Indicator.classList.add('active');
      step1Indicator.classList.remove('completed');
    }
    if (step2Indicator) {
      step2Indicator.classList.remove('active');
      step2Indicator.classList.remove('completed');
    }
  }

  /* ==========================================================================
     ALMACÉN DE DATOS DE PUBLICACIONES
     ========================================================================== */

  function loadPosts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.POSTS_DATA);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentPosts = parsed;
        }
      }
    } catch (e) {
      console.warn('Error al leer posts de cache local:', e);
    }

    // Consultar directamente la API de Noticias
    fetch(getBackendApiUrl('php/noticias_api.php'), getApiFetchOptions('GET'))
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.items)) {
          currentPosts = data.items;
          localStorage.setItem(STORAGE_KEYS.POSTS_DATA, JSON.stringify(currentPosts));
          renderKpis();
          renderPostsTable();
        }
      })
      .catch(err => console.warn('Sync noticias BD error:', err));

    return currentPosts;
  }

  function savePosts() {
    try {
      localStorage.setItem(STORAGE_KEYS.POSTS_DATA, JSON.stringify(currentPosts));
      window.dispatchEvent(new Event('storage'));
      fetch(getBackendApiUrl('php/noticias_api.php'), getApiFetchOptions('POST', { items: currentPosts }))
        .catch(e => console.error('Error al guardar publicaciones:', e));
    } catch (e) {
      console.error('Error al guardar publicaciones:', e);
    }
  }

  /* ==========================================================================
     VISTAS: LOGIN Y 2FA
     ========================================================================== */
  /* ==========================================================================
     VISTAS: ACCESO SIN CONTRASEÑA (CÓDIGO EMAIL 10 MIN + GOOGLE 2FA)
     ========================================================================== */
  let emailOtpIntervalId = null;
  let currentTargetEmail = '';

  function getAuthApiUrl(query) {
    return getBackendApiUrl('php/auth_api.php' + (query ? '?' + query.replace(/^\?/, '') : ''));
  }

  function getAuthFetchOptions(method, body) {
    return getApiFetchOptions(method, body);
  }

  async function parseFetchResponse(res) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return {
        success: false,
        error: (res.status === 404 ? 'Servicio no encontrado (404). ' : 'Servidor respondió (' + res.status + '): ') + (text ? text.substring(0, 150) : 'Sin datos')
      };
    }
  }

  function initAuthFlow() {
    const emailRequestForm = document.getElementById('adminEmailRequestForm');
    const emailVerifyForm = document.getElementById('adminEmailVerifyForm');
    const totpForm = document.getElementById('adminTotpForm');
    const step1Indicator = document.getElementById('step1Indicator');
    const step2Indicator = document.getElementById('step2Indicator');
    const step1Section = document.getElementById('step1Section');
    const step2Section = document.getElementById('step2Section');
    const substepEmailFormWrap = document.getElementById('substepEmailFormWrap');
    const substepEmailCodeWrap = document.getElementById('substepEmailCodeWrap');
    const sentEmailTargetDisplay = document.getElementById('sentEmailTargetDisplay');

    // Detección de protocolo file:///
    if (window.location.protocol === 'file:') {
      const isUnderBlog = window.location.pathname.includes('/blog/');
      const serverUrl = isUnderBlog ? 'http://localhost/shipping/blog/admin/index.html' : 'http://localhost/shipping/admin/noticias.html';
      const fileNotice = document.getElementById('fileProtocolNotice');
      const fileRedirectLink = document.getElementById('fileProtocolRedirectLink');
      if (fileNotice) {
        fileNotice.classList.remove('d-none');
        if (fileRedirectLink) fileRedirectLink.href = serverUrl;
      }
    }

    // SUB-PASO 1A: Solicitud de Código de 6 Dígitos por Correo (Sin contraseña)
    if (emailRequestForm) {
      emailRequestForm.addEventListener('submit', function (e) {
        e.preventDefault();
        hideAuthMessages();

        const email = (document.getElementById('adminEmailInput').value || '').trim();
        if (!email) {
          showAuthError('Por favor ingresa un correo institucional.');
          return;
        }

        const submitBtn = document.getElementById('btnRequestEmailCode');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando código...';
        }

        fetch(getAuthApiUrl('action=request_email_code'), getAuthFetchOptions('POST', { email: email }))
          .then(parseFetchResponse)
          .then(data => {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '<i class="fa fa-paper-plane me-1"></i><span>Enviar Código de 6 Dígitos</span>';
            }

            if (data && data.success) {
              currentTargetEmail = email;
              if (sentEmailTargetDisplay) sentEmailTargetDisplay.textContent = email;

              // Mostrar sub-paso 1B
              substepEmailFormWrap.classList.add('d-none');
              substepEmailCodeWrap.classList.remove('d-none');
              hideAuthMessages();

              // Iniciar cronómetro de 10 minutos (600s)
              startEmailOtpCountdown(data.expires_in || 600);
              setupDigitInputs('.email-digit-input', 'btnVerifyEmailOtp');
            } else {
              showAuthError(data.error || 'El correo ingresado no cuenta con autorización administrativa.');
            }
          })
          .catch(err => {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '<i class="fa fa-paper-plane me-1"></i><span>Enviar Código de 6 Dígitos</span>';
            }
            if (window.location.protocol === 'file:') {
              showAuthError('No fue posible contactar a Apache desde file:///. Abre el panel ingresando en tu navegador a: http://localhost/shipping/admin/noticias.html (o http://localhost/shipping/blog/admin/index.html)');
            } else {
              showAuthError('Error de comunicación con el servidor: ' + (err.message || 'Verifica que Apache esté activo en XAMPP.'));
            }
          });
      });
    }

    // SUB-PASO 1B: Verificación del Código de 6 Dígitos del Correo (10 minutos)
    if (emailVerifyForm) {
      emailVerifyForm.addEventListener('submit', function (e) {
        e.preventDefault();
        hideAuthMessages();

        const code = getEnteredDigitCode('.email-digit-input');
        if (code.length !== 6) {
          showAuthError('Ingresa el código completo de 6 dígitos enviado a tu correo.');
          return;
        }

        const verifyBtn = document.getElementById('btnVerifyEmailOtp');
        if (verifyBtn) {
          verifyBtn.disabled = true;
          verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Validando código...';
        }

        fetch(getAuthApiUrl('action=verify_email_code'), getAuthFetchOptions('POST', { email: currentTargetEmail, code: code }))
          .then(parseFetchResponse)
          .then(data => {
            if (verifyBtn) {
              verifyBtn.disabled = false;
              verifyBtn.innerHTML = '<span>Continuar a Google 2FA</span><i class="fa fa-arrow-right ms-1"></i>';
            }

            if (data && data.success) {
              stopEmailOtpCountdown();
              hideAuthMessages();

              // Transición a PASO 2: GOOGLE AUTHENTICATOR (2FA)
              step1Section.classList.add('d-none');
              step2Section.classList.remove('d-none');
              step1Indicator.classList.remove('active');
              step1Indicator.classList.add('completed');
              step2Indicator.classList.add('active');

              setupDigitInputs('.google-digit-input', 'verifyTotpBtn');
              startTotpCountdown();
              renderQrSetup();
            } else {
              showAuthError(data.error || 'Código de correo incorrecto o expirado.');
              clearDigitInputs('.email-digit-input');
            }
          })
          .catch(err => {
            if (verifyBtn) {
              verifyBtn.disabled = false;
              verifyBtn.innerHTML = '<span>Continuar a Google 2FA</span><i class="fa fa-arrow-right ms-1"></i>';
            }
            showAuthError('Error de conexión al verificar el código de correo: ' + (err.message || 'Revisa tu conexión.'));
          });
      });
    }

    // Botón Reenviar Código de Correo
    const btnResendEmailOtp = document.getElementById('btnResendEmailOtp');
    if (btnResendEmailOtp) {
      btnResendEmailOtp.addEventListener('click', function () {
        if (!currentTargetEmail) return;
        btnResendEmailOtp.disabled = true;
        btnResendEmailOtp.innerHTML = '<i class="fa fa-spinner fa-spin me-1"></i> Reenviando...';

        fetch(getAuthApiUrl('action=request_email_code'), getAuthFetchOptions('POST', { email: currentTargetEmail }))
          .then(parseFetchResponse)
          .then(data => {
            if (data && data.success) {
              showAuthSuccess('Nuevo código de 6 dígitos enviado. Tienes 10 minutos para ingresarlo.');
              startEmailOtpCountdown(data.expires_in || 600);
              clearDigitInputs('.email-digit-input');
            } else {
              showAuthError(data.error || 'No fue posible reenviar el código.');
            }
            setTimeout(() => {
              btnResendEmailOtp.disabled = false;
              btnResendEmailOtp.innerHTML = '<i class="fa fa-sync-alt me-1"></i> Reenviar código';
            }, 3000);
          })
          .catch(() => {
            showAuthError('Error de comunicación al reenviar el código.');
            btnResendEmailOtp.disabled = false;
            btnResendEmailOtp.innerHTML = '<i class="fa fa-sync-alt me-1"></i> Reenviar código';
          });
      });
    }

    // Botón Cambiar Correo
    const btnChangeEmail = document.getElementById('btnChangeEmail');
    if (btnChangeEmail) {
      btnChangeEmail.addEventListener('click', function () {
        stopEmailOtpCountdown();
        hideAuthMessages();
        clearDigitInputs('.email-digit-input');
        substepEmailCodeWrap.classList.add('d-none');
        substepEmailFormWrap.classList.remove('d-none');
      });
    }

    // Regresar de Paso 2 (Google 2FA) a Paso 1 (Correo)
    const backToStep1Btn = document.getElementById('backToStep1Btn');
    if (backToStep1Btn) {
      backToStep1Btn.addEventListener('click', function () {
        stopTotpCountdown();
        hideAuthMessages();
        step2Section.classList.add('d-none');
        step1Section.classList.remove('d-none');
        step2Indicator.classList.remove('active');
        step1Indicator.classList.remove('completed');
        step1Indicator.classList.add('active');
        substepEmailCodeWrap.classList.remove('d-none');
        substepEmailFormWrap.classList.add('d-none');
      });
    }

    // Paso 2: Verificación de código Google Authenticator (TOTP)
    if (totpForm) {
      totpForm.addEventListener('submit', function (e) {
        e.preventDefault();
        hideAuthMessages();

        const code = getEnteredDigitCode('.google-digit-input');
        if (code.length !== 6) {
          showAuthError('Ingresa el código completo de 6 dígitos de Google Authenticator.');
          return;
        }

        const verifyBtn = document.getElementById('verifyTotpBtn');
        if (verifyBtn) verifyBtn.disabled = true;
        const rememberMe = document.getElementById('rememberMeCheck')?.checked || false;

        fetch(getAuthApiUrl('action=login_step2'), getAuthFetchOptions('POST', { code: code, remember: rememberMe }))
          .then(parseFetchResponse)
          .then(data => {
            if (verifyBtn) verifyBtn.disabled = false;
            if (data && data.success) {
              setAuthenticated(rememberMe);
              stopTotpCountdown();
              stopEmailOtpCountdown();
              showDashboardView();
            } else {
              showAuthError(data.error || 'Código de Google Authenticator incorrecto o expirado.');
              clearDigitInputs('.google-digit-input');
            }
          })
          .catch(err => {
            if (verifyBtn) verifyBtn.disabled = false;
            showAuthError('Error al validar código 2FA con el servidor: ' + (err.message || 'Verifica tu conexión.'));
          });
      });
    }
  }

  function startEmailOtpCountdown(seconds) {
    stopEmailOtpCountdown();
    const countdownText = document.getElementById('emailOtpCountdownText');
    const progressBar = document.getElementById('emailOtpProgressBar');
    const totalSeconds = seconds || 600;
    let remaining = totalSeconds;

    function formatTime(s) {
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} min`;
    }

    function tick() {
      if (countdownText) countdownText.textContent = formatTime(remaining);
      if (progressBar) {
        const pct = Math.max(0, (remaining / totalSeconds) * 100);
        progressBar.style.width = pct + '%';
        if (pct < 20) {
          progressBar.className = 'progress-bar bg-danger';
        } else if (pct < 50) {
          progressBar.className = 'progress-bar bg-warning';
        } else {
          progressBar.className = 'progress-bar bg-primary';
        }
      }

      if (remaining <= 0) {
        stopEmailOtpCountdown();
        showAuthError('El código de 6 dígitos ha expirado (vigencia de 10 minutos cumplida). Solicita un nuevo código.');
        const verifyBtn = document.getElementById('btnVerifyEmailOtp');
        if (verifyBtn) verifyBtn.disabled = true;
        return;
      }

      remaining--;
    }

    tick();
    emailOtpIntervalId = setInterval(tick, 1000);
  }

  function stopEmailOtpCountdown() {
    if (emailOtpIntervalId) {
      clearInterval(emailOtpIntervalId);
      emailOtpIntervalId = null;
    }
  }

  function setupDigitInputs(selector, submitBtnId) {
    const digitInputs = document.querySelectorAll(selector);
    if (!digitInputs || digitInputs.length === 0) return;

    digitInputs.forEach((input, index) => {
      input.value = '';

      input.addEventListener('input', function () {
        const val = this.value.replace(/\D/g, '');
        this.value = val ? val[0] : '';

        if (this.value && index < digitInputs.length - 1) {
          digitInputs[index + 1].focus();
        }

        if (getEnteredDigitCode(selector).length === 6 && submitBtnId) {
          document.getElementById(submitBtnId)?.click();
        }
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !this.value && index > 0) {
          digitInputs[index - 1].focus();
        }
      });

      input.addEventListener('paste', function (e) {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').trim();
        if (pasted.length >= 6) {
          pasted.slice(0, 6).split('').forEach((char, i) => {
            if (digitInputs[i]) digitInputs[i].value = char;
          });
          digitInputs[5].focus();
          if (submitBtnId) {
            document.getElementById(submitBtnId)?.click();
          }
        }
      });
    });

    setTimeout(() => {
      digitInputs[0]?.focus();
    }, 150);
  }

  function getEnteredDigitCode(selector) {
    const digitInputs = document.querySelectorAll(selector);
    let code = '';
    digitInputs.forEach(inp => {
      code += (inp.value || '').trim();
    });
    return code;
  }

  function clearDigitInputs(selector) {
    const digitInputs = document.querySelectorAll(selector);
    digitInputs.forEach(inp => { inp.value = ''; });
    digitInputs[0]?.focus();
  }

  function showAuthError(msg) {
    const authErrorAlert = document.getElementById('authErrorAlert');
    const authSuccessAlert = document.getElementById('authSuccessAlert');
    if (authSuccessAlert) authSuccessAlert.classList.add('d-none');
    if (authErrorAlert) {
      authErrorAlert.textContent = msg;
      authErrorAlert.classList.remove('d-none');
    }
  }

  function showAuthSuccess(msg) {
    const authErrorAlert = document.getElementById('authErrorAlert');
    const authSuccessAlert = document.getElementById('authSuccessAlert');
    if (authErrorAlert) authErrorAlert.classList.add('d-none');
    if (authSuccessAlert) {
      authSuccessAlert.textContent = msg;
      authSuccessAlert.classList.remove('d-none');
    }
  }

  function hideAuthMessages() {
    const authErrorAlert = document.getElementById('authErrorAlert');
    const authSuccessAlert = document.getElementById('authSuccessAlert');
    if (authErrorAlert) authErrorAlert.classList.add('d-none');
    if (authSuccessAlert) authSuccessAlert.classList.add('d-none');
  }

  function startTotpCountdown() {
    stopTotpCountdown();
    const timerBar = document.getElementById('totpTimerBar');
    const timerText = document.getElementById('totpSecondsText');

    function update() {
      const remaining = 30 - (Math.floor(Date.now() / 1000) % 30);
      if (timerBar) {
        const percent = (remaining / 30) * 100;
        timerBar.style.width = percent + '%';
      }
      if (timerText) {
        timerText.textContent = `${remaining}s`;
      }
    }

    update();
    totpIntervalId = setInterval(update, 1000);
  }

  function stopTotpCountdown() {
    if (totpIntervalId) {
      clearInterval(totpIntervalId);
      totpIntervalId = null;
    }
  }

  function renderQrSetup() {
    const canvas = document.getElementById('qrCodeCanvas');
    const secretDisplay = document.getElementById('totpSecretKeyDisplay');
    const copySecretBtn = document.getElementById('copySecretBtn');

    fetch(getAuthApiUrl('action=setup_2fa'), getAuthFetchOptions('GET'))
      .then(parseFetchResponse)
      .then(data => {
        if (data && data.success) {
          if (secretDisplay) secretDisplay.textContent = data.secret;
          if (copySecretBtn) {
            copySecretBtn.onclick = function () {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(data.secret).then(() => {
                  copySecretBtn.innerHTML = '<i class="fa fa-check me-1"></i> ¡Copiada!';
                  setTimeout(() => {
                    copySecretBtn.innerHTML = '<i class="fa fa-copy me-1"></i> Copiar clave';
                  }, 2000);
                });
              }
            };
          }
          if (canvas && data.otpauth_url && window.SeloasaTotp) {
            window.SeloasaTotp.renderQr(canvas, data.otpauth_url, 180);
          }
        }
      })
      .catch(err => console.warn('Carga QR 2FA:', err));
  }

  /* ==========================================================================
     VISTAS: DASHBOARD ADMINISTRADOR
     ========================================================================== */
  function showDashboardView() {
    const authWrapper = document.getElementById('authWrapper');
    const dashboardWrapper = document.getElementById('dashboardWrapper');

    if (authWrapper) authWrapper.classList.add('d-none');
    if (dashboardWrapper) dashboardWrapper.classList.remove('d-none');

    loadPosts();
    renderKpis();
    renderPostsTable();

    loadVacancies();
    renderVacanciesKpis();
    renderVacanciesTable();

    loadPopups();
    renderPopupsKpis();
    renderPopupsTable();
  }

  function showAuthView() {
    const authWrapper = document.getElementById('authWrapper');
    const dashboardWrapper = document.getElementById('dashboardWrapper');

    if (dashboardWrapper) dashboardWrapper.classList.add('d-none');
    if (authWrapper) authWrapper.classList.remove('d-none');

    // Reset de formularios
    document.getElementById('step2Section')?.classList.add('d-none');
    document.getElementById('step1Section')?.classList.remove('d-none');
    document.getElementById('step1Indicator')?.classList.add('active');
    document.getElementById('step1Indicator')?.classList.remove('completed');
    document.getElementById('step2Indicator')?.classList.remove('active');
    document.getElementById('authErrorAlert')?.classList.add('d-none');
    stopTotpCountdown();
  }

  function renderKpis() {
    const totalCount = currentPosts.length;
    const comunicadosCount = currentPosts.filter(p => p.type === 'comunicado').length;
    const noticiasCount = currentPosts.filter(p => p.type === 'noticia').length;
    const blogCount = currentPosts.filter(p => p.type === 'blog').length;

    const kpiTotal = document.getElementById('kpiTotalCount');
    const kpiComunicados = document.getElementById('kpiComunicadosCount');
    const kpiNoticias = document.getElementById('kpiNoticiasCount');
    const kpiBlog = document.getElementById('kpiBlogCount');
    const tabBadgePosts = document.getElementById('tabBadgePostsCount');
    const navBadgePosts = document.getElementById('navBadgePostsCount');

    if (kpiTotal) kpiTotal.textContent = totalCount;
    if (kpiComunicados) kpiComunicados.textContent = comunicadosCount;
    if (kpiNoticias) kpiNoticias.textContent = noticiasCount;
    if (kpiBlog) kpiBlog.textContent = blogCount;
    if (tabBadgePosts) tabBadgePosts.textContent = totalCount;
    if (navBadgePosts) navBadgePosts.textContent = totalCount;
  }

  function getFilteredPosts() {
    return currentPosts.filter(post => {
      // Filtro por tipo
      if (activeFilterType !== 'all' && post.type !== activeFilterType) {
        return false;
      }
      // Filtro por estado
      if (activeFilterStatus !== 'all' && post.status !== activeFilterStatus) {
        return false;
      }
      // Búsqueda
      if (activeSearchTerm.trim()) {
        const q = activeSearchTerm.toLowerCase().trim();
        const titleMatch = (post.title || '').toLowerCase().includes(q);
        const idMatch = (post.id || '').toLowerCase().includes(q);
        const deptMatch = (post.dept || '').toLowerCase().includes(q);
        const summaryMatch = (post.summary || '').toLowerCase().includes(q);
        return titleMatch || idMatch || deptMatch || summaryMatch;
      }
      return true;
    });
  }

  function renderLangIndicators(translations) {
    const t = translations || {};
    const langs = [
      { code: 'es', flag: '🇪🇸', title: 'Español (Base)', active: true },
      { code: 'en', flag: '🇺🇸', title: 'English', active: Boolean(t.en && (t.en.title || t.en.message)) },
      { code: 'al', flag: '🇩🇪', title: 'Deutsch', active: Boolean(t.al && (t.al.title || t.al.message)) },
      { code: 'pt', flag: '🇧🇷', title: 'Português', active: Boolean(t.pt && (t.pt.title || t.pt.message)) },
      { code: 'fr', flag: '🇫🇷', title: 'Français', active: Boolean(t.fr && (t.fr.title || t.fr.message)) }
    ];
    return `
      <div class="d-inline-flex align-items-center gap-1 mt-1" title="Disponibilidad en 5 idiomas">
        ${langs.map(l => `<span style="font-size: 0.75rem; opacity: ${l.active ? '1' : '0.22'}; filter: ${l.active ? 'none' : 'grayscale(1)'}; cursor: help;" title="${l.title}: ${l.active ? '✓ Completado' : 'Pendiente (Usa Español como respaldo)'}">${l.flag}</span>`).join('')}
      </div>
    `;
  }

  function renderPostsTable() {
    const tbody = document.getElementById('postsTableBody');
    const noResultsRow = document.getElementById('tableNoResultsRow');
    if (!tbody) return;

    const filtered = getFilteredPosts();

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      if (noResultsRow) noResultsRow.classList.remove('d-none');
      return;
    }

    if (noResultsRow) noResultsRow.classList.add('d-none');

    tbody.innerHTML = filtered.map(post => {
      const typeBadgeClass = post.type === 'comunicado' ? 'comunicado' : post.type === 'noticia' ? 'noticia' : 'blog';
      const typeIcon = post.type === 'comunicado' ? 'fa-bullhorn' : post.type === 'noticia' ? 'fa-newspaper' : 'fa-bookmark';
      const typeName = post.type === 'comunicado' ? 'Comunicado' : post.type === 'noticia' ? 'Noticia' : 'Blog Farma';

      const isPublished = post.status === 'published';
      const statusBadge = `
        <button type="button" class="admin-status-pill ${isPublished ? 'published' : 'draft'} btn-toggle-status" data-id="${post.id}" title="Clic para alternar entre Publicada y Borrador">
          <span class="admin-status-dot ${isPublished ? 'published' : 'draft'}"></span>
          <span>${isPublished ? 'Publicada' : 'Borrador'}</span>
          <i class="fa fa-sync-alt ms-1 text-muted" style="font-size: 0.65rem; opacity: 0.5;"></i>
        </button>
      `;

      const featuredTag = post.is_featured ? '<span class="badge bg-danger ms-1" style="font-size: 0.65rem;">Destacada</span>' : '';
      const isUnderBlog = window.location.pathname.includes('/blog/');
      const editorUrl = isUnderBlog ? 'blog/admin/editor.html' : 'admin/editor.html';

      return `
        <tr>
          <td style="width: 80px;">
            <img src="${post.image || 'img/feature.jpg'}" alt="" class="admin-post-thumb">
          </td>
          <td>
            <div class="fw-bold text-dark mb-1" style="line-height: 1.3;">
              ${post.title} ${featuredTag}
            </div>
            <div class="text-muted small font-monospace" style="font-size: 0.78rem;">
              ID: ${post.id} &bull; ${post.dept || 'SELOASA'}
            </div>
            ${renderLangIndicators(post.translations)}
          </td>
          <td>
            <span class="admin-badge-type ${typeBadgeClass}">
              <i class="fa ${typeIcon}"></i> ${typeName}
            </span>
          </td>
          <td class="text-muted small">
            <div><i class="far fa-calendar-alt text-primary me-1"></i> ${post.date || 'Mayo 2026'}</div>
            <div style="font-size: 0.75rem;"><i class="far fa-clock text-primary me-1"></i> ${post.read_time || '3 min'}</div>
          </td>
          <td>
            ${statusBadge}
          </td>
          <td class="text-end">
            <div class="admin-table-actions">
              <a href="${editorUrl}?id=${encodeURIComponent(post.id)}" target="_blank" rel="noopener noreferrer" class="admin-action-btn" title="Editar publicación">
                <i class="fa fa-pen" style="font-size: 10px;"></i>
                <span>Editar</span>
              </a>
              <a href="blog/${encodeURIComponent(post.id)}" target="_blank" rel="noopener noreferrer" class="admin-action-btn-icon" title="Ver en la web pública">
                <i class="fa fa-external-link-alt" style="font-size: 11px;"></i>
              </a>
              <button type="button" class="admin-action-btn-icon admin-action-btn-danger btn-delete-post" data-id="${post.id}" title="Eliminar publicación">
                <i class="fa fa-trash-alt" style="font-size: 11px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Listeners de acción en cada fila
    tbody.querySelectorAll('.btn-toggle-status').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        togglePostStatus(id);
      });
    });

    tbody.querySelectorAll('.btn-delete-post').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        deletePost(id);
      });
    });
  }

  function togglePostStatus(id) {
    const post = currentPosts.find(p => p.id === id);
    if (!post) return;

    post.status = post.status === 'published' ? 'draft' : 'published';
    post.updated_at = new Date().toISOString();
    savePosts();
    renderKpis();
    renderPostsTable();
  }

  /* ==========================================================================
     MODAL DE CREACIÓN / EDICIÓN DE PUBLICACIONES
     ========================================================================== */
  /* ==========================================================================
     HELPERS ROBUSTOS DE MODAL (COMPATIBILIDAD BOOTSTRAP 5 Y JQUERY)
     ========================================================================== */
  function getModalInstance(modalEl) {
    if (!modalEl) return null;
    if (window.bootstrap && window.bootstrap.Modal) {
      if (typeof window.bootstrap.Modal.getOrCreateInstance === 'function') {
        return window.bootstrap.Modal.getOrCreateInstance(modalEl);
      }
      if (typeof window.bootstrap.Modal.getInstance === 'function') {
        const existing = window.bootstrap.Modal.getInstance(modalEl);
        if (existing) return existing;
      }
      try {
        return new window.bootstrap.Modal(modalEl);
      } catch (err) {
        console.warn('Error al instanciar Modal de Bootstrap:', err);
      }
    }
    return null;
  }

  function showModal(modalEl) {
    if (!modalEl) return;
    const modal = getModalInstance(modalEl);
    if (modal && typeof modal.show === 'function') {
      modal.show();
    } else if (window.jQuery) {
      $(modalEl).modal('show');
    } else {
      modalEl.classList.add('show');
      modalEl.style.display = 'block';
      modalEl.removeAttribute('aria-hidden');
      modalEl.setAttribute('aria-modal', 'true');
    }
  }

  function hideModal(modalEl) {
    if (!modalEl) return;
    const modal = getModalInstance(modalEl);
    if (modal && typeof modal.hide === 'function') {
      modal.hide();
    } else if (window.jQuery) {
      $(modalEl).modal('hide');
    } else {
      modalEl.classList.remove('show');
      modalEl.style.display = 'none';
      modalEl.setAttribute('aria-hidden', 'true');
      modalEl.removeAttribute('aria-modal');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    }
  }

  /* ==========================================================================
     MODAL DE CREACIÓN / EDICIÓN DE PUBLICACIONES
     ========================================================================== */
  function openEditModal(postId = null) {
    currentEditingId = postId ? String(postId) : null;
    const modalTitle = document.getElementById('postModalTitle');
    const form = document.getElementById('postEditorForm');
    const modalEl = document.getElementById('postEditorModal');
    if (!form || !modalEl) return;

    form.reset();

    let post = null;
    if (currentEditingId) {
      const cleanTargetId = currentEditingId.trim().toLowerCase();
      post = currentPosts.find(p => String(p.id || '').trim().toLowerCase() === cleanTargetId);
    }

    if (modalTitle) {
      modalTitle.innerHTML = post
        ? '<i class="fa fa-edit text-primary me-2"></i> Editar Publicación'
        : '<i class="fa fa-plus-circle text-primary me-2"></i> Nueva Publicación';
    }

    // Configurar Tipo
    const targetType = post ? (post.type || 'comunicado') : 'comunicado';
    selectModalType(targetType);

    // Llenar campos con datos existentes o por defecto
    const titleInput = document.getElementById('postTitleInput');
    const idInput = document.getElementById('postIdInput');
    const categoryInput = document.getElementById('postCategoryInput');
    const deptInput = document.getElementById('postDeptInput');
    const dateInput = document.getElementById('postDateInput');
    const readTimeInput = document.getElementById('postReadTimeInput');
    const statusSelect = document.getElementById('postStatusSelect');
    const imageInput = document.getElementById('postImageInput');
    const summaryInput = document.getElementById('postSummaryInput');
    const contentInput = document.getElementById('postContentInput');
    const visualEditor = document.getElementById('postContentVisualEditor');

    if (titleInput) titleInput.value = post ? (post.title || '') : '';
    if (idInput) idInput.value = post ? (post.id || '') : '';
    if (categoryInput) categoryInput.value = post ? (post.category || '') : 'Comunicado Oficial';
    if (deptInput) deptInput.value = post ? (post.dept || '') : 'Dirección General & Aseguramiento de Calidad';
    if (dateInput) dateInput.value = post ? (post.date || '') : 'Mayo 2026';
    if (readTimeInput) readTimeInput.value = post ? (post.read_time || '') : '3 min';
    if (statusSelect) statusSelect.value = post ? (post.status || 'published') : 'published';
    if (imageInput) imageInput.value = post ? (post.image || 'img/patio_unidades_dia_banner.jpg') : 'img/patio_unidades_dia_banner.jpg';
    if (summaryInput) summaryInput.value = post ? (post.summary || '') : '';

    // Cargar contenido en el editor visual sin mostrar etiquetas crudas
    const initialHtml = post ? (post.content || (post.summary ? `<p>${post.summary}</p>` : '')) : '';
    if (contentInput) contentInput.value = initialHtml;
    if (visualEditor) {
      visualEditor.innerHTML = initialHtml;
      updateVisualWordCount();
    }
    setVisualEditorMode('visual');

    // Si es nuevo, autogenerar ID al escribir título
    if (titleInput && idInput) {
      titleInput.oninput = function () {
        if (!currentEditingId) {
          idInput.value = generateSlug(titleInput.value);
        }
      };
    }

    // Mostrar el modal
    showModal(modalEl);
  }

  /* ==========================================================================
     CONTROLADOR DEL EDITOR VISUAL WYSIWYG
     ========================================================================== */
  let isCodeModeActive = false;

  function updateVisualWordCount() {
    const visualEditor = document.getElementById('postContentVisualEditor');
    const counterEl = document.getElementById('editorWordCount');
    if (!visualEditor || !counterEl) return;

    const text = visualEditor.innerText.trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    counterEl.textContent = `${words} ${words === 1 ? 'palabra' : 'palabras'}`;
  }

  function setVisualEditorMode(mode) {
    const visualEditor = document.getElementById('postContentVisualEditor');
    const contentInput = document.getElementById('postContentInput');
    const visualToolbar = document.getElementById('visualToolbar');
    const modeBadge = document.getElementById('editorModeBadge');
    const toggleBtn = document.getElementById('btnToggleCodeView');

    if (!visualEditor || !contentInput) return;

    if (mode === 'code') {
      isCodeModeActive = true;
      contentInput.value = visualEditor.innerHTML;
      visualEditor.classList.add('d-none');
      contentInput.classList.remove('d-none');
      if (visualToolbar) visualToolbar.style.opacity = '0.35';
      if (modeBadge) {
        modeBadge.className = 'visual-mode-badge bg-secondary text-white';
        modeBadge.innerHTML = '<i class="fa fa-code me-1"></i> Modo Código HTML';
      }
      if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fa fa-eye me-1"></i> Ver Modo Visual';
        toggleBtn.classList.replace('btn-outline-secondary', 'btn-primary');
      }
    } else {
      isCodeModeActive = false;
      visualEditor.innerHTML = contentInput.value;
      contentInput.classList.add('d-none');
      visualEditor.classList.remove('d-none');
      if (visualToolbar) visualToolbar.style.opacity = '1';
      if (modeBadge) {
        modeBadge.className = 'visual-mode-badge';
        modeBadge.style.backgroundColor = '#eaf7ee';
        modeBadge.style.color = '#1b6d36';
        modeBadge.innerHTML = '<i class="fa fa-check-circle me-1"></i> Modo Visual';
      }
      if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fa fa-code me-1"></i> Ver Código HTML';
        toggleBtn.classList.replace('btn-primary', 'btn-outline-secondary');
      }
      updateVisualWordCount();
    }
  }

  function initVisualEditorToolbar() {
    const visualEditor = document.getElementById('postContentVisualEditor');
    const contentInput = document.getElementById('postContentInput');
    const toggleBtn = document.getElementById('btnToggleCodeView');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        setVisualEditorMode(isCodeModeActive ? 'visual' : 'code');
      });
    }

    if (visualEditor) {
      visualEditor.addEventListener('input', function () {
        updateVisualWordCount();
        if (contentInput) {
          contentInput.value = visualEditor.innerHTML;
        }
      });
    }

    // Botones de formato
    document.querySelectorAll('.visual-toolbar-btn[data-cmd]').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (isCodeModeActive) return;

        const cmd = this.getAttribute('data-cmd');
        const val = this.getAttribute('data-val') || null;

        document.execCommand(cmd, false, val);
        visualEditor?.focus();
        updateVisualWordCount();
        if (contentInput && visualEditor) {
          contentInput.value = visualEditor.innerHTML;
        }
      });
    });

    // Botón de Cuadro Destacado
    document.getElementById('btnInsertHighlightBox')?.addEventListener('click', function (e) {
      e.preventDefault();
      if (isCodeModeActive) return;

      const calloutHtml = `
        <div class="visual-callout">
          <strong>Punto Clave / Disposición:</strong> Escribe aquí la resolución técnica o dato relevante...
        </div>
        <p><br></p>
      `;
      document.execCommand('insertHTML', false, calloutHtml);
      visualEditor?.focus();
      updateVisualWordCount();
      if (contentInput && visualEditor) {
        contentInput.value = visualEditor.innerHTML;
      }
    });
  }

  function selectModalType(type) {
    document.querySelectorAll('.type-selector-card').forEach(card => {
      if (card.getAttribute('data-type') === type) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
    const typeHidden = document.getElementById('postTypeHidden');
    if (typeHidden) typeHidden.value = type;

    // Actualizar categoría por defecto según el tipo si es nuevo
    const categoryInput = document.getElementById('postCategoryInput');
    if (categoryInput && !currentEditingId) {
      if (type === 'comunicado') categoryInput.value = 'Comunicado Oficial';
      else if (type === 'noticia') categoryInput.value = 'Noticia Operativa';
      else categoryInput.value = 'Blog Farma';
    }
  }

  function generateSlug(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'publicacion-' + Date.now();
  }

  function saveModalPost() {
    const title = (document.getElementById('postTitleInput')?.value || '').trim();
    let id = (document.getElementById('postIdInput')?.value || '').trim();
    const type = document.getElementById('postTypeHidden')?.value || 'comunicado';
    const category = (document.getElementById('postCategoryInput')?.value || '').trim();
    const dept = (document.getElementById('postDeptInput')?.value || '').trim();
    const date = (document.getElementById('postDateInput')?.value || '').trim();
    const readTime = (document.getElementById('postReadTimeInput')?.value || '').trim();
    const status = document.getElementById('postStatusSelect')?.value || 'published';
    const image = (document.getElementById('postImageInput')?.value || '').trim() || 'img/feature.jpg';
    const summary = (document.getElementById('postSummaryInput')?.value || '').trim();
    
    const visualEditor = document.getElementById('postContentVisualEditor');
    const contentInput = document.getElementById('postContentInput');
    let content = isCodeModeActive ? (contentInput?.value || '').trim() : (visualEditor?.innerHTML || '').trim();

    if (!title) {
      alert('Por favor ingresa el título de la publicación.');
      document.getElementById('postTitleInput')?.focus();
      return;
    }

    if (!id) {
      id = generateSlug(title);
    }

    const plainText = visualEditor ? visualEditor.innerText.trim() : '';
    if (!content || plainText === '') {
      content = summary ? `<p>${summary}</p>` : '';
    }

    const postData = {
      id: id,
      type: type,
      category: category,
      badge_class: type === 'comunicado' ? 'badge-pill-comunicado' : type === 'noticia' ? 'badge-pill-noticia' : 'badge-pill-blog',
      dept: dept,
      date: date,
      read_time: readTime,
      title: title,
      summary: summary,
      content: content,
      image: image,
      image_alt: title,
      status: status,
      updated_at: new Date().toISOString()
    };

    if (currentEditingId) {
      // Actualizar existente
      const cleanTargetId = currentEditingId.trim().toLowerCase();
      const index = currentPosts.findIndex(p => String(p.id || '').trim().toLowerCase() === cleanTargetId);
      if (index !== -1) {
        currentPosts[index] = { ...currentPosts[index], ...postData };
      } else {
        currentPosts.unshift(postData);
      }
    } else {
      // Crear nuevo
      postData.created_at = new Date().toISOString();
      postData.is_featured = false;
      currentPosts.unshift(postData);
    }

    savePosts();
    renderKpis();
    renderPostsTable();

    // Cerrar modal
    const modalEl = document.getElementById('postEditorModal');
    if (modalEl) {
      hideModal(modalEl);
    }
  }

  function deletePost(id) {
    const post = currentPosts.find(p => p.id === id);
    if (!post) return;

    if (confirm(`¿Estás seguro de que deseas eliminar la publicación "${post.title}" de la base de datos?`)) {
      currentPosts = currentPosts.filter(p => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.POSTS_DATA, JSON.stringify(currentPosts));
        window.dispatchEvent(new Event('storage'));
        fetch(getBackendApiUrl('php/noticias_api.php?id=' + encodeURIComponent(id)), getApiFetchOptions('DELETE'))
          .catch(err => console.warn('Error al eliminar noticia:', err));
      } catch (e) {}
      renderKpis();
      renderPostsTable();
    }
  }

  function resetToDefaults() {
    if (confirm('¿Recargar las publicaciones directamente desde la base de datos MySQL?')) {
      loadPosts();
      alert('Datos sincronizados con MySQL.');
    }
  }

  function exportPostsJson() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentPosts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'noticias_seloasa_' + new Date().toISOString().slice(0, 10) + '.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /* ==========================================================================
     MÓDULO DE GESTIÓN DE POP-UPS Y AVISOS EMERGENTES
     ========================================================================== */

  function loadPopups() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.POPUPS_DATA);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentPopups = parsed;
        }
      }
    } catch (e) {
      console.warn('Error al leer popups de cache local:', e);
    }

    // Consultar directamente la API de Pop-ups
    fetch(getBackendApiUrl('php/popup_api.php'), getApiFetchOptions('GET'))
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.items)) {
          currentPopups = data.items;
          localStorage.setItem(STORAGE_KEYS.POPUPS_DATA, JSON.stringify(currentPopups));
          const activePopup = currentPopups.find(p => p.active === true);
          if (activePopup) {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_POPUP_ID, activePopup.id);
          } else {
            localStorage.removeItem(STORAGE_KEYS.ACTIVE_POPUP_ID);
          }
          renderPopupsKpis();
          renderPopupsTable();
        }
      })
      .catch(err => console.warn('Sync popups error:', err));

    return currentPopups;
  }

  function savePopups() {
    try {
      localStorage.setItem(STORAGE_KEYS.POPUPS_DATA, JSON.stringify(currentPopups, null, 2));
      const activePopup = currentPopups.find(p => p.active === true);
      if (activePopup) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_POPUP_ID, activePopup.id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_POPUP_ID);
      }
      fetch(getBackendApiUrl('php/popup_api.php'), getApiFetchOptions('POST', { items: currentPopups }))
        .catch(err => console.warn('Error sincronizando popups:', err));
    } catch (e) {
      console.error('Error al guardar popups:', e);
    }
  }

  function renderPopupsKpis() {
    const totalCount = currentPopups.length;
    const activePopup = currentPopups.find(p => p.active === true);
    const alertCount = currentPopups.filter(p => p.type === 'alerta').length;

    const kpiTotal = document.getElementById('kpiPopupsTotalCount');
    const kpiActiveName = document.getElementById('kpiPopupsActiveName');
    const kpiAlert = document.getElementById('kpiPopupsAlertCount');
    const tabBadgePopupsActive = document.getElementById('tabBadgePopupsActive');

    if (kpiTotal) kpiTotal.textContent = totalCount;
    if (kpiActiveName) {
      if (activePopup) {
        kpiActiveName.textContent = activePopup.title;
        kpiActiveName.classList.remove('text-muted');
        kpiActiveName.classList.add('text-success');
      } else {
        kpiActiveName.textContent = 'Ninguno (Inactivo)';
        kpiActiveName.classList.remove('text-success');
        kpiActiveName.classList.add('text-muted');
      }
    }
    if (kpiAlert) kpiAlert.textContent = alertCount;
    if (tabBadgePopupsActive) {
      tabBadgePopupsActive.textContent = activePopup ? '1 Activo' : '0 Activos';
      tabBadgePopupsActive.className = activePopup ? 'badge bg-danger ms-1' : 'badge bg-secondary ms-1';
    }
  }

  function getFilteredPopups() {
    return currentPopups.filter(popup => {
      if (activePopupFilterType !== 'all' && popup.type !== activePopupFilterType) {
        return false;
      }
      if (activePopupSearchTerm.trim()) {
        const q = activePopupSearchTerm.toLowerCase().trim();
        const titleMatch = (popup.title || '').toLowerCase().includes(q);
        const subtitleMatch = (popup.subtitle || '').toLowerCase().includes(q);
        const msgMatch = (popup.message || '').toLowerCase().includes(q);
        const badgeMatch = (popup.badge_text || '').toLowerCase().includes(q);
        return titleMatch || subtitleMatch || msgMatch || badgeMatch;
      }
      return true;
    });
  }

  function renderPopupsTable() {
    const tbody = document.getElementById('popupsTableBody');
    const noResultsRow = document.getElementById('popupsNoResultsRow');
    if (!tbody) return;

    const filtered = getFilteredPopups();

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      if (noResultsRow) noResultsRow.classList.remove('d-none');
      return;
    }

    if (noResultsRow) noResultsRow.classList.add('d-none');

    const isUnderBlog = window.location.pathname.includes('/blog/');
    const editorUrl = isUnderBlog ? 'blog/admin/editor-popup.html' : 'admin/editor-popup.html';

    tbody.innerHTML = filtered.map(popup => {
      const typeKey = popup.type === 'alerta' ? 'alerta' : popup.type === 'comunicado' ? 'comunicado' : 'informativo';
      const badgeIcon = typeKey === 'alerta' ? 'fa-exclamation-triangle' : typeKey === 'comunicado' ? 'fa-bullhorn' : 'fa-info-circle';
      const badgeLabel = typeKey === 'alerta' ? 'Alerta COFEPRIS' : typeKey === 'comunicado' ? 'Comunicado' : 'Informativo';

      const layoutKey = ['top', 'left', 'right', 'bg'].includes(popup.layout) ? popup.layout : 'top';
      const layoutLabel = layoutKey === 'top' ? 'Banner Sup.' : layoutKey === 'left' ? 'Img. Izquierda' : layoutKey === 'right' ? 'Img. Derecha' : 'Fondo Completo';
      const layoutIcon = layoutKey === 'top' ? 'fa-window-maximize' : layoutKey === 'left' ? 'fa-columns' : layoutKey === 'right' ? 'fa-columns' : 'fa-image';

      const cleanMsg = (popup.message || '').replace(/<[^>]*>/g, '').trim();
      const snippet = cleanMsg.length > 80 ? cleanMsg.substring(0, 80) + '...' : cleanMsg;

      const freqLabel = popup.frequency === 'always' ? 'Cada Carga' : '1x Sesión';
      const delayLabel = popup.delay ? `${popup.delay}s` : '1.5s';

      return `
        <tr>
          <td style="width: 70px;" class="text-center">
            <img src="${popup.image || 'img/patio_unidades_dia_banner.jpg'}" alt="" class="admin-popup-thumb">
          </td>
          <td>
            <div class="fw-bold text-dark text-truncate mb-0" style="max-width: 360px; font-size: 13.5px; line-height: 1.35;">
              ${popup.title}
            </div>
            <div class="text-muted small text-truncate" style="max-width: 360px; font-size: 11.5px; margin-bottom: 2px;">
              ${popup.subtitle || 'Aviso Institucional SELOASA'}
            </div>
            <div class="admin-popup-snippet text-truncate" style="max-width: 360px;">
              ${snippet}
            </div>
            ${renderLangIndicators(popup.translations)}
          </td>
          <td>
            <div class="d-flex flex-column gap-1">
              <span class="admin-badge-popup-type ${typeKey}">
                <i class="fa ${badgeIcon}"></i> ${badgeLabel}
              </span>
              <span class="badge bg-light text-dark border align-self-start" style="font-size: 10px; font-weight: 600;">
                <i class="fa ${layoutIcon} me-1 text-muted"></i> ${layoutLabel}
              </span>
            </div>
          </td>
          <td>
            <div class="d-flex flex-column gap-1">
              <span class="admin-freq-pill">
                <i class="far fa-clock text-muted"></i> ${freqLabel}
              </span>
              <span class="text-muted" style="font-size: 11px;">Delay: ${delayLabel}</span>
            </div>
          </td>
          <td>
            <div class="form-check form-switch admin-popup-switch-wrap mb-0 d-flex align-items-center gap-2">
              <input class="form-check-input admin-popup-switch-input btn-toggle-popup-active" type="checkbox" role="switch" data-id="${popup.id}" id="switch_${popup.id}" ${popup.active ? 'checked' : ''}>
              <label class="form-check-label mb-0" for="switch_${popup.id}" style="cursor: pointer; font-size: 12px; font-weight: 600; color: ${popup.active ? '#15803d' : '#94a3b8'};">
                ${popup.active ? 'Activo' : 'Inactivo'}
              </label>
            </div>
          </td>
          <td class="text-end">
            <div class="admin-table-actions">
              <a href="${editorUrl}?id=${encodeURIComponent(popup.id)}" target="_blank" rel="noopener noreferrer" class="admin-action-btn" title="Editar pop-up en pestaña dedicada">
                <i class="fa fa-pen" style="font-size: 10px;"></i>
                <span>Editar</span>
              </a>
              <button type="button" class="admin-action-btn-icon btn-test-popup" data-id="${popup.id}" title="Probar pop-up interactivo">
                <i class="fa fa-eye" style="font-size: 12px;"></i>
              </button>
              <button type="button" class="admin-action-btn-icon admin-action-btn-danger btn-delete-popup" data-id="${popup.id}" title="Eliminar pop-up">
                <i class="fa fa-trash-alt" style="font-size: 11px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-toggle-popup-active').forEach(input => {
      input.addEventListener('change', function () {
        const id = this.getAttribute('data-id');
        togglePopupActive(id);
      });
    });

    tbody.querySelectorAll('.btn-test-popup').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        testPopup(id);
      });
    });

    tbody.querySelectorAll('.btn-delete-popup').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        deletePopup(id);
      });
    });
  }

  function togglePopupActive(id) {
    const popup = currentPopups.find(p => p.id === id);
    if (!popup) return;

    const willBeActive = !popup.active;

    currentPopups.forEach(p => {
      p.active = (p.id === id) ? willBeActive : false;
    });

    savePopups();
    renderPopupsKpis();
    renderPopupsTable();

    // Sincronizar activación atómica en la API
    fetch(getBackendApiUrl('php/popup_api.php'), getApiFetchOptions('POST', { activate_id: willBeActive ? id : '' }))
      .catch(err => console.warn('Sync popup active error:', err));
  }

  function deletePopup(id) {
    const popup = currentPopups.find(p => p.id === id);
    if (!popup) return;

    if (confirm(`¿Eliminar el pop-up "${popup.title}" de la base de datos? Esta acción no se puede deshacer.`)) {
      currentPopups = currentPopups.filter(p => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.POPUPS_DATA, JSON.stringify(currentPopups));
        fetch(getBackendApiUrl('php/popup_api.php?id=' + encodeURIComponent(id)), getApiFetchOptions('DELETE'))
          .catch(err => console.warn('Error al eliminar popup:', err));
      } catch (e) {}
      renderPopupsKpis();
      renderPopupsTable();
    }
  }

  function testPopup(id) {
    const popup = currentPopups.find(p => p.id === id);
    if (!popup) return;

    if (window.SeloasaPopup && typeof window.SeloasaPopup.show === 'function') {
      window.SeloasaPopup.show(popup);
    } else {
      alert(`Vista Previa de Pop-up:\n\n${popup.title}\n${popup.subtitle || ''}\n\n${(popup.message || '').replace(/<[^>]*>/g, '')}`);
    }
  }

  /* ==========================================================================
     MÓDULO DE GESTIÓN DE BOLSA DE TRABAJO (VACANTES)
     ========================================================================== */

  function loadVacancies() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VACANCIES_DATA);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentVacancies = parsed;
        }
      }
    } catch (e) {
      console.warn('Error al leer vacantes de cache local:', e);
    }

    // Consultar directamente la API de Vacantes
    fetch(getBackendApiUrl('php/vacantes_api.php'), getApiFetchOptions('GET'))
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.items)) {
          currentVacancies = data.items;
          localStorage.setItem(STORAGE_KEYS.VACANCIES_DATA, JSON.stringify(currentVacancies));
          renderVacanciesKpis();
          renderVacanciesTable();
        }
      })
      .catch(err => console.warn('Sync vacantes error:', err));

    return currentVacancies;
  }

  function saveVacancies() {
    try {
      localStorage.setItem(STORAGE_KEYS.VACANCIES_DATA, JSON.stringify(currentVacancies, null, 2));
      window.dispatchEvent(new Event('storage'));
      fetch(getBackendApiUrl('php/vacantes_api.php'), getApiFetchOptions('POST', { items: currentVacancies }))
        .catch(err => console.warn('Sync vacantes API error:', err));
    } catch (e) {
      console.error('Error al guardar vacantes:', e);
    }
  }

  function renderVacanciesKpis() {
    const totalCount = currentVacancies.length;
    const publishedCount = currentVacancies.filter(v => v.status === 'published').length;
    const draftCount = currentVacancies.filter(v => v.status === 'draft').length;
    const areasCount = new Set(currentVacancies.map(v => (v.area || '').trim()).filter(Boolean)).size;

    const kpiTotal = document.getElementById('kpiVacanciesTotalCount');
    const kpiPublished = document.getElementById('kpiVacanciesPublishedCount');
    const kpiDraft = document.getElementById('kpiVacanciesDraftCount');
    const kpiAreas = document.getElementById('kpiVacanciesAreasCount');
    const navBadge = document.getElementById('navBadgeVacanciesCount');
    const tabBadge = document.getElementById('tabBadgeVacanciesCount');

    if (kpiTotal) kpiTotal.textContent = totalCount;
    if (kpiPublished) kpiPublished.textContent = publishedCount;
    if (kpiDraft) kpiDraft.textContent = draftCount;
    if (kpiAreas) kpiAreas.textContent = areasCount;
    if (navBadge) navBadge.textContent = totalCount;
    if (tabBadge) tabBadge.textContent = totalCount;
  }

  function getFilteredVacancies() {
    return currentVacancies.filter(v => {
      if (activeVacancyArea !== 'all' && (v.area || '').toLowerCase() !== activeVacancyArea.toLowerCase()) {
        return false;
      }
      if (activeVacancyStatus !== 'all' && (v.status || 'published') !== activeVacancyStatus) {
        return false;
      }
      if (activeVacancySearchTerm.trim()) {
        const q = activeVacancySearchTerm.toLowerCase().trim();
        const titleMatch = (v.title || '').toLowerCase().includes(q);
        const idMatch = (v.id || '').toLowerCase().includes(q);
        const areaMatch = (v.area || '').toLowerCase().includes(q);
        const locMatch = (v.location || '').toLowerCase().includes(q);
        const modeMatch = (v.mode || '').toLowerCase().includes(q);
        const summaryMatch = (v.summary || '').toLowerCase().includes(q);
        const pointsMatch = Array.isArray(v.points) && v.points.some(p => String(p).toLowerCase().includes(q));
        return titleMatch || idMatch || areaMatch || locMatch || modeMatch || summaryMatch || pointsMatch;
      }
      return true;
    });
  }

  function renderVacanciesTable() {
    const tbody = document.getElementById('vacanciesTableBody');
    const noResultsRow = document.getElementById('vacanciesNoResultsRow');
    if (!tbody) return;

    const filtered = getFilteredVacancies();

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      if (noResultsRow) noResultsRow.classList.remove('d-none');
      return;
    }

    if (noResultsRow) noResultsRow.classList.add('d-none');

    const isUnderBlog = window.location.pathname.includes('/blog/');
    const editorUrl = isUnderBlog ? 'blog/admin/editor-vacante.html' : 'admin/editor-vacante.html';

    tbody.innerHTML = filtered.map(v => {
      const areaLower = (v.area || '').toLowerCase();
      const areaClass = areaLower.includes('monitoreo') ? 'monitoreo' :
                        areaLower.includes('almac') ? 'almacen' :
                        areaLower.includes('transporte') ? 'transporte' :
                        areaLower.includes('calidad') ? 'calidad' :
                        areaLower.includes('tr') ? 'trafico' : '';
      const isPublished = v.status === 'published';
      const emails = v.recipient_emails || 'gadiel.palma@SELOASA.com.mx, rh@seloasa.com.mx';

      return `
        <tr>
          <td>
            <div class="fw-bold text-dark mb-1" style="line-height: 1.3;">
              ${v.title}
            </div>
            <div class="text-muted small font-monospace" style="font-size: 0.78rem;">
              ID: ${v.id} &bull; <span class="badge bg-light text-dark border">${v.mode || 'Presencial'}</span>
            </div>
            ${renderLangIndicators(v.translations)}
          </td>
          <td>
            <span class="admin-badge-area ${areaClass}">
              <i class="fa fa-tag me-1"></i> ${v.area || 'General'}
            </span>
          </td>
          <td class="text-muted small">
            <div><i class="fa fa-map-marker-alt text-primary me-1"></i> ${v.location || 'Lerma, Edo. Méx.'}</div>
            <div class="text-muted mt-1" style="font-size: 0.73rem;"><i class="far fa-clock text-muted me-1"></i> ${v.schedule || 'Tiempo completo'}</div>
          </td>
          <td>
            <div class="d-flex align-items-center gap-1.5 text-truncate" style="max-width: 175px;" title="${emails}">
              <i class="fa fa-envelope text-primary small"></i>
              <span class="small font-monospace" style="font-size: 11px;">${emails}</span>
            </div>
            <div class="text-muted mt-1" style="font-size: 0.72rem;">
              <i class="fa fa-check-circle text-success me-1" style="font-size: 9px;"></i>Recibe postulaciones
            </div>
          </td>
          <td>
            <button type="button" class="admin-status-pill ${isPublished ? 'published' : 'draft'} btn-toggle-vacancy-status" data-id="${v.id}" title="Clic para alternar entre Publicada y Borrador">
              <span class="admin-status-dot ${isPublished ? 'published' : 'draft'}"></span>
              <span>${isPublished ? 'Publicada' : 'Borrador'}</span>
              <i class="fa fa-sync-alt ms-1 text-muted" style="font-size: 0.65rem; opacity: 0.5;"></i>
            </button>
          </td>
          <td class="text-end">
            <div class="admin-table-actions">
              <a href="${editorUrl}?id=${encodeURIComponent(v.id)}" target="_blank" rel="noopener noreferrer" class="admin-action-btn" title="Editar vacante en estudio dedicado">
                <i class="fa fa-pen" style="font-size: 10px;"></i>
                <span>Editar</span>
              </a>
              <a href="careers/" target="_blank" rel="noopener noreferrer" class="admin-action-btn-icon" title="Ver bolsa de trabajo pública">
                <i class="fa fa-external-link-alt" style="font-size: 11px;"></i>
              </a>
              <button type="button" class="admin-action-btn-icon admin-action-btn-danger btn-delete-vacancy" data-id="${v.id}" title="Eliminar vacante">
                <i class="fa fa-trash-alt" style="font-size: 11px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-toggle-vacancy-status').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        toggleVacancyStatus(id);
      });
    });

    tbody.querySelectorAll('.btn-delete-vacancy').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        deleteVacancy(id);
      });
    });
  }

  function openVacancyModal(id) {
    const modalEl = document.getElementById('vacancyEditorModal');
    if (!modalEl) return;

    currentEditingVacancyId = id;
    const titleEl = document.getElementById('vacancyModalTitle');

    if (!id) {
      if (titleEl) titleEl.innerHTML = '<i class="fa fa-plus-circle text-primary me-2"></i> Nueva Vacante de Empleo';
      document.getElementById('vacancyExistingIdHidden').value = '';
      document.getElementById('vacancyTitleInput').value = '';
      document.getElementById('vacancyIdInput').value = 'vacante-' + Math.random().toString(36).substring(2, 8);
      document.getElementById('vacancyIdInput').readOnly = false;
      document.getElementById('vacancyAreaInput').value = 'Monitoreo';
      document.getElementById('vacancyModeInput').value = 'Presencial';
      document.getElementById('vacancyLocationInput').value = 'Lerma, Estado de México';
      document.getElementById('vacancyScheduleInput').value = 'Tiempo completo';
      document.getElementById('vacancyStatusSelect').value = 'published';
      document.getElementById('vacancySummaryInput').value = '';
      document.getElementById('vacancyPointsInput').value = '';
      document.getElementById('vacancySortOrderInput').value = (currentVacancies.length + 1) * 10;
    } else {
      const v = currentVacancies.find(item => item.id === id);
      if (!v) return;

      if (titleEl) titleEl.innerHTML = '<i class="fa fa-edit text-primary me-2"></i> Editar Vacante';
      document.getElementById('vacancyExistingIdHidden').value = v.id;
      document.getElementById('vacancyTitleInput').value = v.title || '';
      document.getElementById('vacancyIdInput').value = v.id || '';
      document.getElementById('vacancyIdInput').readOnly = true;
      document.getElementById('vacancyAreaInput').value = v.area || 'General';
      document.getElementById('vacancyModeInput').value = v.mode || 'Presencial';
      document.getElementById('vacancyLocationInput').value = v.location || 'Lerma, Estado de México';
      document.getElementById('vacancyScheduleInput').value = v.schedule || 'Tiempo completo';
      document.getElementById('vacancyStatusSelect').value = v.status || 'published';
      document.getElementById('vacancySummaryInput').value = v.summary || '';
      document.getElementById('vacancyPointsInput').value = Array.isArray(v.points) ? v.points.join('\n') : '';
      document.getElementById('vacancySortOrderInput').value = v.sort_order || 10;
    }

    const modal = getModalInstance(modalEl);
    if (modal) modal.show();
  }

  function saveVacancyFromModal() {
    const title = document.getElementById('vacancyTitleInput')?.value.trim();
    let id = document.getElementById('vacancyIdInput')?.value.trim();
    const existingId = document.getElementById('vacancyExistingIdHidden')?.value.trim();
    const area = document.getElementById('vacancyAreaInput')?.value.trim() || 'General';
    const mode = document.getElementById('vacancyModeInput')?.value || 'Presencial';
    const location = document.getElementById('vacancyLocationInput')?.value.trim() || 'Lerma, Estado de México';
    const schedule = document.getElementById('vacancyScheduleInput')?.value.trim() || 'Tiempo completo';
    const status = document.getElementById('vacancyStatusSelect')?.value || 'published';
    const summary = document.getElementById('vacancySummaryInput')?.value.trim();
    const pointsRaw = document.getElementById('vacancyPointsInput')?.value || '';
    const sortOrder = parseInt(document.getElementById('vacancySortOrderInput')?.value, 10) || 10;

    if (!title) {
      alert('Por favor escribe el título del puesto.');
      document.getElementById('vacancyTitleInput')?.focus();
      return;
    }

    if (!id) {
      id = 'vacante-' + title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').substring(0, 30);
    }

    const points = pointsRaw.split('\n').map(s => s.trim()).filter(Boolean);
    if (points.length === 0) {
      alert('Por favor ingresa al menos una responsabilidad o requisito (una línea por punto).');
      document.getElementById('vacancyPointsInput')?.focus();
      return;
    }

    if (existingId) {
      const idx = currentVacancies.findIndex(v => v.id === existingId);
      if (idx >= 0) {
        currentVacancies[idx] = {
          ...currentVacancies[idx],
          title,
          area,
          mode,
          location,
          schedule,
          status,
          summary,
          points,
          sort_order: sortOrder,
          updated_at: new Date().toISOString()
        };
      }
    } else {
      const exists = currentVacancies.some(v => v.id === id);
      const finalId = exists ? id + '-' + Math.floor(Math.random() * 900 + 100) : id;
      currentVacancies.unshift({
        id: finalId,
        title,
        area,
        mode,
        location,
        schedule,
        status,
        summary,
        points,
        sort_order: sortOrder,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    saveVacancies();
    renderVacanciesKpis();
    renderVacanciesTable();

    const modalEl = document.getElementById('vacancyEditorModal');
    const modal = getModalInstance(modalEl);
    if (modal) modal.hide();
  }

  function toggleVacancyStatus(id) {
    const v = currentVacancies.find(item => item.id === id);
    if (!v) return;

    v.status = v.status === 'published' ? 'draft' : 'published';
    v.updated_at = new Date().toISOString();
    saveVacancies();
    renderVacanciesKpis();
    renderVacanciesTable();
  }

  function deleteVacancy(id) {
    const v = currentVacancies.find(item => item.id === id);
    if (!v) return;

    if (confirm(`¿Eliminar la vacante "${v.title}" de la base de datos? Esta acción no se puede deshacer.`)) {
      currentVacancies = currentVacancies.filter(item => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.VACANCIES_DATA, JSON.stringify(currentVacancies));
        fetch(getBackendApiUrl('php/vacantes_api.php?id=' + encodeURIComponent(id)), getApiFetchOptions('DELETE'))
          .catch(err => console.warn('Error al eliminar vacante:', err));
      } catch (e) {}
      renderVacanciesKpis();
      renderVacanciesTable();
    }
  }

  function switchAdminModule(targetModule) {
    const modulePosts = document.getElementById('modulePostsSection');
    const moduleVacancies = document.getElementById('moduleVacanciesSection');
    const modulePopups = document.getElementById('modulePopupsSection');

    // Desactivar todos los botones nav
    ['navItemPosts', 'navItemVacancies', 'navItemPopups'].forEach(btnId => {
      document.getElementById(btnId)?.classList.remove('active');
    });

    // Ocultar todas las secciones
    if (modulePosts) modulePosts.classList.add('d-none');
    if (moduleVacancies) moduleVacancies.classList.add('d-none');
    if (modulePopups) modulePopups.classList.add('d-none');

    if (targetModule === 'vacancies') {
      document.getElementById('navItemVacancies')?.classList.add('active');
      if (moduleVacancies) moduleVacancies.classList.remove('d-none');
      renderVacanciesKpis();
      renderVacanciesTable();
    } else if (targetModule === 'popups') {
      document.getElementById('navItemPopups')?.classList.add('active');
      if (modulePopups) modulePopups.classList.remove('d-none');
      renderPopupsKpis();
      renderPopupsTable();
    } else {
      document.getElementById('navItemPosts')?.classList.add('active');
      if (modulePosts) modulePosts.classList.remove('d-none');
      renderKpis();
      renderPostsTable();
    }
  }

  /* ==========================================================================
     INICIALIZADOR PRINCIPAL
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    initAuthFlow();

    // Comprobar con el servidor si ya existe sesión activa
    fetch(getAuthApiUrl('action=check'), getAuthFetchOptions('GET'))
      .then(parseFetchResponse)
      .then(data => {
        if (data && data.authenticated) {
          setAuthenticated();
          showDashboardView();
        } else {
          clearAuthentication();
          showAuthView();
        }
      })
      .catch(() => {
        if (isAuthenticated()) {
          showDashboardView();
        } else {
          showAuthView();
        }
      });

    // Botón Cerrar Sesión
    document.getElementById('adminLogoutBtn')?.addEventListener('click', function () {
      fetch(getAuthApiUrl('action=logout'), getAuthFetchOptions('POST'))
        .finally(() => {
          clearAuthentication();
          showAuthView();
        });
    });

    // Filtros de categoría en toolbar
    document.querySelectorAll('.admin-filter-pill-btn[data-filter-type]').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.admin-filter-pill-btn[data-filter-type]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeFilterType = this.getAttribute('data-filter-type');
        renderPostsTable();
      });
    });

    // Filtro de estado
    document.getElementById('statusFilterSelect')?.addEventListener('change', function () {
      activeFilterStatus = this.value;
      renderPostsTable();
    });

    // Búsqueda en tiempo real
    document.getElementById('adminSearchInput')?.addEventListener('input', function () {
      activeSearchTerm = this.value;
      renderPostsTable();
    });

    // Botón Nueva Publicación (Abre en una nueva pestaña dedicada al estudio de redacción)
    document.getElementById('btnNewPost')?.addEventListener('click', function (e) {
      const isUnderBlog = window.location.pathname.includes('/blog/');
      const editorUrl = isUnderBlog ? 'blog/admin/editor.html?new=1' : 'admin/editor.html?new=1';
      window.open(editorUrl, '_blank');
    });

    // Selector de Módulos (Noticias vs Bolsa de Trabajo vs Pop-ups)
    document.getElementById('navItemPosts')?.addEventListener('click', function () {
      switchAdminModule('posts');
    });

    document.getElementById('navItemVacancies')?.addEventListener('click', function () {
      switchAdminModule('vacancies');
    });

    document.getElementById('navItemPopups')?.addEventListener('click', function () {
      switchAdminModule('popups');
    });

    // Filtros y acciones de Bolsa de Trabajo
    document.getElementById('btnNewVacancy')?.addEventListener('click', function (e) {
      const isUnderBlog = window.location.pathname.includes('/blog/');
      const editorUrl = isUnderBlog ? 'blog/admin/editor-vacante.html?new=1' : 'admin/editor-vacante.html?new=1';
      window.open(editorUrl, '_blank');
      e.preventDefault();
    });

    document.getElementById('adminVacancySearchInput')?.addEventListener('input', function () {
      activeVacancySearchTerm = this.value;
      renderVacanciesTable();
    });

    document.getElementById('vacancyAreaFilterSelect')?.addEventListener('change', function () {
      activeVacancyArea = this.value;
      renderVacanciesTable();
    });

    document.getElementById('vacancyStatusFilterSelect')?.addEventListener('change', function () {
      activeVacancyStatus = this.value;
      renderVacanciesTable();
    });

    document.getElementById('btnSaveVacancy')?.addEventListener('click', function () {
      saveVacancyFromModal();
    });

    document.getElementById('vacancyEditorForm')?.addEventListener('submit', function (e) {
      e.preventDefault();
      saveVacancyFromModal();
    });

    // Filtro de tipo en Pop-ups
    document.getElementById('popupTypeFilterSelect')?.addEventListener('change', function () {
      activePopupFilterType = this.value;
      renderPopupsTable();
    });

    // Búsqueda en Pop-ups
    document.getElementById('adminPopupSearchInput')?.addEventListener('input', function () {
      activePopupSearchTerm = this.value;
      renderPopupsTable();
    });

    // Botón Nuevo Pop-up
    document.getElementById('btnNewPopup')?.addEventListener('click', function (e) {
      const isUnderBlog = window.location.pathname.includes('/blog/');
      const editorUrl = isUnderBlog ? 'blog/admin/editor-popup.html?new=1' : 'admin/editor-popup.html?new=1';
      window.open(editorUrl, '_blank');
    });

    // Escuchar sincronización en tiempo real desde la pestaña del editor
    window.addEventListener('storage', function (e) {
      if (!e || !e.key || e.key === STORAGE_KEYS.POSTS_DATA) {
        loadPosts();
        renderKpis();
        renderPostsTable();
      }
      if (!e || !e.key || e.key === STORAGE_KEYS.VACANCIES_DATA) {
        loadVacancies();
        renderVacanciesKpis();
        renderVacanciesTable();
      }
      if (!e || !e.key || e.key === STORAGE_KEYS.POPUPS_DATA || e.key === STORAGE_KEYS.ACTIVE_POPUP_ID) {
        loadPopups();
        renderPopupsKpis();
        renderPopupsTable();
      }
    });

    // Selector de tipo en modal
    document.querySelectorAll('.type-selector-card').forEach(card => {
      card.addEventListener('click', function () {
        const type = this.getAttribute('data-type');
        selectModalType(type);
      });
    });

    // Guardar publicación en modal
    document.getElementById('btnSavePost')?.addEventListener('click', function () {
      saveModalPost();
    });

    document.getElementById('postEditorForm')?.addEventListener('submit', function (e) {
      e.preventDefault();
      saveModalPost();
    });

    // Botón Restaurar originales
    document.getElementById('btnResetDefaults')?.addEventListener('click', function () {
      resetToDefaults();
    });

    // Botón Exportar JSON
    document.getElementById('btnExportJson')?.addEventListener('click', function () {
      exportPostsJson();
    });

    // Inicializar barra del editor visual WYSIWYG
    initVisualEditorToolbar();
  });
})();
