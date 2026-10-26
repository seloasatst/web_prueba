/**
 * SELOASA - Módulo de Analítica y Rastreo de Conversiones (Google Analytics 4 & SEO)
 * Gestiona la inicialización de Google Analytics (GA4), eventos de conversión y soporte para Search Console.
 */

(function () {
    'use strict';

    // Estado global de analítica
    window.SELOASA_ANALYTICS = window.SELOASA_ANALYTICS || {
        initialized: false,
        measurementId: null,
        debug: false
    };

    /**
     * Obtiene el ID de medición configurado (desde .env / php/seo_config.php o fallback global)
     */
    function getMeasurementId() {
        if (window.SELOASA_SEO && window.SELOASA_SEO.gaMeasurementId) {
            return window.SELOASA_SEO.gaMeasurementId;
        }
        if (window.SELOASA_GA_ID) {
            return window.SELOASA_GA_ID;
        }
        return 'G-XXXXXXXXXX';
    }

    /**
     * Obtiene el código de verificación de Google Search Console
     */
    function getGscVerificationCode() {
        if (window.SELOASA_SEO && window.SELOASA_SEO.gscVerificationCode) {
            return window.SELOASA_SEO.gscVerificationCode;
        }
        if (window.SELOASA_GSC_CODE) {
            return window.SELOASA_GSC_CODE;
        }
        return '';
    }

    /**
     * Inicializa Google Analytics 4 (gtag.js)
     */
    function initGoogleAnalytics() {
        var gaId = getMeasurementId();
        window.SELOASA_ANALYTICS.measurementId = gaId;

        // Comprobar si es un ID válido y no el placeholder
        var isValidId = gaId && gaId.indexOf('G-') === 0 && gaId !== 'G-XXXXXXXXXX';

        // Inicializar dataLayer y función gtag
        window.dataLayer = window.dataLayer || [];
        if (typeof window.gtag !== 'function') {
            window.gtag = function () {
                window.dataLayer.push(arguments);
            };
            window.gtag('js', new Date());
        }

        if (isValidId) {
            // Inyectar script oficial de Google Tag si no existe aún en el DOM
            var scriptId = 'google-tag-manager-script';
            if (!document.getElementById(scriptId)) {
                var script = document.createElement('script');
                script.id = scriptId;
                script.async = true;
                script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
                document.head.appendChild(script);
            }

            // Configurar GA4
            window.gtag('config', gaId, {
                page_path: window.location.pathname + window.location.search,
                anonymize_ip: true,
                send_page_view: true
            });

            window.SELOASA_ANALYTICS.initialized = true;
            console.info('[SELOASA Analytics] Google Analytics 4 activo con ID: ' + gaId);
        } else {
            console.debug('[SELOASA Analytics] Modo listo para ID de producción (Actualmente: ' + gaId + '). Configura GA_MEASUREMENT_ID en tu archivo .env con tu ID G-XXXXXXXXXX.');
        }

        // Aplicar código de Google Search Console si está en .env y el meta tag existe
        var gscCode = getGscVerificationCode();
        if (gscCode) {
            var metaTag = document.querySelector('meta[name="google-site-verification"]');
            if (metaTag) {
                metaTag.setAttribute('content', gscCode);
            } else {
                metaTag = document.createElement('meta');
                metaTag.name = 'google-site-verification';
                metaTag.content = gscCode;
                document.head.appendChild(metaTag);
            }
        }
    }

    /**
     * Función global para registrar eventos personalizados en Google Analytics
     * @param {string} eventName - Nombre del evento (ej: 'click_whatsapp', 'postulacion_cv')
     * @param {Object} [params={}] - Parámetros adicionales del evento
     */
    window.seloasaTrackEvent = function (eventName, params) {
        params = params || {};
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, params);
        }
        if (window.SELOASA_ANALYTICS.debug) {
            console.log('[SELOASA TrackEvent]', eventName, params);
        }
    };

    /**
     * Rastreo automático de interacciones clave de usuario en el sitio
     */
    function setupAutoTracking() {
        document.addEventListener('click', function (e) {
            var target = e.target.closest('a, button');
            if (!target) return;

            var href = target.getAttribute('href') || '';
            var text = (target.innerText || target.getAttribute('title') || target.getAttribute('aria-label') || '').trim();

            // 1. Clics en WhatsApp
            if (href.indexOf('wa.me') !== -1 || href.indexOf('whatsapp.com') !== -1) {
                window.seloasaTrackEvent('click_whatsapp', {
                    event_category: 'Contacto Directo',
                    event_label: text || 'Botón WhatsApp',
                    link_url: href
                });
            }

            // 2. Clics en Enlaces Telefónicos
            if (href.indexOf('tel:') === 0) {
                window.seloasaTrackEvent('click_telefono', {
                    event_category: 'Contacto Telefónico',
                    event_label: href.replace('tel:', ''),
                    link_url: href
                });
            }

            // 3. Descarga de Archivos PDF (Circulares COFEPRIS, Fichas Técnicas, etc.)
            if (href.match(/\.pdf(\?|$)/i)) {
                var fileName = href.substring(href.lastIndexOf('/') + 1);
                window.seloasaTrackEvent('descarga_pdf', {
                    event_category: 'Descarga Documentos',
                    event_label: text || fileName,
                    file_name: fileName,
                    file_url: href
                });
            }

            // 4. Apertura del Modal de Postulación en Bolsa de Trabajo
            if (target.matches('[data-bs-target="#modalPostulacion"]') || target.classList.contains('btn-postular') || target.id === 'btnPostularseHeader') {
                var vacancyTitle = document.querySelector('#modalTituloVacante')?.innerText || text || 'Vacante General';
                window.seloasaTrackEvent('abrir_modal_postulacion', {
                    event_category: 'Bolsa de Trabajo',
                    event_label: vacancyTitle
                });
            }
        }, { passive: true });

        // 5. Rastreo de Envío de Formularios (Contacto y Cotización)
        document.addEventListener('submit', function (e) {
            var form = e.target;
            if (!form) return;

            var action = form.getAttribute('action') || '';
            var formId = form.id || form.className || 'formulario_sitio';

            if (formId === 'formPostulacion' || action.indexOf('postulaciones_api.php') !== -1) {
                var puesto = form.querySelector('[name="vacante_titulo"]')?.value || 'Vacante';
                window.seloasaTrackEvent('postulacion_cv_enviada', {
                    event_category: 'Bolsa de Trabajo',
                    event_label: puesto
                });
            } else if (action.indexOf('send_email.php') !== -1 || formId.indexOf('contact') !== -1 || formId.indexOf('quote') !== -1) {
                window.seloasaTrackEvent('envio_formulario_contacto', {
                    event_category: 'Clientes y Leads',
                    event_label: formId
                });
            }
        }, { passive: true });
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initGoogleAnalytics();
            setupAutoTracking();
        });
    } else {
        initGoogleAnalytics();
        setupAutoTracking();
    }
})();
