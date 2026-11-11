/* PYQ Loop service worker - offline-first cache for the app shell */
const CACHE = "pyq-loop-v6";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./bank-ec2024.json"];
const CDN = [
  "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",
  "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS).then(() => Promise.all(
        CDN.map((u) => c.add(u).catch(() => null))
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
