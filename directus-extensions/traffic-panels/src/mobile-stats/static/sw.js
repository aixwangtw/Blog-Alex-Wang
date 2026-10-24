/*
 * 手機版統計頁的 service worker。
 * 只快取頁面外殼（HTML、程式、樣式、圖示），讓離線時至少打得開；一律先走網路，網路失敗才用快取。
 * 統計資料（/items、/auth、/mobile-stats/me）完全不經過快取，避免看到過期數字。
 */
const CACHE = 'mobile-stats-shell-v1';
const SCOPE = new URL('./', self.location.href).pathname;
const SHELL = ['', 'app.js', 'style.css', 'manifest.webmanifest', 'icon-192.png'].map((name) => SCOPE + name);

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('mobile-stats-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
	);
});

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
	if (!url.pathname.startsWith(SCOPE) || url.pathname === SCOPE + 'me') return;
	const key = url.pathname === SCOPE || url.pathname === SCOPE + 'index.html' ? SCOPE : url.pathname;
	event.respondWith(
		fetch(event.request)
			.then((response) => {
				if (response.ok) {
					const copy = response.clone();
					caches.open(CACHE).then((cache) => cache.put(key, copy));
				}
				return response;
			})
			.catch(() => caches.match(key).then((cached) => cached || Response.error())),
	);
});
