(function ($) {
    "use strict";

    function initCounterUp($elements, options) {
        if (!$.fn || typeof $.fn.counterUp !== 'function' || !$elements.length) {
            return;
        }

        $elements.counterUp(options);
    }

    function optimizeMediaLoading(root) {
        const scope = root || document;

        scope.querySelectorAll('img').forEach(function (image) {
            const isPriorityImage = image.dataset.priority === 'high';

            if (!image.hasAttribute('decoding')) {
                image.setAttribute('decoding', 'async');
            }

            if (!image.hasAttribute('loading')) {
                image.setAttribute('loading', isPriorityImage ? 'eager' : 'lazy');
            }

            if (isPriorityImage && !image.hasAttribute('fetchpriority')) {
                image.setAttribute('fetchpriority', 'high');
            }
        });

        scope.querySelectorAll('iframe').forEach(function (iframe) {
            if (!iframe.hasAttribute('loading')) {
                iframe.setAttribute('loading', 'lazy');
            }
        });
    }

    window.optimizeMediaLoading = optimizeMediaLoading;

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('/service-worker.js').catch(function () {
                // Ignore service worker registration failures.
            });
        });
    }

    // ——————————————————————————————————————————
    // Inyectar favicon dinámicamente
    // ——————————————————————————————————————————
    if (!document.querySelector('link[rel="icon"]')) {
        const link = document.createElement('link');
        link.rel   = 'icon';
        link.type  = 'image/png';
        link.sizes = '32x32';
        link.href  = 'img/favicon.png';
        document.head.appendChild(link);
    }

    // ——————————————————————————————————————————
    // Funciones globales para inicializar Spinner y Carousels
    // ——————————————————————————————————————————
    // Remueve el spinner si existe
    window.initSpinner = function () {
        setTimeout(function () {
            const spinnerEl = $('#spinner');
            if (spinnerEl.length > 0) {
                spinnerEl.removeClass('show');
            }
        }, 1);
    };

    $('#farmaCarousel').owlCarousel({
    loop: true,
    margin: 10,
    autoplay: true,
    autoplayTimeout: 3000,
    nav: true,
    navText: [
      '<i class="bi bi-chevron-left"></i>',
      '<i class="bi bi-chevron-right"></i>'
    ],
    dots: true,
    responsive: {0:{items:1},600:{items:1},1000:{items:1}}
    });

    initCounterUp($('.counter'), {
        delay: 10,
        time: 1000
    });

    // Inicializa todos los carousels (header y testimonial)
    window.initCarousels = function () {
        // Header carousel
        $(".header-carousel").owlCarousel({
            autoplay: true,
            autoplayTimeout: 5500,
            autoplayHoverPause: true,
            smartSpeed: 1200,
            items: 1,
            dots: true,
            loop: true,
            nav: true,
            navText: [
                '<i class="bi bi-chevron-left"></i>',
                '<i class="bi bi-chevron-right"></i>'
            ],
            animateOut: "fadeOut"
        });

        // Testimonials carousel
        $(".testimonial-carousel").owlCarousel({
            autoplay: false,
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
    };

    // Ejecutar spinner y carousels en cuanto cargue main.js
    initSpinner();
    initCarousels();
    optimizeMediaLoading(document);

    // ——————————————————————————————————————————
    // Spinner (si no viene de partial)
    // ——————————————————————————————————————————
    var spinner = function () {
        setTimeout(function () {
            const sp = $('#spinner');
            if (sp.length > 0) {
                sp.removeClass('show');
            }
        }, 1);
    };
    spinner();

    // ——————————————————————————————————————————
    // Iniciar WOW.js
    // ——————————————————————————————————————————
    new WOW().init();

    // ——————————————————————————————————————————
    // Sticky Navbar
    // ——————————————————————————————————————————
    const fleetSelector = document.getElementById('fleetSelector');
    if (fleetSelector) {
        const fleetButtons = fleetSelector.querySelectorAll('.fleet-option');
        const fleetSection = fleetSelector.closest('.service-detail-panel');
        const fleetTitle = document.getElementById('fleetDetailTitle');
        const fleetSubtitle = document.getElementById('fleetDetailSubtitle');
        const fleetDescription = document.getElementById('fleetDetailDescription');
        const fleetMedia = document.querySelector('.fleet-detail-media');
        const fleetModel = document.getElementById('fleetDetailModel');
        const fleetLoader = document.getElementById('fleetDetailLoader');
        const fleetImage = document.getElementById('fleetDetailImage');
        const fleetSpec1 = document.getElementById('fleetSpec1');
        const fleetSpec2 = document.getElementById('fleetSpec2');
        const fleetSpec3 = document.getElementById('fleetSpec3');
        let fleetModelToken = 0;
        let hasInitializedFleetModel = false;
        const fleetModelPreloadCache = new Map();
        const fleetModelPersistentCacheName = 'fleet-models-v1';

        const normalizeFleetAssetPath = (path) => (path || '').replace(/\\/g, '/');
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const isSlowConnection = () => Boolean(connection && /(^|slow-)(2g|3g)$/i.test(connection.effectiveType || ''));
        const shouldUseLiteFleetModel = () => {
            const isCompactViewport = window.matchMedia('(max-width: 991.98px)').matches;
            return Boolean((connection && connection.saveData) || isSlowConnection() || isCompactViewport);
        };
        const getFleetModelSource = (button) => {
            if (!button) {
                return '';
            }

            const preferredModel = shouldUseLiteFleetModel() ? (button.dataset.modelMobile || button.dataset.model) : button.dataset.model;
            return normalizeFleetAssetPath(preferredModel || '');
        };

        const getPersistentFleetResponse = async (url) => {
            if (!('caches' in window)) {
                return null;
            }

            try {
                const cache = await caches.open(fleetModelPersistentCacheName);
                const cachedResponse = await cache.match(url);
                return cachedResponse || null;
            } catch (error) {
                return null;
            }
        };

        const storePersistentFleetResponse = async (url, response) => {
            if (!('caches' in window) || !response || !response.ok) {
                return;
            }

            try {
                const cache = await caches.open(fleetModelPersistentCacheName);
                await cache.put(url, response.clone());
            } catch (error) {
                // Ignore cache write failures and keep the network result.
            }
        };

        const primeFleetModel = (rawUrl) => {
            const url = normalizeFleetAssetPath(rawUrl);

            if (!url || fleetModelPreloadCache.has(url)) {
                return fleetModelPreloadCache.get(url) || Promise.resolve(null);
            }

            const preloadPromise = getPersistentFleetResponse(url)
                .then((cachedResponse) => cachedResponse || fetch(url, {
                    credentials: 'same-origin'
                }).then((networkResponse) => {
                    storePersistentFleetResponse(url, networkResponse);
                    return networkResponse;
                }))
                .then((response) => {
                    if (!response || !response.ok) {
                        throw new Error('MODEL_PRELOAD_FAILED');
                    }

                    return response.blob();
                })
                .then((blob) => {
                    const blobUrl = URL.createObjectURL(blob);
                    return {
                        blobUrl,
                        originalUrl: url
                    };
                })
                .catch(() => null);

            fleetModelPreloadCache.set(url, preloadPromise);
            return preloadPromise;
        };

        const warmFleetModels = () => {
            const uniqueModelUrls = Array.from(new Set(Array.from(fleetButtons)
                .flatMap((button) => {
                    const urls = [getFleetModelSource(button)];

                    if (!shouldUseLiteFleetModel() && button.dataset.modelMobile) {
                        urls.push(normalizeFleetAssetPath(button.dataset.modelMobile));
                    }

                    return urls;
                })
                .filter(Boolean)));

            if (!uniqueModelUrls.length) {
                return;
            }

            const warmServiceWorkerModelCache = (urls) => {
                if (!('serviceWorker' in navigator)) {
                    return;
                }

                navigator.serviceWorker.ready
                    .then((registration) => {
                        if (!registration.active) {
                            return;
                        }

                        registration.active.postMessage({
                            type: 'CACHE_FLEET_MODELS',
                            urls
                        });
                    })
                    .catch(() => {
                        // Ignore service worker warm-up failures.
                    });
            };

            const activeButton = fleetSelector.querySelector('.fleet-option.is-active') || fleetButtons[0];
            const activeUrl = getFleetModelSource(activeButton);
            const remainingUrls = uniqueModelUrls.filter((url) => url !== activeUrl);

            if (activeUrl) {
                primeFleetModel(activeUrl);
                warmServiceWorkerModelCache([activeUrl]);
            }

            const isCompactViewport = window.matchMedia('(max-width: 991.98px)').matches;
            const isNgrokHost = /ngrok/i.test(window.location.hostname || '');

            if ((connection && connection.saveData) || isSlowConnection() || isCompactViewport || isNgrokHost) {
                return;
            }

            const warmRemaining = () => {
                remainingUrls.reduce((queue, url) => {
                    return queue
                        .then(() => primeFleetModel(url))
                        .catch(() => null)
                        .then(() => new Promise((resolve) => {
                            window.setTimeout(resolve, 250);
                        }));
                }, Promise.resolve());
            };

            primeFleetModel(activeUrl).finally(() => {
                warmServiceWorkerModelCache(remainingUrls);

                if ('requestIdleCallback' in window) {
                    window.requestIdleCallback(warmRemaining, { timeout: 2200 });
                    return;
                }

                window.setTimeout(warmRemaining, 1600);
            });
        };

        const setFleetLoadingState = (isLoading) => {
            if (fleetMedia) {
                fleetMedia.classList.toggle('is-loading', Boolean(isLoading));
                fleetMedia.setAttribute('aria-busy', isLoading ? 'true' : 'false');
            }

            if (fleetLoader) {
                fleetLoader.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
            }
        };

        const resetFleetVisual = () => {
            fleetModelToken += 1;
            setFleetLoadingState(false);
            if (fleetMedia) {
                fleetMedia.classList.remove('is-static-image');
            }

            if (!fleetModel) return;

            fleetModel.classList.remove('is-visible');
            fleetModel.setAttribute('aria-hidden', 'true');
            fleetModel.removeAttribute('src');

            if (fleetModel._onLoad) {
                fleetModel.removeEventListener('load', fleetModel._onLoad);
            }

            if (fleetModel._onError) {
                fleetModel.removeEventListener('error', fleetModel._onError);
            }

            fleetModel._onLoad = null;
            fleetModel._onError = null;
        };

        const updateFleetVisual = (button) => {
            const imageSrc = button.dataset.image || '';
            const imageAlt = button.dataset.alt || '';
            const modelSrc = getFleetModelSource(button);
            const has3dModel = Boolean(modelSrc);
            const hasStaticImage = Boolean(imageSrc) && !has3dModel;

            if (!fleetModel) return;

            resetFleetVisual();

            if (hasStaticImage) {
                if (fleetMedia) {
                    fleetMedia.classList.add('is-static-image');
                }
                fleetImage.src = imageSrc;
                fleetImage.alt = imageAlt;
                fleetImage.classList.remove('is-hidden');
            } else {
                fleetImage.removeAttribute('src');
                fleetImage.alt = '';
                fleetImage.classList.add('is-hidden');
            }

            fleetModel.alt = imageAlt;

            if (!has3dModel) {
                return;
            }

            const token = fleetModelToken;
            setFleetLoadingState(true);

            fleetModel._onLoad = () => {
                if (token !== fleetModelToken) return;
                setFleetLoadingState(false);
                fleetModel.setAttribute('aria-hidden', 'false');
                fleetModel.classList.add('is-visible');
            };

            fleetModel._onError = () => {
                if (token !== fleetModelToken) return;
                setFleetLoadingState(false);
                fleetModel.classList.remove('is-visible');
                fleetModel.setAttribute('aria-hidden', 'true');
                fleetImage.classList.add('is-hidden');
            };

            fleetModel.addEventListener('load', fleetModel._onLoad, { once: true });
            fleetModel.addEventListener('error', fleetModel._onError, { once: true });
            const normalizedModelSrc = normalizeFleetAssetPath(modelSrc);

            primeFleetModel(normalizedModelSrc).then((cachedModel) => {
                if (token !== fleetModelToken) return;
                fleetModel.setAttribute('src', (cachedModel && cachedModel.blobUrl) || normalizedModelSrc);
            });
        };

        fleetButtons.forEach((button) => {
            button.addEventListener('click', () => {
                hasInitializedFleetModel = true;
                fleetButtons.forEach((item) => item.classList.remove('is-active'));
                button.classList.add('is-active');

                fleetTitle.textContent = button.dataset.title || '';
                fleetSubtitle.innerHTML = button.dataset.subtitle || '';
                fleetDescription.innerHTML = button.dataset.description || '';
                updateFleetVisual(button);
                fleetSpec1.innerHTML = button.dataset.spec1 || '';
                fleetSpec2.innerHTML = button.dataset.spec2 || '';
                fleetSpec3.innerHTML = button.dataset.spec3 || '';
            });
        });

        const activeFleetButton = fleetSelector.querySelector('.fleet-option.is-active') || fleetButtons[0];
        const initializeFleetModels = () => {
            if (hasInitializedFleetModel || !activeFleetButton) {
                return;
            }

            warmFleetModels();
            activeFleetButton.click();
        };

        if (shouldUseLiteFleetModel() && 'IntersectionObserver' in window && fleetSection) {
            const fleetObserver = new IntersectionObserver((entries, observer) => {
                const visibleEntry = entries.find((entry) => entry.isIntersecting);
                if (!visibleEntry) {
                    return;
                }

                initializeFleetModels();
                observer.disconnect();
            }, {
                rootMargin: '220px 0px'
            });

            fleetObserver.observe(fleetSection);
        } else {
            initializeFleetModels();
        }
    }

    $('.sticky-top').css('top', '0px');

    // ——————————————————————————————————————————
    // Dropdown on mouse hover
    // ——————————————————————————————————————————
    const $dropdown       = $(".dropdown");
    const $dropdownToggle = $(".dropdown-toggle");
    const $dropdownMenu   = $(".dropdown-menu");
    const showClass       = "show";

    $(window).on("load resize", function() {
        if (this.matchMedia("(min-width: 992px)").matches) {
            $dropdown.hover(
                function() {
                    const $this = $(this);
                    $this.addClass(showClass);
                    $this.find($dropdownToggle).attr("aria-expanded", "true");
                    $this.find($dropdownMenu).addClass(showClass);
                },
                function() {
                    const $this = $(this);
                    $this.removeClass(showClass);
                    $this.find($dropdownToggle).attr("aria-expanded", "false");
                    $this.find($dropdownMenu).removeClass(showClass);
                }
            );
        } else {
            $dropdown.off("mouseenter mouseleave");
        }
    });

    $('#cajaCarousel').owlCarousel({
        loop: true,
        margin: 10,
        autoplay: true,
        autoplayTimeout: 3000,
        nav: true,
        navText: [
            '<i class="bi bi-chevron-left"></i>',
            '<i class="bi bi-chevron-right"></i>'
        ],
        dots: true,
        items: 1
    });

    $('#valoresCarousel').owlCarousel({
    loop: true,
    margin: 20,
    nav: true,
    slideBy: 'page',
    navText: [
      '<i class="bi bi-chevron-left"></i>',
      '<i class="bi bi-chevron-right"></i>'
    ],
    dots: true,
    autoplay: true,
    autoplayTimeout: 4000,
    responsive:{
      0:   { items: 1 },
      576: { items: 2 },
      992: { items: 3 },
      1200:{ items: 4 }
    }
  });

    // ——————————————————————————————————————————
    // Back to top button
    // ——————————————————————————————————————————
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        return false;
    });

    // ——————————————————————————————————————————
    // Facts counter
    // ——————————————————————————————————————————
    initCounterUp($('[data-toggle="counter-up"]'), {
        delay: 10,
        time: 2000
    });

})(jQuery);
