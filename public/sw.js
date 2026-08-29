/*
 * Service Worker for Uranote Docs Generator
 * Provides offline support for the static Next.js export
 * Caches app shell assets and runtime-loaded static files
 * Does NOT cache generated PDF files
 */

const STATIC_CACHE = "uranote-docs-static-v1";

// Assets to cache on install (must all exist in the static export)
const APP_SHELL = [
  "/",
  "/new/",
  "/edit/",
  "/favicon.ico",
  "/icons/icon.png",
  "/manifest.json",
  "/window.svg",
  "/vercel.svg",
  "/next.svg",
  "/globe.svg",
  "/file.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.method !== "GET") {
    return;
  }

  if (url.pathname.endsWith(".pdf")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigations: network-first, fall back to the cache, then to the shell
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(STATIC_CACHE)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) {
              return cached;
            }
            return caches.match("/");
          });
        })
    );
    return;
  }

  // Static assets: cache-first, then network with runtime caching
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches
            .open(STATIC_CACHE)
            .then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});