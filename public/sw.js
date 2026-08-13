// Hand-written service worker. No PWA plugin, no build step.
//
// Strategy:
//   navigations  -> network first, fall back to the cached shell
//   static assets-> stale-while-revalidate
//   /api/*       -> never cached; sync is the one online-only path
//
// The student's work lives in IndexedDB, not here. This worker exists so the
// app *shell* loads with the radio off; the data was already local.

const VERSION = "beacon-v1";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;

const PRECACHE = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      // Individual failures must not abort the whole install, or one missing
      // asset leaves the app with no worker at all.
      .then((cache) =>
        Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(SHELL);
    cache.put("/", response.clone());
    return response;
  } catch {
    const cached = (await caches.match(request)) || (await caches.match("/"));
    if (cached) return cached;
    return new Response(
      "<!doctype html><meta charset=utf-8><title>Beacon</title>" +
        "<body style='font-family:system-ui;padding:2rem'>" +
        "<h1>Beacon isn't installed yet</h1>" +
        "<p>Open Beacon once while connected and it will work offline after that.</p>",
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSETS);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  // Serve from cache immediately when we have it; otherwise wait on network.
  const response = cached || (await network);
  return response || Response.error();
}
