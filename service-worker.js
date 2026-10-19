
const CACHE_NAME = "smu-gold-calculator-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Hifadhi faili muhimu wakati wa kusakinisha
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );

  // Ruhusu toleo jipya kuanza kufanya kazi
  self.skipWaiting();
});

// Futa cache za matoleo ya zamani
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Pata ukurasa mpya mtandaoni; tumia cache ikiwa hakuna mtandao
self.addEventListener("fetch", event => {
  const request = event.request;

  // Shughulikia maombi ya kusoma pekee
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Usishughulikie tovuti nyingine
  if (url.origin !== self.location.origin) return;

  const isPage =
    request.mode === "navigate" ||
    url.pathname.endsWith("/index.html");

  if (isPage) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy))
              .catch(() => {});

          }

          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);

          if (cached) return cached;

          const fallback = await caches.match("./index.html");

          if (fallback) return fallback;

          return new Response(
            "Hakuna intaneti. Tafadhali unganisha intaneti na ujaribu tena.",
            {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=utf-8"
              }
            }
          );
        })
    );

    return;
  }

  // Kwa faili nyingine, tumia cache kwanza
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;

        return fetch(request).then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy))
              .catch(() => {});
          }

          return response;
        });
      })
  );
});
