// Minimal service worker — makes Chrome treat this as an installable PWA.
// 不註冊 fetch handler：空的 handler 會讓每次開 app 都要先啟動 SW，拖慢啟動畫面。
self.addEventListener("install", (e) => { e.waitUntil(self.skipWaiting()); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
