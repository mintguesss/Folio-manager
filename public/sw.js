// Minimal service worker — makes Chrome treat this as an installable PWA.
// No caching; all requests pass through to the network normally.
self.addEventListener("install", (e) => { e.waitUntil(self.skipWaiting()); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", () => {});
