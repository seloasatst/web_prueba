(function ($) {
    "use strict";

    function initCounterUp($elements) {
        if (!$elements.length) return;

        const observerOptions = {
            threshold: 0.5
        };

        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const $el = $(entry.target);
                    const endValue = parseInt($el.text().replace(/,/g, ''));
                    const duration = 2000;
                    const startTime = performance.now();

                    const animateCounter = (currentTime) => {
                        const elapsedTime = currentTime - startTime;
                        const progress = Math.min(elapsedTime / duration, 1);
                        const currentValue = Math.floor(progress * endValue);
                        
                        $el.text(currentValue.toLocaleString());

                        if (progress < 1) {
                            requestAnimationFrame(animateCounter);
                        } else {
                            $el.text(endValue.toLocaleString());
                        }
                    };

                    requestAnimationFrame(animateCounter);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        $elements.each(function() {
            counterObserver.observe(this);
        });
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

    initCounterUp($('.counter'));

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

    // Parallax Effect
    $(window).scroll(function () {
        var scrolled = $(window).scrollTop();
        var windowHeight = $(window).height();
        
        $('.parallax-img').each(function() {
            var $this = $(this);
            var $parent = $this.parent();
            if ($parent.length) {
                var offset = $parent.offset().top;
                var height = $parent.height();
                
                // Check if element is in viewport
                if (scrolled + windowHeight > offset && scrolled < offset + height) {
                    var relativeScroll = (scrolled + windowHeight - offset) / (windowHeight + height);
                    // Move from -20px to 20px
                    var yPos = (relativeScroll - 0.5) * 40; 
                    $this.css('transform', 'translateY(' + yPos + 'px) scale(1.15)');
                }
            }
        });
    });

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
    // Sticky Navbar handling
    // ——————————————————————————————————————————
    $(window).scroll(function () {
        if ($(this).scrollTop() > 45) {
            $('.site-navbar').addClass('sticky-nav');
        } else {
            $('.site-navbar').removeClass('sticky-nav');
        }
    });

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

    const presenceHotspots = document.querySelectorAll('[data-presence-target]');
    const presenceGlobeElement = document.getElementById('presenceGlobe');
    if (presenceGlobeElement) {
        const presenceCards = document.querySelectorAll('[data-presence-card]');
        let presenceGlobeInstance = null;
        let presenceGlobeResizeFrame = null;
        const mexicoFocus = { lat: 23.6345, lng: -102.5528, altitude: 0.59 };

        if (typeof Globe === 'function') {

            const resizePresenceGlobe = () => {
                if (!presenceGlobeInstance) {
                    return;
                }

                const rect = presenceGlobeElement.getBoundingClientRect();
                presenceGlobeInstance
                    .width(Math.round(rect.width))
                    .height(Math.round(rect.height))
                    .pointOfView(mexicoFocus, 0);
            };

            presenceGlobeInstance = new Globe(presenceGlobeElement, {
                waitForGlobeReady: true,
                animateIn: true
            })
                .width(Math.round(presenceGlobeElement.getBoundingClientRect().width || 520))
                .height(Math.round(presenceGlobeElement.getBoundingClientRect().height || 520))
                .backgroundColor('rgba(0,0,0,0)')
                .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
                .showAtmosphere(true)
                .atmosphereColor('#ffffff')
                .atmosphereAltitude(0.13)
                .showGraticules(false)
                .pointOfView(mexicoFocus, 0);

            const presenceGlobeControls = presenceGlobeInstance.controls();
            presenceGlobeControls.enablePan = false;
            presenceGlobeControls.enableZoom = false;
            presenceGlobeControls.autoRotate = false;

            const stateActivityLevels = {
                'Aguascalientes': 0.3,
                'Baja California': 0.6,
                'Baja California Sur': 0.2,
                'Campeche': 0.2,
                'Chiapas': 0.4,
                'Chihuahua': 0.5,
                'Coahuila': 0.5,
                'Colima': 0.2,
                'Distrito Federal': 1.0,
                'Ciudad de México': 1.0,
                'Durango': 0.3,
                'Guanajuato': 0.8,
                'Guerrero': 0.3,
                'Hidalgo': 0.4,
                'Jalisco': 0.9,
                'México': 0.9,
                'Michoacán': 0.4,
                'Morelos': 0.3,
                'Nayarit': 0.2,
                'Nuevo León': 0.9,
                'Oaxaca': 0.4,
                'Puebla': 0.7,
                'Querétaro': 0.8,
                'Quintana Roo': 0.5,
                'San Luis Potosí': 0.6,
                'Sinaloa': 0.5,
                'Sonora': 0.5,
                'Tabasco': 0.3,
                'Tamaulipas': 0.6,
                'Tlaxcala': 0.3,
                'Veracruz': 0.7,
                'Yucatán': 0.5,
                'Zacatecas': 0.3
            };

            const getCapColor = (feat) => {
                const name = feat.properties ? feat.properties.name : '';
                const level = stateActivityLevels[name] || 0.1;
                
                if (level <= 0.2) {
                    // Gris para baja actividad
                    return `rgba(180, 180, 180, 0.4)`;
                }

                // Transición de gris a color principal (#e43b14)
                // Color principal: rgb(228, 59, 20)
                const r = Math.round(180 + (228 - 180) * level);
                const g = Math.round(180 + (59 - 180) * level);
                const b = Math.round(180 + (20 - 180) * level);
                const alpha = 0.4 + (level * 0.5); // Aumenta opacidad con actividad
                
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            fetch('https://raw.githubusercontent.com/angelnmara/geojson/master/mexicoHigh.json')
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Failed to load Mexico states GeoJSON');
                    }

                    return response.json();
                })
                .then((geojson) => {
                    presenceGlobeInstance
                        .polygonsData(geojson.features || [])
                        .polygonCapColor(getCapColor)
                        .polygonSideColor(() => 'rgba(228, 59, 20, 0.05)')
                        .polygonStrokeColor(() => 'rgba(255,255,255,0.6)')
                        .polygonAltitude(0.01)
                        .polygonCapCurvatureResolution(1)
                        .polygonsTransitionDuration(500)
                        .polygonLabel(({ properties: d }) => `
                            <div style="background: rgba(0,0,0,0.8); color: white; padding: 5px 10px; border-radius: 4px; font-size: 13px; font-family: sans-serif;">
                                <b style="color: #e43b14;">${d.name}</b><br/>
                                Cobertura: ${Math.round((stateActivityLevels[d.name] || 0.1) * 100)}%
                            </div>
                        `)
                        .onPolygonHover(hoverD => presenceGlobeInstance
                            .polygonCapColor(d => d === hoverD ? 'rgba(228, 59, 20, 1)' : getCapColor(d))
                        );
                })
                .catch(() => {
                    // If the GeoJSON cannot be loaded, keep the globe without state divisions.
                });

            window.addEventListener('resize', function () {
                if (presenceGlobeResizeFrame) {
                    cancelAnimationFrame(presenceGlobeResizeFrame);
                }

                presenceGlobeResizeFrame = requestAnimationFrame(resizePresenceGlobe);
            });
        }

        const activatePresenceTarget = (target) => {
            if (!target) {
                return;
            }

            presenceHotspots.forEach((hotspot) => {
                const isActive = hotspot.dataset.presenceTarget === target;
                hotspot.classList.toggle('is-active', isActive);
                hotspot.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });

            presenceCards.forEach((card) => {
                const isActive = card.dataset.presenceCard === target;
                card.classList.toggle('is-active', isActive);
                if (isActive) {
                    card.removeAttribute('hidden');
                } else {
                    card.setAttribute('hidden', 'hidden');
                }
            });
        };

        presenceHotspots.forEach((hotspot) => {
            hotspot.addEventListener('click', function () {
                activatePresenceTarget(this.dataset.presenceTarget);

                if (presenceGlobeInstance && this.dataset.presenceTarget === 'mexico') {
                    presenceGlobeInstance.pointOfView(mexicoFocus, 900);
                }
            });
        });

        if (presenceHotspots.length) {
            activatePresenceTarget(presenceHotspots[0].dataset.presenceTarget);
        }
    }

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
    initCounterUp($('[data-toggle="counter-up"]'));

})(jQuery);
