import { readFile } from 'node:fs/promises';

/**
 * 手機版統計頁（PWA）：https://cms.aixwang.dev/mobile-stats/
 *
 * 這裡只送靜態檔（頁面、程式、manifest、service worker、圖示），不含任何資料。
 * 資料由瀏覽器用登入者自己的 Directus session cookie 呼叫 /items/... 取得，權限與後台一致；
 * /me 只回報目前登入者是不是管理員，頁面據此決定要不要顯示。
 * 靜態檔由 build-mobile.mjs 放在 dist/mobile/（與 dist/api.js 同層的 mobile/ 資料夾）。
 */
const FILES: Record<string, { file: string; type: string; cache: string }> = {
	'': { file: 'index.html', type: 'text/html; charset=utf-8', cache: 'no-cache' },
	'app.js': { file: 'app.js', type: 'text/javascript; charset=utf-8', cache: 'no-cache' },
	'style.css': { file: 'style.css', type: 'text/css; charset=utf-8', cache: 'no-cache' },
	'sw.js': { file: 'sw.js', type: 'text/javascript; charset=utf-8', cache: 'no-cache' },
	'manifest.webmanifest': { file: 'manifest.webmanifest', type: 'application/manifest+json; charset=utf-8', cache: 'no-cache' },
	'icon-192.png': { file: 'icon-192.png', type: 'image/png', cache: 'public, max-age=86400' },
	'icon-512.png': { file: 'icon-512.png', type: 'image/png', cache: 'public, max-age=86400' },
	'icon-maskable-512.png': { file: 'icon-maskable-512.png', type: 'image/png', cache: 'public, max-age=86400' },
};

const baseDir = new URL('./mobile/', import.meta.url);

/** 物件寫法（id + handler）讓路由固定為 /mobile-stats；不呼叫 defineEndpoint，免得把 SDK 打包進 api.js。 */
export default {
	id: 'mobile-stats',
	handler: (router: any) => {
		router.get('/me', (req: any, res: any) => {
			const accountability = req.accountability;
			res.set('Cache-Control', 'no-store');
			res.json({ authenticated: Boolean(accountability?.user), admin: accountability?.admin === true });
		});

		// 不用 '/:name?' 可選參數寫法：express 4 與 5 的路徑語法不同，分開註冊兩條最保險。
		const serve = async (req: any, res: any, next: any) => {
			const name = req.params.name ?? '';
			// 少了結尾斜線時導回 /mobile-stats/，頁面裡的相對路徑才會指向正確位置。
			if (name === '' && !req.originalUrl.split('?')[0].endsWith('/')) {
				res.redirect(301, `${req.baseUrl}/`);
				return;
			}
			const entry = FILES[name];
			if (!entry) {
				next();
				return;
			}
			try {
				const body = await readFile(new URL(entry.file, baseDir));
				res.set('Content-Type', entry.type);
				res.set('Cache-Control', entry.cache);
				res.set('X-Robots-Tag', 'noindex');
				res.send(body);
			} catch {
				res.status(500).send('mobile-stats：找不到靜態檔，請重新建置擴充。');
			}
		};
		router.get('/', serve);
		router.get('/:name', serve);
	},
};
