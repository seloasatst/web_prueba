/**
 * SELOASA - Blog Detail Script (Diseño Original SELOASA)
 * Paleta de colores oficial: #e43b14 (rojo), #222222 (oscuro), #f7f7f7 (fondo claro), #ffffff
 * 
 * 3 Estructuras completamente diferenciadas según el tipo de publicación:
 * 1. COMUNICADO (post.type === 'comunicado'):
 *    - Estructura de Documento / Circular Oficial Membretada
 *    - Folio institucional, sello formal, recuadro de resolución ejecutiva, bloque de firmas y descarga de PDF.
 * 2. NOTICIA (post.type === 'noticia'):
 *    - Estructura de Noticia Periodística & Media Split
 *    - Hero panorámico completo arriba, fila de métricas operativas (temperatura, GPS, precisión, red), ficha técnica de equipamiento y sidebar operativo.
 * 3. BLOG FARMA (post.type === 'blog'):
 *    - Estructura de Lectura Editorial / Guía Técnica
 *    - Columna de lectura centrada, barra de autor técnico, caja de puntos clave (Key Takeaways) al inicio, cita destacada (pull-quote), infografía de rangos térmicos y artículos recomendados al pie en 3 columnas.
 */

(function () {
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  function getPostIdFromUrl() {
    // 1. Obtener de parámetro ?id= (retrocompatibilidad)
    const queryId = getQueryParam('id');
    if (queryId) return queryId;

    // 2. Obtener de Pretty URL (/blog/slug o /blog/articulo/slug)
    const pathname = window.location.pathname.replace(/\/+$/, '');
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      const last = decodeURIComponent(segments[segments.length - 1]);
      if (!['blog', 'articulo', 'articulo.html', 'index.html', 'shipping'].includes(last.toLowerCase())) {
        return last;
      }
    }

    return 'featured';
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

  function getBlogContent(lang) {
    const safeLang = normalizeLang(lang);
    let baseContent = (window.I18N_PAGE_TRANSLATIONS
      && window.I18N_PAGE_TRANSLATIONS[safeLang]
      && window.I18N_PAGE_TRANSLATIONS[safeLang].blogPage)
      || (window.I18N_PAGE_TRANSLATIONS
      && window.I18N_PAGE_TRANSLATIONS.es
      && window.I18N_PAGE_TRANSLATIONS.es.blogPage)
      || null;

    if (!baseContent) return null;

    try {
      const storedPosts = localStorage.getItem('seloasa_blog_posts');
      if (storedPosts) {
        const posts = JSON.parse(storedPosts);
        if (Array.isArray(posts) && posts.length > 0) {
          const published = posts.filter(p => p.status !== 'draft');
          const featured = published.find(p => p.is_featured || p.id === 'featured') || published[0];
          const latestItems = published.filter(p => p !== featured);

          return {
            ...baseContent,
            featured: featured ? { ...featured } : null,
            latest: {
              ...baseContent.latest,
              items: latestItems
            }
          };
        }
      }
    } catch (e) {
      console.warn('Error reading admin posts in blog-detail:', e);
    }

    return {
      ...baseContent,
      featured: null,
      latest: {
        ...baseContent.latest,
        items: []
      }
    };
  }

  function getLocalizedPost(post, lang) {
    if (!post) return post;
    const safeLang = normalizeLang(lang);
    const t = (post.translations && post.translations[safeLang]) ? post.translations[safeLang] : null;
    if (!t) return post;
    return {
      ...post,
      title: t.title || post.title,
      summary: t.summary || post.summary,
      content: t.content || post.content,
      category: t.category || post.category,
      badge: t.badge || post.badge,
      dept: t.dept || post.dept,
      pdf_title: t.pdf_title || post.pdf_title,
      pdf_desc: t.pdf_desc || post.pdf_desc,
      normativa_title: t.normativa_title || post.normativa_title,
      normativa_items: t.normativa_items || post.normativa_items,
      metric_1_label: t.metric_1_label || post.metric_1_label,
      metric_2_label: t.metric_2_label || post.metric_2_label,
      metric_3_label: t.metric_3_label || post.metric_3_label,
      metric_4_label: t.metric_4_label || post.metric_4_label,
      quote_text: t.quote_text || post.quote_text,
      quote_author: t.quote_author || post.quote_author,
      takeaways: t.takeaways || post.takeaways,
      author_name: t.author_name || post.author_name,
      author_role: t.author_role || post.author_role
    };
  }

  function findPost(content, postId) {
    if (!content) return null;

    const targetId = (postId || '').toLowerCase().trim();

    if (content.featured && (targetId === 'featured' || (content.featured.id && content.featured.id.toLowerCase() === targetId))) {
      return { ...content.featured, id: content.featured.id || 'featured', type: content.featured.type || 'comunicado' };
    }

    if (content.latest && Array.isArray(content.latest.items)) {
      const found = content.latest.items.find((item, index) => {
        return (item.id && item.id.toLowerCase() === targetId) || String(index) === targetId;
      });
      if (found) return found;
    }

    return null;
  }

  function formatReadTime(raw, defaultVal = '3 min') {
    if (!raw) return defaultVal;
    return String(raw)
      .replace(/\s*de\s*lectura(\s*técnica)?/gi, '')
      .replace(/\s*lectura/gi, '')
      .trim() || defaultVal;
  }

  function isVideoString(str) {
    if (!str) return false;
    return /(?:youtube\.com|youtu\.be|vimeo\.com|\.(mp4|webm|ogg))|<iframe|<video/i.test(str);
  }

  function parseMediaSource(mediaInput, fallbackTime = '1') {
    let videoUrl = '';
    let imageUrl = '';
    let videoTime = fallbackTime || '1';

    if (typeof mediaInput === 'object' && mediaInput !== null) {
      videoUrl = (mediaInput.video_url || '').trim();
      imageUrl = (mediaInput.image || '').trim();
      videoTime = mediaInput.video_time || fallbackTime || '1';
    } else {
      const clean = String(mediaInput || '').trim();
      if (isVideoString(clean)) {
        videoUrl = clean;
      } else {
        imageUrl = clean;
      }
    }

    if (!videoUrl && isVideoString(imageUrl)) {
      videoUrl = imageUrl;
      imageUrl = '';
    }

    if (videoUrl) {
      // 1. YouTube
      const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
      if (ytMatch) {
        const id = ytMatch[1];
        return {
          type: 'youtube',
          id: id,
          embedUrl: `https://www.youtube.com/embed/${id}`,
          thumbnailUrl: imageUrl || `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
          videoTime: videoTime
        };
      }

      // 2. Vimeo
      const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
      if (vimeoMatch) {
        const id = vimeoMatch[1];
        return {
          type: 'vimeo',
          id: id,
          embedUrl: `https://player.vimeo.com/video/${id}`,
          thumbnailUrl: imageUrl || 'img/feature.jpg',
          videoTime: videoTime
        };
      }

      // 3. Direct HTML embed
      if (videoUrl.startsWith('<iframe') || videoUrl.startsWith('<video')) {
        return {
          type: 'html',
          html: videoUrl,
          thumbnailUrl: imageUrl || 'img/feature.jpg',
          videoTime: videoTime
        };
      }

      // 4. Video file (.mp4, .webm, .ogg)
      if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl)) {
        const baseSrc = videoUrl.split('#')[0];
        const timedSrc = `${baseSrc}#t=${videoTime}`;
        return {
          type: 'video',
          src: timedSrc,
          baseSrc: baseSrc,
          videoTime: videoTime,
          thumbnailUrl: imageUrl || ''
        };
      }
    }

    return {
      type: 'image',
      src: imageUrl || 'img/patio_unidades_dia_banner.jpg',
      thumbnailUrl: imageUrl || 'img/patio_unidades_dia_banner.jpg',
      videoTime: videoTime
    };
  }

  function renderDetailMediaHtml(post, templateType) {
    const media = parseMediaSource(post);

    if (media.type === 'youtube') {
      if (templateType === 'noticia') {
        return `
          <div class="noticia-hero-banner overflow-hidden position-relative bg-black mb-4">
            <div class="ratio ratio-21x9 ratio-md-16x9" style="min-height: 380px;">
              <iframe src="${media.embedUrl}?rel=0" title="${post.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
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
            <iframe src="${media.embedUrl}?rel=0" title="${post.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        </div>
      `;
    }

    if (media.type === 'vimeo') {
      return `
        <div class="mb-4 overflow-hidden rounded shadow-sm" style="border: 1px solid #dee2e6;">
          <div class="ratio ratio-16x9">
            <iframe src="${media.embedUrl}" title="${post.title}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
          </div>
        </div>
      `;
    }

    if (media.type === 'video') {
      return `
        <div class="mb-4 overflow-hidden rounded shadow-sm bg-black" style="border: 1px solid #dee2e6;">
          <video controls ${media.thumbnailUrl ? `poster="${media.thumbnailUrl}"` : ''} class="w-100" style="max-height: 480px; display: block;" playsinline preload="metadata">
            <source src="${media.src}" type="video/mp4">
            Tu navegador no soporta reproducción de video.
          </video>
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
          <img src="${media.src || 'img/feature.jpg'}" alt="${post.image_alt || post.title}" class="noticia-hero-img">
          <span class="noticia-hero-tag">
            <i class="fa fa-newspaper me-1"></i> Noticia Operativa SELOASA
          </span>
        </div>
      `;
    }

    if (templateType === 'blog') {
      return `
        <div class="mb-4 overflow-hidden" style="border-radius: 8px;">
          <img src="${media.src || 'img/about.jpg'}" alt="${post.image_alt || post.title}" class="img-fluid w-100" style="max-height: 420px; object-fit: cover;">
        </div>
      `;
    }

    return `
      <div class="mb-4 overflow-hidden" style="border-radius: 6px; border: 1px solid #dee2e6;">
        <img src="${media.src || 'img/patio_unidades_dia_banner.jpg'}" alt="${post.image_alt || post.title}" class="img-fluid w-100" style="max-height: 400px; object-fit: cover;">
        <div class="p-2 px-3 bg-light text-muted small border-top">
          <i class="fa fa-camera me-1"></i> Archivo oficial SELOASA &bull; Transporte y resguardo farmacéutico
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     ESTRUCTURA 1: COMUNICADO OFICIAL (FORMATO DOCUMENTO / CIRCULAR)
     ========================================================================== */
  function renderEstructuraComunicado(post, content) {
    const showPdf = post.pdf_enabled !== false;
    const showNormativa = post.normativa_enabled !== false;
    const showFolio = Boolean(post.folio_enabled);
    const folioText = (post.folio_text || '').trim();
    const showFirma = Boolean(post.firma_enabled);

    const pdfCardHtml = showPdf ? `
            <!-- Descarga de Circular Oficial en PDF -->
            <div class="comunicado-sidebar-card">
              <h5 class="fw-bold mb-2 text-dark"><i class="fa fa-file-pdf text-primary me-2"></i> ${post.pdf_title || 'Documento Oficial PDF'}</h5>
              <p class="small text-muted mb-3">${post.pdf_desc || 'Descarga la circular completa membretada con anexos técnicos para auditorías de calidad.'}</p>
              <a href="${post.pdf_url || 'docs_pdf/protocolo_seguridad.pdf'}" class="btn-comunicado-pdf" target="_blank" rel="noopener noreferrer">
                <i class="fa fa-download"></i> ${post.pdf_btn_text || 'Descargar Circular en PDF'}
              </a>
            </div>
    ` : '';

    const normativaCardHtml = showNormativa ? `
            <!-- Marco Normativo -->
            <div class="comunicado-sidebar-card">
              <h5 class="fw-bold mb-2 text-dark"><i class="fa fa-clipboard-check text-primary me-2"></i> ${post.normativa_title || 'Marco Normativo'}</h5>
              <ul class="list-unstyled small text-muted mb-0 d-flex flex-column gap-2">
                ${renderNormativaList(post.normativa_items)}
              </ul>
            </div>
    ` : '';

    return `
      <div class="row g-4 g-lg-5">
        <div class="col-lg-8">
          <article class="comunicado-doc-wrapper">
            <!-- Membrete y Folio Oficial -->
            <div class="comunicado-doc-header">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <span class="comunicado-badge-oficial">
                  <i class="fa fa-bullhorn me-1"></i> Comunicado Oficial SELOASA
                </span>
                ${showFolio && folioText ? `
                <span class="comunicado-folio-box">
                  ${folioText}
                </span>
                ` : ''}
              </div>
              <h6 class="text-uppercase about-kicker mb-2" style="color: #e43b14;">
                ${post.dept || 'Dirección General & Aseguramiento de Calidad'}
              </h6>
              <h1 class="comunicado-doc-title">
                ${post.title}
              </h1>
              <div class="comunicado-meta-bar">
                <span><i class="far fa-calendar-alt text-primary me-1"></i> <strong>Fecha de Emisión:</strong> ${post.date}</span>
                <span><i class="far fa-clock text-primary me-1"></i> ${formatReadTime(post.read_time, '3 min')} de lectura</span>
                <span><i class="fa fa-shield-alt text-primary me-1"></i> Validez Institucional 2026</span>
              </div>
            </div>

            <!-- Media Enmarcada (Foto o Video) -->
            ${renderDetailMediaHtml(post, 'comunicado')}

            <!-- Recuadro de Resolución / Disposición Ejecutiva -->
            <div class="comunicado-resolucion-box">
              <div class="comunicado-resolucion-label">
                <i class="fa fa-file-alt me-1"></i> Resumen Ejecutivo de la Disposición:
              </div>
              <p class="comunicado-resolucion-text">${post.summary}</p>
            </div>

            <!-- Cuerpo del Comunicado -->
            <div class="comunicado-body-text">
              ${post.content || `<p>${post.summary}</p>`}
            </div>

            <!-- Bloque de Firma y Autorización Oficial (Opcional) -->
            ${showFirma ? `
            <div class="comunicado-firma-seccion">
              <div>
                <div class="comunicado-firma-autoridad">${post.firma_autoridad || 'Comité de Aseguramiento de Calidad y Tráfico'}</div>
                <div class="comunicado-firma-sub">${post.firma_sub || 'Servicios Logísticos Alsera S.A. de C.V. &bull; Lerma, Estado de México'}</div>
              </div>
              <div>
                <span class="badge bg-light text-dark border px-3 py-2 rounded-pill small">
                  <i class="fa fa-check-circle text-primary me-1"></i> ${post.firma_badge || 'Revisado y Aprobado'}
                </span>
              </div>
            </div>
            ` : ''}

            <!-- Acciones Inferiores -->
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 pt-4 border-top mt-4">
              <a href="blog/" class="btn btn-outline-dark rounded-pill px-4 fw-bold">
                <i class="fa fa-arrow-left me-2"></i> Ver todas las publicaciones
              </a>
              <button type="button" class="btn btn-primary rounded-pill px-4 fw-bold btn-copy-article">
                <i class="fa fa-link me-1"></i> Copiar enlace oficial
              </button>
            </div>
          </article>
        </div>

        <!-- Sidebar Comunicado -->
        <div class="col-lg-4">
          <div style="position: sticky; top: 110px;">
            ${pdfCardHtml}
            ${normativaCardHtml}

            <!-- Otros Comunicados -->
            <div class="comunicado-sidebar-card">
              <h5 class="fw-bold mb-3 text-dark"><i class="fa fa-folder-open text-primary me-2"></i> Otras Publicaciones</h5>
              <div id="articleSidebarRecs" class="d-flex flex-column gap-2"></div>
            </div>
          </div>
        </div>
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

  /* ==========================================================================
     ESTRUCTURA 2: NOTICIA OPERATIVA (HERO PANORÁMICO CON MÉTRICAS & MEDIA SPLIT)
     ========================================================================== */
  function renderEstructuraNoticia(post, content) {
    return `
      <!-- Hero Panorámico de la Noticia (Foto o Video) -->
      ${renderDetailMediaHtml(post, 'noticia')}

      <!-- Fila de Métricas Operativas de la Noticia -->
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

      <!-- Layout 2 Columnas de la Noticia -->
      <div class="row g-4 g-lg-5">
        <div class="col-lg-8">
          <div class="noticia-main-card">
            <!-- Título y Encabezado Periodístico -->
            <div class="mb-3">
              <h6 class="text-uppercase about-kicker mb-2" style="color: #e43b14;">
                ${post.dept || 'Gerencia de Tráfico y Monitoreo'}
              </h6>
              <h1 class="about-title mb-3" style="font-size: 2.1rem; line-height: 1.25;">
                ${post.title}
              </h1>
              <div class="d-flex align-items-center gap-3 text-muted small py-2 border-top border-bottom flex-wrap">
                <span><i class="far fa-calendar-alt text-primary me-1"></i> ${post.date}</span>
                <span><i class="far fa-clock text-primary me-1"></i> ${formatReadTime(post.read_time, '2 min')} de lectura</span>
                <span><i class="fa fa-map-marker-alt text-primary me-1"></i> Cobertura Nacional</span>
              </div>
            </div>

            <!-- Resumen Noticioso -->
            <p class="lead fw-semibold text-dark mb-4" style="font-size: 1.1rem; line-height: 1.6;">
              ${post.summary}
            </p>

            <!-- Cuerpo de la Noticia -->
            <div class="comunicado-body-text mb-4">
              ${post.content || `<p>${post.summary}</p>`}
            </div>

            <!-- Ficha Técnica de Infraestructura -->
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

            <!-- Botones Inferiores -->
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 pt-4 border-top mt-4">
              <a href="blog/" class="btn btn-outline-dark rounded-pill px-4 fw-bold">
                <i class="fa fa-arrow-left me-2"></i> Ver todas las publicaciones
              </a>
              <button type="button" class="btn btn-primary rounded-pill px-4 fw-bold btn-copy-article">
                <i class="fa fa-share-alt me-1"></i> Compartir noticia
              </button>
            </div>
          </div>
        </div>

        <!-- Sidebar Noticia -->
        <div class="col-lg-4">
          <div style="position: sticky; top: 110px;">
            <!-- Tarjeta de Flete Operativo -->
            <div class="comunicado-sidebar-card" style="background-color: #222222; color: #ffffff; border-color: #222222;">
              <h5 class="fw-bold text-white mb-2"><i class="fa fa-truck-moving text-primary me-2"></i> Capacidad de Transporte</h5>
              <p class="small text-light mb-3" style="color: #cbd5e1 !important;">¿Requieres unidades dedicadas refrigeradas o secas para tu operación farmacéutica?</p>
              <a href="contact/" class="btn btn-primary fw-bold rounded-pill w-100 py-2">
                Solicitar cotización de ruta &rarr;
              </a>
            </div>

            <!-- Otras Noticias -->
            <div class="comunicado-sidebar-card">
              <h5 class="fw-bold mb-3 text-dark"><i class="fa fa-newspaper text-primary me-2"></i> Otras Noticias</h5>
              <div id="articleSidebarRecs" class="d-flex flex-column gap-2"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     ESTRUCTURA 3: BLOG FARMA (LECTURA EDITORIAL CENTRADA CON PUNTOS CLAVE & INFOGRAFÍA)
     ========================================================================== */
  function renderEstructuraBlog(post, content) {
    return `
      <div class="blog-reading-container">
        <article class="blog-editorial-card">
          
          <!-- Barra de Autor y Metadatos de Lectura -->
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

          <!-- Título y Kicker -->
          <h1 class="about-title mb-3" style="font-size: 2.2rem; line-height: 1.25;">
            ${post.title}
          </h1>

          <!-- Caja de Puntos Clave (Key Takeaways) al inicio -->
          <div class="blog-key-takeaways-card">
            <div class="blog-takeaways-heading">
              <i class="fa fa-check-circle"></i> Puntos Clave de la Lectura:
            </div>
            <div class="blog-takeaway-row">
              <i class="fa fa-chevron-right"></i>
              <div><strong>Pre-enfriamiento obligatorio:</strong> Las cajas frigoríficas deben estabilizarse a la temperatura de consigna antes del estibado.</div>
            </div>
            <div class="blog-takeaway-row">
              <i class="fa fa-chevron-right"></i>
              <div><strong>Circulación continua de aire:</strong> Es vital respetar los ductos de retorno para evitar puntos calientes o sobreenfriamiento.</div>
            </div>
            <div class="blog-takeaway-row">
              <i class="fa fa-chevron-right"></i>
              <div><strong>Inalterabilidad de evidencias:</strong> Cada registro de temperatura debe ser trazable y contrastable con data-loggers independientes para COFEPRIS.</div>
            </div>
          </div>

          <!-- Media Editorial (Foto o Video) -->
          ${renderDetailMediaHtml(post, 'blog')}

          <!-- Lead Summary -->
          <p class="lead fw-bold text-dark mb-4" style="line-height: 1.65; font-size: 1.15rem;">
            ${post.summary}
          </p>

          <!-- Cuerpo del Artículo -->
          <div class="comunicado-body-text">
            ${post.content || `<p>${post.summary}</p>`}
          </div>

          <!-- Cita Destacada (Pull-Quote Institucional) -->
          <div class="blog-pull-quote">
            «En el transporte farmacéutico, cada grado cuenta. Nuestra meta es ofrecer certeza documental y estabilidad térmica inquebrantable en cada kilómetro recorrido.»
          </div>

          <!-- Infografía de Rangos Térmicos -->
          <div class="blog-thermal-infobox">
            <div class="blog-thermal-pill">
              <div class="blog-thermal-deg">2°C a 8°C</div>
              <div class="small fw-bold text-dark">Medicamentos Biológicos y Vacunas</div>
            </div>
            <div class="blog-thermal-pill">
              <div class="blog-thermal-deg">15°C a 25°C</div>
              <div class="small fw-bold text-dark">Medicamentos Secos Farma</div>
            </div>
            <div class="blog-thermal-pill">
              <div class="blog-thermal-deg">±0.5°C</div>
              <div class="small fw-bold text-dark">Tolerancia Máxima en Excursión</div>
            </div>
          </div>

          <!-- Ficha de Biografía del Autor / Comité -->
          <div class="blog-author-bio-footer">
            <div class="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0" style="width: 50px; height: 50px;">
              <i class="fa fa-shield-alt text-primary"></i>
            </div>
            <div>
              <div class="fw-bold text-dark">Comité de Aseguramiento de Calidad Farma & Validación</div>
              <div class="text-muted small">Especialistas en Buenas Prácticas de Almacenaje y Distribución Farmacéutica en SELOASA S.A. de C.V.</div>
            </div>
          </div>

          <!-- Acciones Inferiores -->
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 pt-4 border-top mt-4">
            <a href="blog/" class="btn btn-outline-dark rounded-pill px-4 fw-bold">
              <i class="fa fa-arrow-left me-2"></i> Ver todas las publicaciones
            </a>
            <button type="button" class="btn btn-primary rounded-pill px-4 fw-bold btn-copy-article">
              <i class="fa fa-bookmark me-1"></i> Compartir artículo
            </button>
          </div>
        </article>

        <!-- Sección Inferior de Artículos Recomendados en 3 Columnas -->
        <div class="mt-5 pt-3">
          <div class="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
            <h4 class="fw-bold text-dark mb-0"><i class="fa fa-book-reader text-primary me-2"></i> Otras Lecturas de Especialidad</h4>
            <a href="blog/" class="small text-primary text-decoration-none fw-bold">Ver todo el catálogo &rarr;</a>
          </div>
          <div id="articleSidebarRecs" class="row g-3"></div>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     RENDERIZADOR PRINCIPAL: DETECCIÓN Y MONTAJE SEGÚN EL TIPO DE PUBLICACIÓN
     ========================================================================== */
  function renderArticle(lang) {
    const activeLang = normalizeLang(lang || getCurrentLang());
    const content = getBlogContent(activeLang);
    const postId = getPostIdFromUrl();

    function renderPostObject(post, allContent) {
      if (!post) return;
      const localizedPost = getLocalizedPost(post, activeLang);

      const pageTitle = document.getElementById('articlePageTitle');
      const metaDesc = document.getElementById('articleMetaDesc');
      if (pageTitle) pageTitle.textContent = `${localizedPost.title} | SELOASA`;
      if (metaDesc && localizedPost.summary) metaDesc.setAttribute('content', localizedPost.summary);

      let canonicalEl = document.querySelector('link[rel="canonical"]');
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute('href', `https://seloasa.com.mx/blog/${encodeURIComponent(localizedPost.id)}`);

      // Reflejar la URL limpia en la barra de direcciones sin recargar la página
      if (window.history && window.history.replaceState && localizedPost && localizedPost.id) {
        try {
          const isShipping = window.location.pathname.includes('/shipping/');
          const prettyPath = (isShipping ? '/shipping/blog/' : '/blog/') + encodeURIComponent(localizedPost.id);
          if (window.location.pathname !== prettyPath) {
            window.history.replaceState({ id: localizedPost.id }, `${localizedPost.title} | SELOASA`, prettyPath);
          }
        } catch (e) {
          // Entornos locales o file:// donde replaceState pueda restringirse
        }
      }

      const host = document.getElementById('articleRenderHost');
      if (!host) return;

      // SEGÚN EL TIPO, MONTAMOS LA ESTRUCTURA CORRESPONDIENTE
      let renderedHtml = '';
      if (localizedPost.type === 'comunicado') {
        renderedHtml = renderEstructuraComunicado(localizedPost, allContent);
      } else if (localizedPost.type === 'noticia') {
        renderedHtml = renderEstructuraNoticia(localizedPost, allContent);
      } else {
        renderedHtml = renderEstructuraBlog(localizedPost, allContent);
      }

      host.innerHTML = renderedHtml;
      renderRecommendations(allContent, localizedPost.id, localizedPost.type, activeLang);
      initCopyAction(localizedPost.id);
    }

    if (content) {
      const initialPost = findPost(content, postId);
      if (initialPost) renderPostObject(initialPost, content);
    }

    // Consultar API de almacenamiento JSON
    fetch('php/noticias_api.php?id=' + encodeURIComponent(postId))
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.item) {
          const dbPost = data.item;
          // Traer lista de publicados para las recomendaciones
          fetch('php/noticias_api.php?status=published')
            .then(r => r.json())
            .then(listData => {
              const items = (listData && listData.items) ? listData.items : [];
              const dynContent = {
                latest: { items: items.filter(it => it.id !== dbPost.id) },
                featured: items.find(it => it.is_featured || it.id === 'featured') || dbPost
              };
              renderPostObject(dbPost, dynContent);
            })
            .catch(() => renderPostObject(dbPost, content));
        }
      })
      .catch(err => console.warn('Fetch noticia individual storage error en blog-detail:', err));
  }

  function renderRecommendations(content, currentId, postType, lang) {
    const container = document.getElementById('articleSidebarRecs');
    if (!container || !content) return;
    const activeLang = normalizeLang(lang || getCurrentLang());

    let items = [];
    if (content.latest && Array.isArray(content.latest.items)) {
      items = content.latest.items.filter(item => item.id !== currentId);
    }

    if (currentId !== 'featured' && content.featured) {
      items.unshift({ ...content.featured, id: 'featured' });
    }

    const recommendations = items.slice(0, 3).map(it => getLocalizedPost(it, activeLang));

    // Si es tipo blog, renderizamos en columnas de 3 (grid inferior)
    if (postType === 'blog') {
      container.innerHTML = recommendations.map(item => {
        const itemUrl = `blog/articulo.html?id=${encodeURIComponent(item.id || '')}`;
        const itemMedia = parseMediaSource(item);
        const itemThumbHtml = (itemMedia.type === 'video' && !itemMedia.thumbnailUrl)
          ? `<video src="${itemMedia.src}" class="card-img-top w-100" style="height: 140px; object-fit: cover;" muted playsinline preload="metadata"></video>`
          : `<img src="${itemMedia.thumbnailUrl || itemMedia.src || 'img/feature.jpg'}" alt="" class="card-img-top w-100" style="height: 140px; object-fit: cover;" loading="lazy">`;

        return `
          <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm rounded-3 overflow-hidden">
              <a href="${itemUrl}">
                ${itemThumbHtml}
              </a>
              <div class="card-body p-3 d-flex flex-column">
                <span class="badge bg-light text-dark border mb-1 align-self-start small" style="font-size: 0.7rem;">${item.category || 'SELOASA'}</span>
                <h6 class="small fw-bold mb-1">
                  <a href="${itemUrl}" class="text-dark text-decoration-none hover-primary">
                    ${item.title}
                  </a>
                </h6>
                <div class="text-muted mt-auto pt-2" style="font-size: 0.72rem;">
                  <i class="far fa-calendar-alt text-primary me-1"></i> ${item.date}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      // Si es comunicado o noticia, renderizamos formato lista en sidebar
      container.innerHTML = recommendations.map(item => {
        const itemUrl = `blog/articulo.html?id=${encodeURIComponent(item.id || '')}`;
        const itemMedia = parseMediaSource(item);
        const itemThumbHtml = (itemMedia.type === 'video' && !itemMedia.thumbnailUrl)
          ? `<video src="${itemMedia.src}" class="sidebar-rec-img" style="object-fit: cover;" muted playsinline preload="metadata"></video>`
          : `<img src="${itemMedia.thumbnailUrl || itemMedia.src || 'img/feature.jpg'}" alt="" class="sidebar-rec-img" loading="lazy">`;

        return `
          <a href="${itemUrl}" class="sidebar-rec-item">
            ${itemThumbHtml}
            <div class="overflow-hidden">
              <div class="small text-muted" style="font-size: 0.7rem;">${item.category || 'SELOASA'}</div>
              <h6 class="sidebar-rec-title text-truncate-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${item.title}</h6>
              <span class="text-muted" style="font-size: 0.72rem;"><i class="far fa-calendar-alt text-primary me-1"></i>${item.date}</span>
            </div>
          </a>
        `;
      }).join('');
    }
  }

  function initCopyAction(currentPostId) {
    document.querySelectorAll('.btn-copy-article').forEach(btn => {
      btn.addEventListener('click', function () {
        const targetId = currentPostId || getPostIdFromUrl();
        const baseOrigin = window.location.origin;
        const prefix = window.location.pathname.includes('/shipping/') ? '/shipping/blog/' : '/blog/';
        const prettyUrl = `${baseOrigin}${prefix}${encodeURIComponent(targetId)}`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(prettyUrl).then(() => {
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fa fa-check me-1"></i> ¡Enlace copiado!';
            setTimeout(() => {
              btn.innerHTML = originalHtml;
            }, 2500);
          });
        } else {
          prompt('Copia este enlace:', prettyUrl);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderArticle(getCurrentLang());

    document.addEventListener('site-language-changed', function (e) {
      renderArticle(e.detail?.lang || getCurrentLang());
    });

    window.addEventListener('languageChanged', function (e) {
      renderArticle(e.detail?.language || getCurrentLang());
    });
  });
})();
