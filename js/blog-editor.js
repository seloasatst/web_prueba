/**
 * SELOASA - Live Preview Studio & Visual Editor
 * Edición de artículos en pestaña dedicada con vista previa en tiempo real
 * según la estructura correspondiente: Comunicado, Noticia o Blog Farma.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'seloasa_blog_posts';
  let currentPosts = [];
  let editingId = null;
  let isCodeModeActive = false;
  let currentEditLang = 'es';
  let postTranslations = {
    es: {},
    en: {},
    al: {},
    pt: {},
    fr: {}
  };

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

  function getQueryParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
  }

  function loadPosts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentPosts = parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading posts:', e);
    }

    fetch(getBackendApiUrl('php/noticias_api.php'))
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.items)) {
          currentPosts = data.items;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPosts));
        }
      })
      .catch(e => console.warn('Fetch noticias error:', e));

    return currentPosts;
  }

  function savePosts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPosts));
      window.dispatchEvent(new Event('storage'));
      fetch(getBackendApiUrl('php/noticias_api.php'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: currentPosts })
      }).catch(e => console.error('Notice sync noticias BD:', e));
    } catch (e) {
      console.error('Error saving posts:', e);
    }
  }

  function generateSlug(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 45) || 'publicacion-' + Date.now();
  }

  function formatReadTime(raw, defaultVal = '3 min') {
    if (!raw) return defaultVal;
    return String(raw)
      .replace(/\s*de\s*lectura(\s*técnica)?/gi, '')
      .replace(/\s*lectura/gi, '')
      .trim() || defaultVal;
  }

  function parseMediaSource(mediaInput) {
    if (!mediaInput) return { type: 'image', src: 'img/patio_unidades_dia_banner.jpg' };
    const clean = String(mediaInput).trim();

    // 1. YouTube
    const ytMatch = clean.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (ytMatch) {
      const id = ytMatch[1];
      return {
        type: 'youtube',
        id: id,
        embedUrl: `https://www.youtube.com/embed/${id}`,
        thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      };
    }

    // 2. Vimeo
    const vimeoMatch = clean.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vimeoMatch) {
      const id = vimeoMatch[1];
      return {
        type: 'vimeo',
        id: id,
        embedUrl: `https://player.vimeo.com/video/${id}`,
        thumbnailUrl: 'img/feature.jpg'
      };
    }

    // 3. Direct HTML embed
    if (clean.startsWith('<iframe') || clean.startsWith('<video')) {
      return { type: 'html', html: clean, thumbnailUrl: 'img/feature.jpg' };
    }

    // 4. Video file (.mp4, .webm, .ogg)
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(clean)) {
      return { type: 'video', src: clean, thumbnailUrl: 'img/feature.jpg' };
    }

    // 5. Image fallback
    return { type: 'image', src: clean };
  }

  function renderEditorLiveMediaHtml(post, templateType) {
    const media = parseMediaSource(post.image);

    if (media.type === 'youtube') {
      if (templateType === 'noticia') {
        return `
          <div class="noticia-hero-banner overflow-hidden position-relative bg-black mb-4">
            <div class="ratio ratio-21x9 ratio-md-16x9" style="min-height: 360px;">
              <iframe src="${media.embedUrl}?rel=0" title="${post.title || 'Video'}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
            <span class="noticia-hero-tag">
              <i class="fa fa-video me-1"></i> Noticia en Video SELOASA
            </span>
          </div>
        `;
      }
      return `
        <div class="mb-4 overflow-hidden rounded shadow-sm" style="border: 1px solid #dee2e6;">
          <div class="ratio ratio-16x9">
            <iframe src="${media.embedUrl}?rel=0" title="${post.title || 'Video'}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
          <div class="p-2 px-3 bg-light text-muted small border-top">
            <i class="fa fa-video me-1 text-primary"></i> Archivo audiovisual oficial SELOASA &bull; Difusión institucional
          </div>
        </div>
      `;
    }

    if (media.type === 'vimeo') {
      return `
        <div class="mb-4 overflow-hidden rounded shadow-sm" style="border: 1px solid #dee2e6;">
          <div class="ratio ratio-16x9">
            <iframe src="${media.embedUrl}" title="${post.title || 'Video'}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
          </div>
          <div class="p-2 px-3 bg-light text-muted small border-top">
            <i class="fa fa-video me-1 text-primary"></i> Archivo audiovisual oficial SELOASA
          </div>
        </div>
      `;
    }

    if (media.type === 'video') {
      return `
        <div class="mb-4 overflow-hidden rounded shadow-sm bg-black" style="border: 1px solid #dee2e6;">
          <video controls class="w-100" style="max-height: 440px; display: block;" playsinline preload="metadata">
            <source src="${media.src}" type="video/mp4">
            Tu navegador no soporta reproducción de video.
          </video>
          <div class="p-2 px-3 bg-light text-muted small border-top">
            <i class="fa fa-video me-1 text-primary"></i> Video oficial SELOASA
          </div>
        </div>
      `;
    }

    if (media.type === 'html') {
      return `
        <div class="mb-4 overflow-hidden rounded shadow-sm" style="border: 1px solid #dee2e6;">
          ${media.html}
        </div>
      `;
    }

    // Default image
    if (templateType === 'noticia') {
      return `
        <div class="noticia-hero-banner">
          <img src="${media.src || 'img/feature.jpg'}" alt="" class="noticia-hero-img">
          <span class="noticia-hero-tag">
            <i class="fa fa-newspaper me-1"></i> Noticia Operativa SELOASA
          </span>
        </div>
      `;
    }

    if (templateType === 'blog') {
      return `
        <div class="mb-4 overflow-hidden" style="border-radius: 8px;">
          <img src="${media.src || 'img/about.jpg'}" alt="" class="img-fluid w-100" style="max-height: 400px; object-fit: cover;">
        </div>
      `;
    }

    return `
      <div class="mb-4 overflow-hidden" style="border-radius: 6px; border: 1px solid #dee2e6;">
        <img src="${media.src || 'img/patio_unidades_dia_banner.jpg'}" alt="" class="img-fluid w-100" style="max-height: 380px; object-fit: cover;">
        <div class="p-2 px-3 bg-light text-muted small border-top">
          <i class="fa fa-camera me-1"></i> Archivo oficial SELOASA &bull; Transporte y resguardo farmacéutico
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     PLANTILLAS ESTRUCTURALES EN TIEMPO REAL
     ========================================================================== */
  function renderLiveComunicado(post) {
    const folioStr = (post.id ? post.id.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase() : '2026-OF');
    const showPdf = post.pdf_enabled !== false;
    const showNormativa = post.normativa_enabled !== false;
    const hasSidebar = showPdf || showNormativa;

    const pdfCardHtml = showPdf ? `
      <div class="comunicado-sidebar-card">
        <h5 class="fw-bold mb-2 text-dark"><i class="fa fa-file-pdf text-primary me-2"></i> ${post.pdf_title || 'Documento Oficial PDF'}</h5>
        <p class="small text-muted mb-3">${post.pdf_desc || 'Descarga la circular completa membretada con anexos técnicos para auditorías.'}</p>
        <a href="${post.pdf_url || 'docs_pdf/protocolo_seguridad.pdf'}" class="btn-comunicado-pdf" target="_blank">
          <i class="fa fa-download"></i> ${post.pdf_btn_text || 'Descargar Circular en PDF'}
        </a>
      </div>
    ` : '';

    const normativaCardHtml = showNormativa ? `
      <div class="comunicado-sidebar-card">
        <h5 class="fw-bold mb-2 text-dark"><i class="fa fa-clipboard-check text-primary me-2"></i> ${post.normativa_title || 'Marco Normativo'}</h5>
        <ul class="list-unstyled small text-muted mb-0 d-flex flex-column gap-2">
          ${renderNormativaList(post.normativa_items)}
        </ul>
      </div>
    ` : '';

    return `
      <div class="row g-4 ${!hasSidebar ? 'justify-content-center' : ''}">
        <div class="${hasSidebar ? 'col-lg-8' : 'col-lg-10'}">
          <article class="comunicado-doc-wrapper">
            <div class="comunicado-doc-header">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <span class="comunicado-badge-oficial">
                  <i class="fa fa-bullhorn me-1"></i> Comunicado Oficial SELOASA
                </span>
                <span class="comunicado-folio-box">
                  FOLIO: SEL-DIR/CAL-${folioStr}
                </span>
              </div>
              <h6 class="text-uppercase about-kicker mb-2" style="color: #e43b14;">
                ${post.dept || 'Dirección General & Aseguramiento de Calidad'}
              </h6>
              <h1 class="comunicado-doc-title">
                ${post.title}
              </h1>
              <div class="comunicado-meta-bar">
                <span><i class="far fa-calendar-alt text-primary me-1"></i> <strong>Fecha:</strong> ${post.date}</span>
                <span><i class="far fa-clock text-primary me-1"></i> ${formatReadTime(post.read_time, '3 min')} de lectura</span>
                <span><i class="fa fa-shield-alt text-primary me-1"></i> Validez 2026</span>
              </div>
            </div>

            ${renderEditorLiveMediaHtml(post, 'comunicado')}

            <div class="comunicado-resolucion-box">
              <div class="comunicado-resolucion-label">
                <i class="fa fa-file-alt me-1"></i> Resumen Ejecutivo de la Disposición:
              </div>
              <p class="comunicado-resolucion-text">${post.summary}</p>
            </div>

            <div class="comunicado-body-text">
              ${post.content}
            </div>

            <div class="comunicado-firma-seccion">
              <div>
                <div class="comunicado-firma-autoridad">Comité de Aseguramiento de Calidad y Tráfico</div>
                <div class="comunicado-firma-sub">Servicios Logísticos Alsera S.A. de C.V. &bull; Lerma, Estado de México</div>
              </div>
              <div>
                <span class="badge bg-light text-dark border px-3 py-2 rounded-pill small">
                  <i class="fa fa-check-circle text-primary me-1"></i> Revisado y Aprobado
                </span>
              </div>
            </div>
          </article>
        </div>

        ${hasSidebar ? `
        <div class="col-lg-4">
          ${pdfCardHtml}
          ${normativaCardHtml}
        </div>
        ` : ''}
      </div>
    `;
  }

  function renderNormativaList(itemsText) {
    const defaultText = `NOM-059-SSA1: Buenas prácticas de distribución.\nNOM-072-SSA1: Trazabilidad e insumos para la salud.\nDirectrices GDP: Monitoreo térmico continuo.`;
    const raw = (itemsText && itemsText.trim()) ? itemsText : defaultText;
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.map(line => {
      const parts = line.split(':');
      if (parts.length > 1) {
        return `<li><i class="fa fa-check text-primary me-2"></i> <strong>${parts[0].trim()}:</strong> ${parts.slice(1).join(':').trim()}</li>`;
      }
      return `<li><i class="fa fa-check text-primary me-2"></i> ${line}</li>`;
    }).join('');
  }

  function renderLiveNoticia(post) {
    return `
      ${renderEditorLiveMediaHtml(post, 'noticia')}

      <div class="noticia-metrics-row">
        <div class="noticia-metric-item">
          <div class="noticia-metric-val">-20°C a +25°C</div>
          <div class="noticia-metric-lbl">Rango Multitemperatura</div>
        </div>
        <div class="noticia-metric-item">
          <div class="noticia-metric-val">Dual GPS / 4G</div>
          <div class="noticia-metric-lbl">Telemetría Activa</div>
        </div>
        <div class="noticia-metric-item">
          <div class="noticia-metric-val">±0.5°C</div>
          <div class="noticia-metric-lbl">Tolerancia de Alerta</div>
        </div>
        <div class="noticia-metric-item">
          <div class="noticia-metric-val">24/7/365</div>
          <div class="noticia-metric-lbl">Monitoreo en Ruta</div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-8">
          <div class="noticia-main-card">
            <div class="mb-3">
              <h6 class="text-uppercase about-kicker mb-2" style="color: #e43b14;">
                ${post.dept || 'Gerencia de Tráfico y Monitoreo'}
              </h6>
              <h1 class="about-title mb-3" style="font-size: 2rem; line-height: 1.25;">
                ${post.title}
              </h1>
              <div class="d-flex align-items-center gap-3 text-muted small py-2 border-top border-bottom flex-wrap">
                <span><i class="far fa-calendar-alt text-primary me-1"></i> ${post.date}</span>
                <span><i class="far fa-clock text-primary me-1"></i> ${formatReadTime(post.read_time, '2 min')} de lectura</span>
                <span><i class="fa fa-map-marker-alt text-primary me-1"></i> Cobertura Nacional</span>
              </div>
            </div>

            <p class="lead fw-semibold text-dark mb-4" style="font-size: 1.05rem; line-height: 1.6;">
              ${post.summary}
            </p>

            <div class="comunicado-body-text mb-4">
              ${post.content}
            </div>

            <div class="noticia-specs-box">
              <div class="noticia-specs-title">
                <i class="fa fa-truck text-primary me-2"></i> Especificaciones de Equipamiento Operativo
              </div>
              <div class="row g-2 small text-muted">
                <div class="col-sm-6"><i class="fa fa-check text-primary me-2"></i> Unidades Thermo King con calibración periódica.</div>
                <div class="col-sm-6"><i class="fa fa-check text-primary me-2"></i> Módulos térmicos con memoria interna no volátil.</div>
                <div class="col-sm-6"><i class="fa fa-check text-primary me-2"></i> Transmisión celular encriptada con redundancia satelital.</div>
                <div class="col-sm-6"><i class="fa fa-check text-primary me-2"></i> Reportes inmediatos para soporte de auditorías COFEPRIS.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="comunicado-sidebar-card" style="background-color: #222222; color: #ffffff; border-color: #222222;">
            <h5 class="fw-bold text-white mb-2"><i class="fa fa-truck-moving text-primary me-2"></i> Capacidad de Transporte</h5>
            <p class="small text-light mb-3" style="color: #cbd5e1 !important;">¿Requieres unidades dedicadas refrigeradas o secas para tu operación farmacéutica?</p>
            <a href="contact/" class="btn btn-primary fw-bold rounded-pill w-100 py-2">
              Solicitar cotización de ruta &rarr;
            </a>
          </div>
        </div>
      </div>
    `;
  }

  function renderLiveBlog(post) {
    return `
      <div class="blog-reading-container">
        <article class="blog-editorial-card">
          <div class="blog-author-strip">
            <div class="blog-author-avatar">
              <i class="fa fa-user-tie"></i>
            </div>
            <div>
              <div class="fw-bold text-dark small mb-0">${post.dept || 'Aseguramiento de Calidad Farma'}</div>
              <div class="text-muted" style="font-size: 0.78rem;">
                <i class="far fa-calendar-alt text-primary me-1"></i> ${post.date} &bull; <i class="far fa-clock text-primary me-1"></i> ${formatReadTime(post.read_time, '4 min')} de lectura técnica
              </div>
            </div>
            <div class="ms-auto">
              <span class="badge bg-light text-dark border px-3 py-1 rounded-pill small">
                <i class="fa fa-bookmark text-primary me-1"></i> Artículo Técnico
              </span>
            </div>
          </div>

          <h1 class="about-title mb-3" style="font-size: 2.1rem; line-height: 1.25;">
            ${post.title}
          </h1>

          <div class="blog-key-takeaways-card">
            <div class="blog-takeaways-heading">
              <i class="fa fa-check-circle"></i> Puntos Clave de la Lectura:
            </div>
            <div class="blog-takeaway-row">
              <i class="fa fa-chevron-right"></i>
              <div><strong>Pre-enfriamiento obligatorio:</strong> Las cajas frigoríficas deben estabilizarse antes de estibar.</div>
            </div>
            <div class="blog-takeaway-row">
              <i class="fa fa-chevron-right"></i>
              <div><strong>Circulación continua de aire:</strong> Respeto estricto a los ductos de retorno para evitar puntos calientes.</div>
            </div>
            <div class="blog-takeaway-row">
              <i class="fa fa-chevron-right"></i>
              <div><strong>Inalterabilidad de evidencias:</strong> Registros contrastables con data-loggers independientes para COFEPRIS.</div>
            </div>
          </div>

          ${renderEditorLiveMediaHtml(post, 'blog')}

          <p class="lead fw-bold text-dark mb-4" style="line-height: 1.65; font-size: 1.1rem;">
            ${post.summary}
          </p>

          <div class="comunicado-body-text">
            ${post.content}
          </div>

          <div class="blog-pull-quote">
            «En el transporte farmacéutico, cada grado cuenta. Nuestra meta es ofrecer certeza documental y estabilidad térmica inquebrantable en cada kilómetro recorrido.»
          </div>

          <div class="blog-thermal-infobox">
            <div class="blog-thermal-pill">
              <div class="blog-thermal-deg">2°C a 8°C</div>
              <div class="small fw-bold text-dark">Medicamentos Biológicos</div>
            </div>
            <div class="blog-thermal-pill">
              <div class="blog-thermal-deg">15°C a 25°C</div>
              <div class="small fw-bold text-dark">Medicamentos Secos Farma</div>
            </div>
            <div class="blog-thermal-pill">
              <div class="blog-thermal-deg">±0.5°C</div>
              <div class="small fw-bold text-dark">Tolerancia de Excursión</div>
            </div>
          </div>

          <div class="blog-author-bio-footer">
            <div class="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0" style="width: 48px; height: 48px;">
              <i class="fa fa-shield-alt text-primary"></i>
            </div>
            <div>
              <div class="fw-bold text-dark">Comité de Aseguramiento de Calidad Farma & Validación</div>
              <div class="text-muted small">Especialistas en Buenas Prácticas de Almacenaje y Distribución en SELOASA S.A. de C.V.</div>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  /* ==========================================================================
     OBTENER DATOS DEL FORMULARIO Y ACTUALIZAR VISTA PREVIA
     ========================================================================== */
  function getCurrentFormData() {
    const visualEditor = document.getElementById('postContentVisualEditor');
    const contentTextarea = document.getElementById('postContentInput');
    const content = isCodeModeActive ? (contentTextarea?.value || '') : (visualEditor?.innerHTML || '');

    const title = (document.getElementById('postTitleInput')?.value || '').trim() || 'Título de la Publicación';
    const summary = (document.getElementById('postSummaryInput')?.value || '').trim() || 'Resumen ejecutivo de la publicación...';
    const id = (document.getElementById('postIdInput')?.value || '').trim() || generateSlug(title);
    const type = document.getElementById('postTypeHidden')?.value || 'comunicado';
    const dept = (document.getElementById('postDeptInput')?.value || '').trim() || 'Dirección General & Aseguramiento de Calidad';
    const date = (document.getElementById('postDateInput')?.value || '').trim() || 'Mayo 2026';
    const readTime = (document.getElementById('postReadTimeInput')?.value || '').trim() || '3 min';
    const image = (document.getElementById('postImageInput')?.value || '').trim() || 'img/patio_unidades_dia_banner.jpg';
    const category = (document.getElementById('postCategoryInput')?.value || '').trim() || (type === 'comunicado' ? 'Comunicado Oficial' : type === 'noticia' ? 'Noticia Operativa' : 'Blog Farma');
    const statusVal = document.getElementById('postStatusSelect')?.value || 'published';

    const pdfEnabledSwitch = document.getElementById('postPdfEnabledSwitch');
    const pdfEnabled = pdfEnabledSwitch ? pdfEnabledSwitch.checked : true;
    const pdfTitle = (document.getElementById('postPdfTitleInput')?.value || '').trim() || 'Documento Oficial PDF';
    const pdfUrl = (document.getElementById('postPdfUrlInput')?.value || '').trim() || 'docs_pdf/protocolo_seguridad.pdf';
    const pdfBtnText = (document.getElementById('postPdfBtnTextInput')?.value || '').trim() || 'Descargar Circular en PDF';
    const pdfDesc = (document.getElementById('postPdfDescInput')?.value || '').trim() || 'Descarga la circular completa membretada con anexos técnicos para auditorías.';

    const normativaEnabledSwitch = document.getElementById('postNormativaEnabledSwitch');
    const normativaEnabled = normativaEnabledSwitch ? normativaEnabledSwitch.checked : true;
    const normativaTitle = (document.getElementById('postNormativaTitleInput')?.value || '').trim() || 'Marco Normativo';
    const defaultNormativa = `NOM-059-SSA1: Buenas prácticas de distribución.\nNOM-072-SSA1: Trazabilidad e insumos para la salud.\nDirectrices GDP: Monitoreo térmico continuo.`;
    const normativaItems = (document.getElementById('postNormativaItemsInput')?.value || '').trim() || defaultNormativa;

    return {
      id: id,
      type: type,
      category: category,
      dept: dept,
      date: date,
      read_time: readTime,
      title: title,
      summary: summary,
      content: content || `<p>${summary}</p>`,
      image: image,
      status: statusVal,
      pdf_enabled: pdfEnabled,
      pdf_title: pdfTitle,
      pdf_url: pdfUrl,
      pdf_btn_text: pdfBtnText,
      pdf_desc: pdfDesc,
      normativa_enabled: normativaEnabled,
      normativa_title: normativaTitle,
      normativa_items: normativaItems
    };
  }

  function updateLivePreview() {
    const post = getCurrentFormData();
    const host = document.getElementById('livePreviewHost');
    const addressBar = document.getElementById('mockAddressBar');
    const currentStructureBadge = document.getElementById('previewStructureName');

    if (addressBar) {
      addressBar.textContent = `https://seloasa.com.mx/blog/${encodeURIComponent(post.id)}`;
    }

    if (currentStructureBadge) {
      currentStructureBadge.textContent = post.type === 'comunicado' ? 'Plantilla 1: Comunicado Oficial' : post.type === 'noticia' ? 'Plantilla 2: Noticia Operativa' : 'Plantilla 3: Blog Farma';
    }

    if (!host) return;

    if (post.type === 'comunicado') {
      host.innerHTML = renderLiveComunicado(post);
    } else if (post.type === 'noticia') {
      host.innerHTML = renderLiveNoticia(post);
    } else {
      host.innerHTML = renderLiveBlog(post);
    }
  }

  /* ==========================================================================
     INICIALIZACIÓN DEL EDITOR VISUAL WYSIWYG
     ========================================================================== */
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

  function initVisualToolbar() {
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
        if (contentInput) contentInput.value = visualEditor.innerHTML;
        updateLivePreview();
      });
    }

    if (contentInput) {
      contentInput.addEventListener('input', function () {
        updateLivePreview();
      });
    }

    document.querySelectorAll('.visual-toolbar-btn[data-cmd]').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (isCodeModeActive) return;

        const cmd = this.getAttribute('data-cmd');
        const val = this.getAttribute('data-val') || null;

        document.execCommand(cmd, false, val);
        visualEditor?.focus();
        updateVisualWordCount();
        if (contentInput && visualEditor) contentInput.value = visualEditor.innerHTML;
        updateLivePreview();
      });
    });

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
      if (contentInput && visualEditor) contentInput.value = visualEditor.innerHTML;
      updateLivePreview();
    });

    document.getElementById('btnInsertVideo')?.addEventListener('click', function (e) {
      e.preventDefault();
      const rawUrl = prompt('Ingresa el enlace de YouTube, Vimeo o video .MP4:');
      if (!rawUrl || !rawUrl.trim()) return;

      const media = parseMediaSource(rawUrl.trim());
      let embedHtml = '';

      if (media.type === 'youtube') {
        embedHtml = `
          <div class="ratio ratio-16x9 my-3 overflow-hidden rounded shadow-sm">
            <iframe src="${media.embedUrl}?rel=0" title="Video YouTube" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
          <p><br></p>
        `;
      } else if (media.type === 'vimeo') {
        embedHtml = `
          <div class="ratio ratio-16x9 my-3 overflow-hidden rounded shadow-sm">
            <iframe src="${media.embedUrl}" title="Video Vimeo" frameborder="0" allowfullscreen></iframe>
          </div>
          <p><br></p>
        `;
      } else if (media.type === 'video') {
        embedHtml = `
          <div class="my-3 overflow-hidden rounded shadow-sm bg-black">
            <video controls class="w-100" style="max-height: 440px;" preload="metadata">
              <source src="${media.src}" type="video/mp4">
              Tu navegador no soporta video.
            </video>
          </div>
          <p><br></p>
        `;
      } else {
        alert('Por favor introduce un enlace válido de YouTube (ej: https://www.youtube.com/watch?v=...), Vimeo o archivo .mp4');
        return;
      }

      if (isCodeModeActive) {
        if (contentInput) {
          contentInput.value += '\n' + embedHtml;
          contentInput.dispatchEvent(new Event('input'));
        }
      } else {
        visualEditor?.focus();
        document.execCommand('insertHTML', false, embedHtml);
        updateVisualWordCount();
        if (contentInput && visualEditor) contentInput.value = visualEditor.innerHTML;
        updateLivePreview();
      }
    });
  }

  /* ==========================================================================
     CARGA DEL ARTÍCULO
     ========================================================================== */
  function populateEditor() {
    loadPosts();
    const paramId = getQueryParam('id');
    const isNew = getQueryParam('new') === '1' || !paramId;

    let post = null;
    if (!isNew && paramId) {
      const cleanId = String(paramId).trim().toLowerCase();
      post = currentPosts.find(p => String(p.id || '').trim().toLowerCase() === cleanId);
    }

    editingId = post ? post.id : (paramId && !isNew ? paramId : null);

    function updateHeaderTitle(titleText) {
      const pageSubtitle = document.getElementById('editorPageSubtitle');
      if (pageSubtitle) {
        const text = (titleText || '').trim();
        if (text) {
          pageSubtitle.textContent = editingId ? `Editando: ${text}` : `Borrador: ${text}`;
        } else {
          pageSubtitle.textContent = editingId ? 'Editando: Publicación sin título' : 'Creando Nueva Publicación en Tiempo Real';
        }
      }
    }

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

    // Sincronizar interruptor rápido de la barra superior
    const headerSwitch = document.getElementById('headerStatusSwitch');
    const headerLabel = document.getElementById('headerStatusLabel');
    const headerDot = document.getElementById('headerStatusDot');

    function syncHeaderStatus(status) {
      const isPub = status === 'published';
      if (statusSelect) statusSelect.value = isPub ? 'published' : 'draft';
      if (headerSwitch) headerSwitch.checked = isPub;
      if (headerLabel) {
        headerLabel.textContent = isPub ? 'Publicada en Web' : 'Borrador';
        headerLabel.style.color = isPub ? '#15803d' : '#475569';
      }
      if (headerDot) {
        headerDot.className = `status-indicator-dot ${isPub ? 'published' : 'draft'}`;
      }
    }

    // Campos de PDF y Marco Normativo (Opcionales con Interruptores)
    const pdfSwitch = document.getElementById('postPdfEnabledSwitch');
    const pdfLabel = document.getElementById('postPdfEnabledLabel');
    const pdfContainer = document.getElementById('postPdfFieldsContainer');

    const normativaSwitch = document.getElementById('postNormativaEnabledSwitch');
    const normativaLabel = document.getElementById('postNormativaEnabledLabel');
    const normativaContainer = document.getElementById('postNormativaFieldsContainer');

    function syncPdfSwitch(enabled) {
      if (pdfSwitch) pdfSwitch.checked = enabled;
      if (pdfLabel) {
        pdfLabel.textContent = enabled ? 'Activo (Visible)' : 'Oculto (Desactivado)';
        pdfLabel.style.color = enabled ? '#15803d' : '#64748b';
      }
      if (pdfContainer) {
        pdfContainer.style.opacity = enabled ? '1' : '0.45';
        pdfContainer.style.pointerEvents = enabled ? 'auto' : 'none';
      }
    }

    function syncNormativaSwitch(enabled) {
      if (normativaSwitch) normativaSwitch.checked = enabled;
      if (normativaLabel) {
        normativaLabel.textContent = enabled ? 'Activo (Visible)' : 'Oculto (Desactivado)';
        normativaLabel.style.color = enabled ? '#15803d' : '#64748b';
      }
      if (normativaContainer) {
        normativaContainer.style.opacity = enabled ? '1' : '0.45';
        normativaContainer.style.pointerEvents = enabled ? 'auto' : 'none';
      }
    }

    const pdfTitleInput = document.getElementById('postPdfTitleInput');
    const pdfUrlInput = document.getElementById('postPdfUrlInput');
    const pdfBtnTextInput = document.getElementById('postPdfBtnTextInput');
    const pdfDescInput = document.getElementById('postPdfDescInput');
    const normativaTitleInput = document.getElementById('postNormativaTitleInput');
    const normativaItemsInput = document.getElementById('postNormativaItemsInput');

    const defaultNormativa = `NOM-059-SSA1: Buenas prácticas de distribución.\nNOM-072-SSA1: Trazabilidad e insumos para la salud.\nDirectrices GDP: Monitoreo térmico continuo.`;

    function getTranslatableFormFields() {
      const visualEditor = document.getElementById('postContentVisualEditor');
      const contentTextarea = document.getElementById('postContentInput');
      const content = isCodeModeActive ? (contentTextarea?.value || '') : (visualEditor?.innerHTML || '');
      return {
        title: (titleInput?.value || '').trim(),
        summary: (summaryInput?.value || '').trim(),
        content: content,
        category: (categoryInput?.value || '').trim(),
        dept: (deptInput?.value || '').trim(),
        pdf_title: (pdfTitleInput?.value || '').trim(),
        pdf_btn_text: (pdfBtnTextInput?.value || '').trim(),
        pdf_desc: (pdfDescInput?.value || '').trim(),
        normativa_title: (normativaTitleInput?.value || '').trim(),
        normativa_items: (normativaItemsInput?.value || '').trim()
      };
    }

    function setTranslatableFormFields(data) {
      data = data || {};
      if (titleInput) titleInput.value = data.title || '';
      if (summaryInput) summaryInput.value = data.summary || '';
      if (categoryInput) categoryInput.value = data.category || '';
      if (deptInput) deptInput.value = data.dept || '';

      const contentVal = data.content || (data.summary ? `<p>${data.summary}</p>` : '');
      if (contentInput) contentInput.value = contentVal;
      if (visualEditor) {
        visualEditor.innerHTML = contentVal;
        updateVisualWordCount();
      }

      if (pdfTitleInput) pdfTitleInput.value = data.pdf_title || '';
      if (pdfBtnTextInput) pdfBtnTextInput.value = data.pdf_btn_text || '';
      if (pdfDescInput) pdfDescInput.value = data.pdf_desc || '';
      if (normativaTitleInput) normativaTitleInput.value = data.normativa_title || '';
      if (normativaItemsInput) normativaItemsInput.value = data.normativa_items || '';
    }

    function updateLangBadges() {
      const langKeys = ['es', 'en', 'al', 'pt', 'fr'];
      langKeys.forEach(l => {
        const badge = document.getElementById(`langBadge-${l}`);
        if (!badge) return;
        const data = postTranslations[l] || {};
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

    function switchEditLanguage(newLang) {
      if (newLang === currentEditLang) return;

      // 1. Guardar contenido actual en el idioma previo
      postTranslations[currentEditLang] = getTranslatableFormFields();
      updateLangBadges();

      currentEditLang = newLang;

      // 2. Actualizar estilos de pestañas
      document.querySelectorAll('.lang-tab-btn').forEach(btn => {
        const bLang = btn.getAttribute('data-lang');
        if (bLang === newLang) {
          btn.className = 'btn btn-sm btn-outline-primary active rounded-pill fw-bold px-3 py-1.5 lang-tab-btn';
        } else {
          btn.className = 'btn btn-sm btn-outline-secondary rounded-pill fw-bold px-3 py-1.5 lang-tab-btn';
        }
      });

      // 3. Actualizar indicador
      const langNames = {
        es: { flag: '🇪🇸', name: 'Español (Principal)' },
        en: { flag: '🇺🇸', name: 'English' },
        al: { flag: '🇩🇪', name: 'Deutsch' },
        pt: { flag: '🇧🇷', name: 'Português' },
        fr: { flag: '🇫🇷', name: 'Français' }
      };
      const info = langNames[newLang] || { flag: '🌐', name: newLang };
      const indicator = document.getElementById('activeLangIndicator');
      if (indicator) {
        indicator.innerHTML = `<span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5 rounded-pill"><i class="fa fa-pen me-1"></i> Idioma en edición: ${info.flag} ${info.name}</span>`;
      }

      // 4. Cargar contenido del idioma seleccionado
      const targetData = postTranslations[newLang] || {};
      setTranslatableFormFields(targetData);
      updateLivePreview();
    }

    // Vincular clic en pestañas de idioma
    document.querySelectorAll('.lang-tab-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const l = this.getAttribute('data-lang');
        if (l) switchEditLanguage(l);
      });
    });

    // Botón copiar desde español
    document.getElementById('btnCopyFromSpanish')?.addEventListener('click', function (e) {
      e.preventDefault();
      if (currentEditLang === 'es') {
        alert('Ya te encuentras en la versión en Español.');
        return;
      }
      const esData = postTranslations.es || {};
      if (!esData.title) {
        // Asegurar que español esté guardado
        postTranslations.es = getTranslatableFormFields();
      }
      setTranslatableFormFields(postTranslations.es);
      postTranslations[currentEditLang] = { ...postTranslations.es };
      updateLangBadges();
      updateLivePreview();
    });

    function applyPostToForm(p) {
      if (!p) return;
      editingId = p.id || editingId;
      updateHeaderTitle(p.title || '');
      selectType(p.type || 'comunicado');

      if (idInput) idInput.value = p.id || '';
      if (dateInput) dateInput.value = p.date || 'Mayo 2026';
      if (readTimeInput) readTimeInput.value = p.read_time || '3 min';
      if (statusSelect) statusSelect.value = p.status || 'published';
      if (imageInput) imageInput.value = p.image || 'img/patio_unidades_dia_banner.jpg';

      syncHeaderStatus(p.status || 'published');

      const viewPublicBtn = document.getElementById('btnViewPublicPost');
      if (viewPublicBtn && p.id) {
        viewPublicBtn.setAttribute('href', `blog/articulo.html?id=${encodeURIComponent(p.id)}`);
        viewPublicBtn.classList.remove('d-none');
      }

      syncPdfSwitch(p.pdf_enabled !== false);
      syncNormativaSwitch(p.normativa_enabled !== false);
      if (pdfUrlInput) pdfUrlInput.value = p.pdf_url || 'docs_pdf/protocolo_seguridad.pdf';

      // Cargar matriz de traducciones para los 5 idiomas
      postTranslations = {
        es: (p.translations && p.translations.es) ? { ...p.translations.es } : {
          title: p.title || '',
          summary: p.summary || '',
          content: p.content || (p.summary ? `<p>${p.summary}</p>` : ''),
          category: p.category || (p.type === 'comunicado' ? 'Comunicado Oficial' : p.type === 'noticia' ? 'Noticia Operativa' : 'Blog Farma'),
          dept: p.dept || 'Dirección General & Aseguramiento de Calidad',
          pdf_title: p.pdf_title || 'Documento Oficial PDF',
          pdf_btn_text: p.pdf_btn_text || 'Descargar Circular en PDF',
          pdf_desc: p.pdf_desc || 'Descarga la circular completa membretada con anexos técnicos para auditorías.',
          normativa_title: p.normativa_title || 'Marco Normativo',
          normativa_items: p.normativa_items || defaultNormativa
        },
        en: (p.translations && p.translations.en) ? { ...p.translations.en } : {},
        al: (p.translations && p.translations.al) ? { ...p.translations.al } : {},
        pt: (p.translations && p.translations.pt) ? { ...p.translations.pt } : {},
        fr: (p.translations && p.translations.fr) ? { ...p.translations.fr } : {}
      };

      currentEditLang = 'es';
      updateLangBadges();

      // Cargar la versión en Español por defecto
      setTranslatableFormFields(postTranslations.es);
      updateLivePreview();
    }

    if (post) {
      applyPostToForm(post);
    } else {
      updateHeaderTitle('');
      selectType('comunicado');
      syncHeaderStatus('published');
      syncPdfSwitch(true);
      syncNormativaSwitch(true);
      postTranslations = { es: {}, en: {}, al: {}, pt: {}, fr: {} };
      updateLangBadges();
      updateLivePreview();
    }

    // Consultar API si estamos editando un artículo
    if (paramId && !isNew) {
      fetch(getBackendApiUrl('php/noticias_api.php?id=' + encodeURIComponent(paramId)))
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.item) {
            applyPostToForm(data.item);
          }
        })
        .catch(err => console.warn('Fetch noticia individual API error:', err));
    }

    statusSelect?.addEventListener('change', function () {
      syncHeaderStatus(this.value);
    });

    headerSwitch?.addEventListener('change', function () {
      const nextStatus = this.checked ? 'published' : 'draft';
      syncHeaderStatus(nextStatus);
      updateLivePreview();
    });

    setVisualEditorMode('visual');

    // Actualizar título en tiempo real en la barra superior y slug
    if (titleInput) {
      titleInput.addEventListener('input', function () {
        updateHeaderTitle(titleInput.value);
        if (!editingId && idInput && currentEditLang === 'es') {
          idInput.value = generateSlug(titleInput.value);
        }
        updateLivePreview();
      });
    }

    pdfSwitch?.addEventListener('change', function () {
      syncPdfSwitch(this.checked);
      updateLivePreview();
    });

    normativaSwitch?.addEventListener('change', function () {
      syncNormativaSwitch(this.checked);
      updateLivePreview();
    });

    // Vincular todos los campos a actualización en tiempo real inmediata
    [titleInput, summaryInput, deptInput, dateInput, readTimeInput, imageInput, categoryInput, statusSelect, idInput,
     pdfTitleInput, pdfUrlInput, pdfBtnTextInput, pdfDescInput, normativaTitleInput, normativaItemsInput].forEach(inp => {
      if (inp) {
        inp.addEventListener('input', updateLivePreview);
        inp.addEventListener('change', updateLivePreview);
      }
    });

    // Render inicial
    updateLivePreview();
  }

  function selectType(type) {
    document.querySelectorAll('.type-selector-card').forEach(card => {
      if (card.getAttribute('data-type') === type) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
    const hidden = document.getElementById('postTypeHidden');
    if (hidden) hidden.value = type;

    const categoryInput = document.getElementById('postCategoryInput');
    if (categoryInput && !editingId) {
      if (type === 'comunicado') categoryInput.value = 'Comunicado Oficial';
      else if (type === 'noticia') categoryInput.value = 'Noticia Operativa';
      else categoryInput.value = 'Blog Farma';
    }

    // Actualizar pill de estructura en el header
    const typeBadge = document.getElementById('editorPostTypeBadge');
    if (typeBadge) {
      if (type === 'comunicado') {
        typeBadge.innerHTML = '<i class="fa fa-bullhorn text-primary me-1"></i> Comunicado Oficial';
      } else if (type === 'noticia') {
        typeBadge.innerHTML = '<i class="fa fa-newspaper text-success me-1"></i> Noticia Operativa';
      } else {
        typeBadge.innerHTML = '<i class="fa fa-feather-alt text-info me-1"></i> Blog Farma';
      }
    }

    // Indicar visualmente si los extras de barra lateral aplican a esta plantilla
    const sidebarExtras = document.getElementById('sectionSidebarExtras');
    if (sidebarExtras) {
      if (type === 'comunicado') {
        sidebarExtras.style.opacity = '1';
      } else {
        sidebarExtras.style.opacity = '0.75';
      }
    }

    updateLivePreview();
  }

  /* ==========================================================================
     GUARDADO Y ACCIONES
     ========================================================================== */
  function savePostData() {
    // 1. Guardar cambios del idioma activo en el almacén de traducciones
    const currentFields = {
      title: (document.getElementById('postTitleInput')?.value || '').trim(),
      summary: (document.getElementById('postSummaryInput')?.value || '').trim(),
      content: isCodeModeActive ? (document.getElementById('postContentInput')?.value || '') : (document.getElementById('postContentVisualEditor')?.innerHTML || ''),
      category: (document.getElementById('postCategoryInput')?.value || '').trim(),
      dept: (document.getElementById('postDeptInput')?.value || '').trim(),
      pdf_title: (document.getElementById('postPdfTitleInput')?.value || '').trim(),
      pdf_btn_text: (document.getElementById('postPdfBtnTextInput')?.value || '').trim(),
      pdf_desc: (document.getElementById('postPdfDescInput')?.value || '').trim(),
      normativa_title: (document.getElementById('postNormativaTitleInput')?.value || '').trim(),
      normativa_items: (document.getElementById('postNormativaItemsInput')?.value || '').trim()
    };
    postTranslations[currentEditLang] = currentFields;

    const postData = getCurrentFormData();

    // Asegurar que las propiedades base reflejen la versión en español si existe
    const esData = postTranslations.es || {};
    if (esData.title) postData.title = esData.title;
    if (esData.summary) postData.summary = esData.summary;
    if (esData.content) postData.content = esData.content;
    if (esData.category) postData.category = esData.category;
    if (esData.dept) postData.dept = esData.dept;

    // Adjuntar las traducciones de los 5 idiomas
    postData.translations = postTranslations;

    if (!postData.title || postData.title === 'Título de la Publicación') {
      alert('Por favor ingresa un título para la publicación en Español.');
      document.getElementById('postTitleInput')?.focus();
      return;
    }

    postData.badge_class = postData.type === 'comunicado' ? 'badge-pill-comunicado' : postData.type === 'noticia' ? 'badge-pill-noticia' : 'badge-pill-blog';
    postData.updated_at = new Date().toISOString();

    if (editingId) {
      const cleanId = String(editingId).trim().toLowerCase();
      const index = currentPosts.findIndex(p => String(p.id || '').trim().toLowerCase() === cleanId);
      if (index !== -1) {
        currentPosts[index] = { ...currentPosts[index], ...postData };
      } else {
        currentPosts.unshift(postData);
      }
    } else {
      postData.created_at = new Date().toISOString();
      postData.is_featured = false;
      currentPosts.unshift(postData);
      editingId = postData.id;
    }

    savePosts();

    // Actualizar botón de vista pública
    const viewPublicBtn = document.getElementById('btnViewPublicPost');
    if (viewPublicBtn) {
      viewPublicBtn.setAttribute('href', `blog/${encodeURIComponent(postData.id)}`);
      viewPublicBtn.classList.remove('d-none');
    }

    // Feedback visual
    const saveBtn = document.getElementById('btnSaveStudio');
    if (saveBtn) {
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fa fa-check me-1"></i> ¡Guardado!';
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
      }, 2000);
    }

    const toast = document.getElementById('saveSuccessToast');
    if (toast) {
      toast.classList.remove('d-none');
      setTimeout(() => {
        toast.classList.add('d-none');
      }, 2500);
    }
  }

  /* ==========================================================================
     INICIALIZADOR
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    initVisualToolbar();
    populateEditor();

    // Selector de tipo
    document.querySelectorAll('.type-selector-card').forEach(card => {
      card.addEventListener('click', function () {
        const type = this.getAttribute('data-type');
        selectType(type);
      });
    });

    // Guardar cambios
    document.getElementById('btnSaveStudio')?.addEventListener('click', function (e) {
      e.preventDefault();
      savePostData();
    });

    // Atajo de teclado Ctrl+S para guardar
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        savePostData();
      }
    });

    // Alternar ancho de dispositivo en la vista previa (Desktop, Tablet, Mobile)
    const previewCanvas = document.getElementById('livePreviewHost');
    document.querySelectorAll('.btn-device-switch').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.btn-device-switch').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const device = this.getAttribute('data-device');

        if (previewCanvas) {
          previewCanvas.classList.remove('device-tablet', 'device-mobile');
          if (device === 'tablet') previewCanvas.classList.add('device-tablet');
          if (device === 'mobile') previewCanvas.classList.add('device-mobile');
        }
      });
    });
  });
})();
