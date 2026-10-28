/**
 * SELOASA - Integración Dinámica de Testimonios y Logos de Clientes en Home
 * Carga los testimonios y logos de clientes desde php/testimonios_api.php
 * sincronizados por el panel de administración.
 */
(function () {
  'use strict';

  function normalizeLang(lang) {
    if (!lang) return 'es';
    const value = String(lang).toLowerCase();
    if (value === 'de') return 'al';
    return ['es', 'en', 'al', 'pt', 'fr'].includes(value) ? value : 'es';
  }

  function getCurrentLang() {
    return normalizeLang(localStorage.getItem('site-language') || document.documentElement.lang || 'es');
  }

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

  let cachedTestimonials = [];

  function renderTestimonials(items) {
    const section = document.getElementById('home-testimonials');
    const carouselEl = document.querySelector('#home-testimonials .testimonial-carousel');
    if (!section || !carouselEl) return;

    const published = (Array.isArray(items) ? items : []).filter(t => (t.status || 'published') === 'published');

    if (published.length === 0) {
      section.classList.add('d-none');
      return;
    }

    section.classList.remove('d-none');

    const slidesHtml = published.map((item) => {
      const company = item.company || item.client_name || '';
      const logo = item.logo || item.logo_url || 'img/logos/RALCA.png';
      const role = item.role || item.client_role || '';

      return `
        <div class="testimonial-item p-4 my-3">
          <div class="testimonial-meta mb-0 d-flex align-items-center gap-3">
            <img class="img-fluid flex-shrink-0 testimonial-logo" src="${logo}" alt="${company}" loading="lazy" decoding="async">
            <div class="testimonial-copy">
              <h5 class="testimonial-company mb-1">${company}</h5>
              ${role ? `<p class="testimonial-role mb-0">${role}</p>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.jQuery && typeof window.jQuery.fn.owlCarousel === 'function') {
      const $carousel = window.jQuery(carouselEl);

      if ($carousel.hasClass('owl-loaded')) {
        $carousel.trigger('destroy.owl.carousel');
        $carousel.removeClass('owl-loaded owl-drag');
        $carousel.find('.owl-stage-outer').children().unwrap();
      }

      $carousel.html(slidesHtml);

      $carousel.owlCarousel({
        autoplay: true,
        autoplayTimeout: 4000,
        autoplayHoverPause: true,
        smartSpeed: 1000,
        center: true,
        dots: true,
        loop: true,
        responsive: {
          0:   { items: 1 },
          768: { items: 2 },
          992: { items: 3 }
        }
      });
    } else {
      carouselEl.innerHTML = slidesHtml;
    }
  }

  function initHomeTestimonials() {
    // 1. Carga inmediata desde localStorage
    try {
      const stored = localStorage.getItem('seloasa_testimonials');
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedTestimonials = parsed;
          renderTestimonials(cachedTestimonials);
        }
      }
    } catch (e) {
      console.warn('Error leyendo testimonios locales:', e);
    }

    // 2. Consulta al backend
    const apiUrl = getBackendApiUrl('php/testimonios_api.php?status=published');
    fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    })
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(data => {
        if (data && data.success && Array.isArray(data.items)) {
          cachedTestimonials = data.items;
          renderTestimonials(cachedTestimonials);
          try {
            localStorage.setItem('seloasa_testimonials', JSON.stringify(data.items));
          } catch (_) {}
        }
      })
      .catch(err => {
        console.warn('No se pudo sincronizar testimonios_api en home:', err);
      });
  }

  document.addEventListener('DOMContentLoaded', initHomeTestimonials);

  document.addEventListener('site-language-changed', function () {
    if (cachedTestimonials.length > 0) {
      renderTestimonials(cachedTestimonials);
    }
  });
})();
