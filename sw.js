"use strict";
/* 作業点数ツール: アプリ版(スマホ単体)用のService Worker。画面(index.html)だけをオフライン用に保存する。
   点数表データは端末内(IndexedDB)にあり、ここでは扱わない。外部通信(Gemini)や /api /data には触れない。 */
const CACHE = "tensu-app-v2";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "vendor/peerjs.min.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (u.pathname.includes("/api/") || u.pathname.includes("/data/")) return;
  // ネットワーク優先(更新がすぐ反映)。つながらない時は保存済みの画面を出す。
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match("index.html")))
  );
});
