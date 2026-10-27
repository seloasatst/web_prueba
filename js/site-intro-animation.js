/**
 * SELOASA - Controlador de Animación de Bienvenida (Camioncito Minimalista con Logo)
 * Se ejecuta una sola vez al entrar por primera vez al sitio web (almacenado en localStorage).
 * 100% nativo, sin librerías externas.
 */

(function () {
    'use strict';

    var STORAGE_KEY = 'seloasa_intro_shown';
    var splashOverlay = null;
    var skipBtn = null;
    var isDismissed = false;
    var timers = [];

    // Comprobar si el usuario ya vio la animación en una visita anterior
    function shouldShowIntro() {
        try {
            var urlParams = new URLSearchParams(window.location.search);
            // Parámetro para pruebas/demostraciones (?intro=1 o ?intro)
            if (urlParams.has('intro') || urlParams.has('demo')) {
                return true;
            }
            // Si ya fue vista previamente, no volver a mostrar
            if (localStorage.getItem(STORAGE_KEY)) {
                return false;
            }
        } catch (e) {
            // Fallback silencioso si el almacenamiento local está restringido
        }
        return true;
    }

    function markIntroAsShown() {
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
            sessionStorage.setItem(STORAGE_KEY, 'true');
        } catch (e) {
            // Fallback silencioso
        }
    }

    // Función global accesible desde la consola del navegador para restablecer la animación
    window.resetSeloasaIntro = function () {
        try {
            localStorage.removeItem(STORAGE_KEY);
            sessionStorage.removeItem(STORAGE_KEY);
            console.log('Intro SELOASA restablecida. Se mostrará en la próxima recarga.');
        } catch (e) {}
    };

    function addTimer(fn, delay) {
        var t = setTimeout(fn, delay);
        timers.push(t);
        return t;
    }

    function clearAllTimers() {
        timers.forEach(function (t) {
            clearTimeout(t);
        });
        timers = [];
    }

    function dismissIntro() {
        if (isDismissed) return;
        isDismissed = true;
        clearAllTimers();
        markIntroAsShown();

        if (splashOverlay) {
            splashOverlay.classList.add('is-leaving');
            setTimeout(function () {
                splashOverlay.classList.remove('is-visible', 'is-leaving', 'truck-accelerating');
                splashOverlay.style.display = 'none';
                document.body.classList.remove('seloasa-intro-active');
            }, 380);
        } else {
            document.body.classList.remove('seloasa-intro-active');
        }
    }

    function startChoreography() {
        splashOverlay = document.getElementById('seloasa-intro-splash');
        if (!splashOverlay) return;

        // Si no debe mostrarse por haber sido vista con anterioridad
        if (!shouldShowIntro()) {
            splashOverlay.style.display = 'none';
            document.body.classList.remove('seloasa-intro-active');
            return;
        }

        // Marcar inmediatamente para evitar repeticiones al recargar durante la intro
        markIntroAsShown();

        skipBtn = splashOverlay.querySelector('.seloasa-skip-btn');

        // Bloquear scroll e interacción del fondo mientras corre la animación
        document.body.classList.add('seloasa-intro-active');
        splashOverlay.style.display = 'flex';

        // Permitir clic en cualquier parte para omitir inmediatamente
        splashOverlay.addEventListener('click', function () {
            dismissIntro();
        });

        if (skipBtn) {
            skipBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                dismissIntro();
            });
        }

        // Permitir tecla Escape o Espacio para saltar
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' || e.key === ' ') {
                dismissIntro();
            }
        }, { once: true });

        // Paso 0: Mostrar telón (0.05s)
        requestAnimationFrame(function () {
            splashOverlay.classList.add('is-visible');
        });

        // Paso 1: El camión se centra y a los 1.55s acelera hacia la derecha
        addTimer(function () {
            if (isDismissed) return;
            splashOverlay.classList.add('truck-accelerating');
        }, 1550);

        // Paso 2: Salida suave del telón hacia el sitio web (1.95s)
        addTimer(function () {
            if (isDismissed) return;
            dismissIntro();
        }, 1950);
    }

    // Inicializar al cargar el DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startChoreography);
    } else {
        startChoreography();
    }
})();
