const MODEL_CACHE_NAME = 'shipping-3d-models-v1';
const MODEL_PATH_PATTERN = /\/img\/unidades\/models\/.+\.(?:opt|mobile)\.glb(?:\?.*)?$/i;

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
    const data = event.data || {};

    if (data.type !== 'CACHE_FLEET_MODELS' || !Array.isArray(data.urls)) {
        return;
    }

    event.waitUntil(cacheFleetModels(data.urls));
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    if (!MODEL_PATH_PATTERN.test(requestUrl.pathname)) {
        return;
    }

    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(cacheFirstModel(event.request));
});

async function cacheFirstModel(request) {
    const cache = await caches.open(MODEL_CACHE_NAME);
    const cachedResponse = await cache.match(request, {
        ignoreSearch: true
    });

    if (cachedResponse) {
        return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
}

async function cacheFleetModels(urls) {
    const cache = await caches.open(MODEL_CACHE_NAME);

    for (const rawUrl of urls) {
        const normalizedUrl = new URL(rawUrl, self.location.origin);
        if (!MODEL_PATH_PATTERN.test(normalizedUrl.pathname)) {
            continue;
        }

        const existing = await cache.match(normalizedUrl.href, {
            ignoreSearch: true
        });

        if (existing) {
            continue;
        }

        try {
            const response = await fetch(normalizedUrl.href, {
                credentials: 'same-origin'
            });

            if (response && response.ok) {
                await cache.put(normalizedUrl.href, response.clone());
            }
        } catch (error) {
            // Ignore transient cache warm failures.
        }
    }
}
