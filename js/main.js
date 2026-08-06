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
                .pointOfView(mexicoFocus, 0)
                .arcsData([])
                .arcStartLat(d => d.startLat)
                .arcStartLng(d => d.startLng)
                .arcEndLat(d => d.endLat)
                .arcEndLng(d => d.endLng)
                .arcColor(d => d.color)
                .arcAltitude(d => d.altitude)
                .arcStroke(d => d.stroke)
                .arcDashLength(d => d.dashLength)
                .arcDashGap(d => d.dashGap)
                .arcDashAnimateTime(d => d.dashAnimateTime)
                .pathsData([])
                .pathPoints(d => d.points)
                .pathPointLat(p => p[0])
                .pathPointLng(p => p[1])
                .pathPointAlt(p => p[2] || 0.012)
                .pathColor(d => d.color)
                .pathStroke(d => d.stroke)
                .pathDashLength(d => d.dashLength)
                .pathDashGap(d => d.dashGap)
                .pathDashAnimateTime(d => d.dashAnimateTime)
                .ringsData([])
                .ringLat(d => d.lat)
                .ringLng(d => d.lng)
                .ringColor(d => d.color)
                .ringMaxRadius(d => d.maxR)
                .ringPropagationSpeed(d => d.propagationSpeed)
                .ringRepeatPeriod(d => d.repeatPeriod)
                .htmlElementsData([])
                .htmlLat(d => d.lat)
                .htmlLng(d => d.lng)
                .htmlAltitude(d => d.altitude)
                .htmlElement(d => d.element);

            const presenceGlobeControls = presenceGlobeInstance.controls();
            presenceGlobeControls.enablePan = false;
            presenceGlobeControls.enableZoom = false;
            presenceGlobeControls.autoRotate = false;

            const UNIFORM_ORANGE = 'rgba(228, 59, 20, 0.85)';
            const HOVER_ORANGE = 'rgba(255, 110, 30, 0.98)';
            let originHub = { lat: 19.4326, lng: -99.1332, name: 'CDMX' };
            let hoveredPolygon = null;
            let activeDispatchAnimation = null;
            let dispatchToastTimeout = null;

            const getFeatureCentroid = (feat) => {
                if (!feat || !feat.geometry) return { lat: 23.6345, lng: -102.5528 };
                const type = feat.geometry.type;
                const coords = feat.geometry.coordinates;
                let sumLat = 0, sumLng = 0, count = 0;

                const processRing = (ring) => {
                    for (let i = 0; i < ring.length; i++) {
                        sumLng += ring[i][0];
                        sumLat += ring[i][1];
                        count++;
                    }
                };

                if (type === 'Polygon') {
                    processRing(coords[0]);
                } else if (type === 'MultiPolygon') {
                    coords.forEach(poly => processRing(poly[0]));
                }

                if (count === 0) return { lat: 23.6345, lng: -102.5528 };
                return { lat: sumLat / count, lng: sumLng / count };
            };

            const showMapToast = (title, body, iconClass = 'fa-truck') => {
                let toastEl = presenceGlobeElement.parentElement.querySelector('.map-dispatch-toast');
                if (!toastEl) {
                    toastEl = document.createElement('div');
                    toastEl.className = 'map-dispatch-toast';
                    presenceGlobeElement.parentElement.appendChild(toastEl);
                }
                toastEl.innerHTML = `
                    <div class="toast-icon"><i class="fa ${iconClass}"></i></div>
                    <div class="toast-content">
                        <span class="toast-title">${title}</span>
                        <span class="toast-body">${body}</span>
                    </div>
                `;
                toastEl.style.display = 'flex';

                if (dispatchToastTimeout) clearTimeout(dispatchToastTimeout);
                dispatchToastTimeout = setTimeout(() => {
                    if (toastEl) toastEl.style.display = 'none';
                }, 5500);
            };

            const getHeadingAngle = (lat1, lng1, lat2, lng2) => {
                const rad = Math.PI / 180;
                const dLng = (lng2 - lng1) * rad;
                const lat1Rad = lat1 * rad;
                const lat2Rad = lat2 * rad;

                const y = Math.sin(dLng) * Math.cos(lat2Rad);
                const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

                let brng = Math.atan2(y, x) * (180 / Math.PI);
                return (brng + 360) % 360;
            };

            const stateCentroidMap = {};

            const getLandWaypoints = (targetName, origin) => {
                const getPos = (name) => stateCentroidMap[name] || origin;
                const waypoints = [[origin.lat, origin.lng, 0.02]];

                if (['Yucatán', 'Quintana Roo', 'Campeche'].includes(targetName)) {
                    // Highway 180 / 185 Southern Gulf Coastal Highway Corridor (strictly on land)
                    waypoints.push(
                        [19.0414, -98.2063, 0.02], // Puebla
                        [18.8819, -96.9248, 0.02], // Córdoba/Orizaba, Veracruz
                        [18.1408, -94.4608, 0.02], // Coatzacoalcos (Isthmus)
                        [17.9892, -92.9281, 0.02], // Villahermosa, Tabasco
                        [18.6044, -90.7441, 0.02]  // Escárcega, Campeche
                    );
                    if (targetName === 'Yucatán' || targetName === 'Quintana Roo') {
                        const campPos = getPos('Campeche');
                        waypoints.push([campPos.lat, campPos.lng, 0.02]);
                    }
                } else if (targetName === 'Tabasco') {
                    waypoints.push(
                        [19.0414, -98.2063, 0.02], // Puebla
                        [18.8819, -96.9248, 0.02], // Veracruz
                        [18.1408, -94.4608, 0.02]  // Coatzacoalcos
                    );
                } else if (targetName === 'Chiapas') {
                    waypoints.push(
                        [19.0414, -98.2063, 0.02], // Puebla
                        [17.0732, -96.7266, 0.02]  // Oaxaca
                    );
                } else if (targetName === 'Oaxaca') {
                    waypoints.push(
                        [19.0414, -98.2063, 0.02]  // Puebla
                    );
                } else if (['Baja California', 'Baja California Sur'].includes(targetName)) {
                    // Highway 15D Pacific Highway Corridor around the Gulf of California
                    waypoints.push(
                        [20.5888, -100.3899, 0.02], // Querétaro
                        [20.6597, -103.3496, 0.02], // Guadalajara, Jalisco
                        [21.5039, -104.8947, 0.02], // Tepic, Nayarit
                        [24.8091, -107.3940, 0.02], // Culiacán, Sinaloa
                        [29.0729, -110.9559, 0.02], // Hermosillo, Sonora
                        [32.4561, -114.7719, 0.02]  // San Luis Río Colorado (Sonora/Baja Border)
                    );
                    if (targetName === 'Baja California Sur') {
                        waypoints.push([32.6245, -115.4523, 0.02]); // Mexicali
                    }
                } else if (targetName === 'Sonora') {
                    waypoints.push(
                        [20.5888, -100.3899, 0.02],
                        [20.6597, -103.3496, 0.02],
                        [24.8091, -107.3940, 0.02]  // Sinaloa
                    );
                } else if (targetName === 'Sinaloa') {
                    waypoints.push(
                        [20.5888, -100.3899, 0.02],
                        [20.6597, -103.3496, 0.02]  // Jalisco
                    );
                } else if (targetName === 'Nayarit' || targetName === 'Colima') {
                    waypoints.push(
                        [20.5888, -100.3899, 0.02],
                        [20.6597, -103.3496, 0.02]  // Jalisco
                    );
                } else if (['Chihuahua', 'Durango'].includes(targetName)) {
                    waypoints.push(
                        [20.5888, -100.3899, 0.02], // Querétaro
                        [22.1565, -100.9855, 0.02], // San Luis Potosí
                        [22.7709, -102.5832, 0.02]  // Zacatecas
                    );
                } else if (['Nuevo León', 'Tamaulipas', 'Coahuila'].includes(targetName)) {
                    waypoints.push(
                        [20.5888, -100.3899, 0.02], // Querétaro
                        [22.1565, -100.9855, 0.02]  // San Luis Potosí
                    );
                } else if (targetName === 'Guerrero') {
                    waypoints.push(
                        [18.9261, -99.2307, 0.02]   // Cuernavaca, Morelos
                    );
                } else if (targetName === 'Michoacán') {
                    waypoints.push(
                        [19.3552, -99.6569, 0.02]   // Toluca, Estado de México
                    );
                } else if (targetName === 'Veracruz') {
                    waypoints.push(
                        [19.0414, -98.2063, 0.02]   // Puebla
                    );
                }

                // Append target centroid at the end
                const targetPt = getPos(targetName);
                waypoints.push([targetPt.lat, targetPt.lng, 0.02]);

                return waypoints;
            };

            const triggerStateDispatch = (polygon) => {
                if (!polygon) return;
                const target = getFeatureCentroid(polygon);
                const stateName = polygon.properties && polygon.properties.name ? polygon.properties.name : 'Estado';
                const isPlane = Math.random() < 0.5;

                if (activeDispatchAnimation) {
                    cancelAnimationFrame(activeDispatchAnimation);
                    activeDispatchAnimation = null;
                }

                presenceGlobeInstance.arcsData([]);
                presenceGlobeInstance.pathsData([]);
                presenceGlobeInstance.ringsData([]);
                presenceGlobeInstance.htmlElementsData([]);

                let animStartTime = null;

                if (isPlane) {
                    // Flight Line (Direct Arching Path, identical style to truck route)
                    const flightPoints = [];
                    const numSteps = 35;
                    for (let i = 0; i <= numSteps; i++) {
                        const stepT = i / numSteps;
                        const pLat = originHub.lat + (target.lat - originHub.lat) * stepT;
                        const pLng = originHub.lng + (target.lng - originHub.lng) * stepT;
                        const pAlt = 0.015 + Math.sin(stepT * Math.PI) * 0.28;
                        flightPoints.push([pLat, pLng, pAlt]);
                    }

                    // Set full flight route line ONCE so Three.js renders it continuously
                    presenceGlobeInstance.pathsData([{
                        points: flightPoints,
                        color: '#ffffff',
                        stroke: 1.5,
                        dashLength: 0.15,
                        dashGap: 0.05,
                        dashAnimateTime: 1400
                    }]);

                    const planeMarker = document.createElement('div');
                    planeMarker.className = 'vehicle-anim-marker';
                    planeMarker.innerHTML = `
                        <div class="vehicle-icon-inner">
                            <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 2L28.5 16L44 20L44 24.5L28.5 22.5L26.5 38L31.5 42.5L31.5 45.5L24 43.5L16.5 45.5L16.5 42.5L21.5 38L19.5 22.5L4 24.5L4 20L19.5 16L24 2Z" fill="#e43b14" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/>
                                <circle cx="24" cy="8" r="1.6" fill="#ffffff"/>
                                <path d="M24 16L24 38" stroke="#ffffff" stroke-width="1" stroke-dasharray="2 2" opacity="0.6"/>
                            </svg>
                        </div>
                    `;
                    const planeIconInner = planeMarker.querySelector('.vehicle-icon-inner');

                    showMapToast('Despacho Aéreo Directo', `Iniciando vuelo directo hacia <strong>${stateName}</strong>`, 'fa-plane');

                    const duration = 2600;
                    const animatePlane = (now) => {
                        if (!animStartTime) animStartTime = now;
                        const elapsed = now - animStartTime;
                        const t = Math.min(1, elapsed / duration);

                        const curLat = originHub.lat + (target.lat - originHub.lat) * t;
                        const curLng = originHub.lng + (target.lng - originHub.lng) * t;
                        const curAlt = 0.05 + Math.sin(t * Math.PI) * 0.28;

                        const currentHeading = getHeadingAngle(curLat, curLng, target.lat, target.lng);
                        if (planeIconInner) {
                            planeIconInner.style.transform = `rotate(${currentHeading}deg)`;
                        }

                        presenceGlobeInstance.htmlElementsData([{
                            lat: curLat,
                            lng: curLng,
                            altitude: curAlt,
                            element: planeMarker
                        }]);

                        if (t < 1) {
                            activeDispatchAnimation = requestAnimationFrame(animatePlane);
                        } else {
                            presenceGlobeInstance.ringsData([{
                                lat: target.lat,
                                lng: target.lng,
                                color: 'rgba(228, 59, 20, 0.95)',
                                maxR: 9,
                                propagationSpeed: 5,
                                repeatPeriod: 0
                            }]);

                            showMapToast('Envío Aéreo Entregado', `Paquete aéreo arribó con éxito a <strong>${stateName}</strong>`, 'fa-check-circle');

                            setTimeout(() => {
                                presenceGlobeInstance.pathsData([]);
                                presenceGlobeInstance.htmlElementsData([]);
                                presenceGlobeInstance.ringsData([]);
                            }, 5000);
                        }
                    };

                    activeDispatchAnimation = requestAnimationFrame(animatePlane);
                } else {
                    // Truck Route passing state-by-state on land
                    const waypoints = getLandWaypoints(stateName, originHub);

                    // Set full truck route line ONCE so Three.js renders it continuously on land
                    presenceGlobeInstance.pathsData([{
                        points: waypoints,
                        color: '#ffffff',
                        stroke: 1.5,
                        dashLength: 0.15,
                        dashGap: 0.05,
                        dashAnimateTime: 1400
                    }]);

                    const truckMarker = document.createElement('div');
                    truckMarker.className = 'vehicle-anim-marker';
                    truckMarker.innerHTML = `
                        <div class="vehicle-icon-inner">
                            <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <!-- Side Mirrors -->
                                <rect x="2" y="9" width="3" height="5" rx="1.5" fill="#1f2937"/>
                                <rect x="29" y="9" width="3" height="5" rx="1.5" fill="#1f2937"/>
                                <!-- Front Cab Body -->
                                <path d="M7 4C7 2.34 8.34 1 10 1H24C25.66 1 27 2.34 27 4V13H7V4Z" fill="#111827"/>
                                <path d="M9 2.5H25C25.8 2.5 26.5 3.2 26.5 4V10H7.5V4C7.5 3.2 8.2 2.5 9 2.5Z" fill="#e43b14"/>
                                <!-- Windshield & Reflection -->
                                <path d="M9.5 4H24.5V8.5H9.5V4Z" fill="#38bdf8" opacity="0.95"/>
                                <path d="M10 4.5H24V6.5H10V4.5Z" fill="#ffffff" opacity="0.6"/>
                                <!-- Headlights -->
                                <circle cx="8.5" cy="1.8" r="1.2" fill="#fef08a"/>
                                <circle cx="25.5" cy="1.8" r="1.2" fill="#fef08a"/>
                                <!-- Refrigerated Cargo Box Body -->
                                <rect x="5" y="12" width="24" height="29" rx="3" fill="#ffffff" stroke="#e43b14" stroke-width="1.8"/>
                                <!-- Cooling Unit (Thermo/Carrier) Top -->
                                <rect x="10" y="11" width="14" height="4" rx="1.5" fill="#374151" stroke="#ffffff" stroke-width="0.8"/>
                                <!-- Roof Accent & Center Divider -->
                                <line x1="17" y1="15" x2="17" y2="40" stroke="#d1d5db" stroke-width="1.5" stroke-dasharray="3 2"/>
                                <rect x="7" y="14" width="20" height="2" fill="#e43b14"/>
                                <!-- Heavy Duty Wheels -->
                                <rect x="3" y="15" width="2.5" height="7" rx="1" fill="#111827"/>
                                <rect x="28.5" y="15" width="2.5" height="7" rx="1" fill="#111827"/>
                                <rect x="3" y="32" width="2.5" height="7" rx="1" fill="#111827"/>
                                <rect x="28.5" y="32" width="2.5" height="7" rx="1" fill="#111827"/>
                            </svg>
                        </div>
                    `;
                    const truckIconInner = truckMarker.querySelector('.vehicle-icon-inner');

                    showMapToast('Ruta Terrestre Activa', `Camión transitando hacia <strong>${stateName}</strong>`, 'fa-truck');

                    const duration = Math.max(3000, waypoints.length * 800);
                    const animateTruck = (now) => {
                        if (!animStartTime) animStartTime = now;
                        const elapsed = now - animStartTime;
                        const t = Math.min(1, elapsed / duration);

                        const totalSegs = waypoints.length - 1;
                        const segIdx = Math.min(totalSegs - 1, Math.floor(t * totalSegs));
                        const segT = (t * totalSegs) - segIdx;

                        const pStart = waypoints[segIdx];
                        const pEnd = waypoints[segIdx + 1];

                        const segHeading = getHeadingAngle(pStart[0], pStart[1], pEnd[0], pEnd[1]);
                        if (truckIconInner) {
                            truckIconInner.style.transform = `rotate(${segHeading}deg)`;
                        }

                        const curLat = pStart[0] + (pEnd[0] - pStart[0]) * segT;
                        const curLng = pStart[1] + (pEnd[1] - pStart[1]) * segT;

                        presenceGlobeInstance.htmlElementsData([{
                            lat: curLat,
                            lng: curLng,
                            altitude: 0.055,
                            element: truckMarker
                        }]);

                        if (t < 1) {
                            activeDispatchAnimation = requestAnimationFrame(animateTruck);
                        } else {
                            presenceGlobeInstance.ringsData([{
                                lat: target.lat,
                                lng: target.lng,
                                color: 'rgba(228, 59, 20, 0.95)',
                                maxR: 9,
                                propagationSpeed: 5,
                                repeatPeriod: 0
                            }]);

                            showMapToast('Ruta Terrestre Completada', `Camión arribó con éxito a <strong>${stateName}</strong>`, 'fa-check-circle');

                            setTimeout(() => {
                                presenceGlobeInstance.pathsData([]);
                                presenceGlobeInstance.htmlElementsData([]);
                                presenceGlobeInstance.ringsData([]);
                            }, 5000);
                        }
                    };

                    activeDispatchAnimation = requestAnimationFrame(animateTruck);
                }
            };

            fetch('https://raw.githubusercontent.com/angelnmara/geojson/master/mexicoHigh.json')
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Failed to load Mexico states GeoJSON');
                    }

                    return response.json();
                })
                .then((geojson) => {
                    (geojson.features || []).forEach(feat => {
                        if (feat.properties && feat.properties.name) {
                            stateCentroidMap[feat.properties.name] = getFeatureCentroid(feat);
                        }
                    });

                    // Resolve exact CDMX origin centroid from loaded GeoJSON features
                    const cdmxFeat = (geojson.features || []).find(f => f.properties && (
                        f.properties.name === 'Ciudad de México' || 
                        f.properties.name === 'Distrito Federal'
                    ));
                    if (cdmxFeat) {
                        const cdmxCentroid = getFeatureCentroid(cdmxFeat);
                        originHub = { lat: cdmxCentroid.lat, lng: cdmxCentroid.lng, name: 'CDMX' };
                    }
                    presenceGlobeInstance
                        .polygonsData(geojson.features || [])
                        .polygonCapColor(d => d === hoveredPolygon ? HOVER_ORANGE : UNIFORM_ORANGE)
                        .polygonSideColor(() => 'rgba(228, 59, 20, 0.25)')
                        .polygonStrokeColor(d => d === hoveredPolygon ? '#ffffff' : 'rgba(255, 255, 255, 0.65)')
                        .polygonAltitude(d => d === hoveredPolygon ? 0.045 : 0.01)
                        .polygonCapCurvatureResolution(1)
                        .polygonsTransitionDuration(300)
                        .polygonLabel(({ properties: d }) => `
                            <div style="background: #ffffff; color: #1f252b; padding: 12px 18px; border-radius: 16px; border: 2px solid #e43b14; box-shadow: none !important; font-family: 'Inter', system-ui, -apple-system, sans-serif; text-align: left; min-width: 195px;">
                                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 4px;">
                                    <div style="font-size: 15px; font-weight: 800; color: #1f252b; letter-spacing: -0.01em;">${d.name}</div>
                                    <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; background: rgba(228, 59, 20, 0.08); border: 1px solid rgba(228, 59, 20, 0.2); color: #e43b14; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">
                                        <span style="width: 5px; height: 5px; border-radius: 50%; background: #8fc754;"></span> Cobertura
                                    </span>
                                </div>
                                <div style="font-size: 11px; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 5px;">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e43b14" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                                    <span>Haz clic para simular envío</span>
                                </div>
                            </div>
                        `)
                        .onPolygonHover(hoverD => {
                            hoveredPolygon = hoverD;
                            presenceGlobeInstance
                                .polygonAltitude(d => d === hoverD ? 0.045 : 0.01)
                                .polygonCapColor(d => d === hoverD ? HOVER_ORANGE : UNIFORM_ORANGE)
                                .polygonStrokeColor(d => d === hoverD ? '#ffffff' : 'rgba(255, 255, 255, 0.65)');

                            if (presenceGlobeElement) {
                                presenceGlobeElement.style.cursor = hoverD ? 'pointer' : 'default';
                            }
                        })
                        .onPolygonClick(polygon => triggerStateDispatch(polygon));
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
