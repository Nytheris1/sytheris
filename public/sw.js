/* SYTHERIS service worker — basit önbellek */
const CACHE = "sytheris-v1";
const PRECACHE = ["/", "/calendar", "/search"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  // Sadece kendi origin'imiz
  if (url.origin !== self.location.origin) return;

  // API istekleri ve AniList — cache'leme
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("anilist") ||
    url.hostname.includes("jikan")
  ) {
    return;
  }

  // HTML navigasyon — network-first, düşerse cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(req).then((r) => r || caches.match("/")),
      ),
    );
    return;
  }

  // Statik varlıklar — cache-first
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    /\.(png|jpe?g|svg|webp|gif|ico|woff2?|ttf|css|js|webmanifest)$/i.test(
      url.pathname,
    );

  if (isStatic) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok && res.type === "basic") {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        });
      }),
    );
  }
});