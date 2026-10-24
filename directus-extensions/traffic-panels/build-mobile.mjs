/**
 * 手機版統計頁（mobile-stats endpoint）的前端建置：
 * src/mobile-stats/client/main.ts → dist/mobile/app.js，src/mobile-stats/static/* 複製到 dist/mobile/。
 * 要在 directus-extension build 之後跑（npm run build 已串好）。
 */
import { build } from 'esbuild';
import { cp, mkdir } from 'node:fs/promises';

const out = new URL('./dist/mobile/', import.meta.url);
await mkdir(out, { recursive: true });
await build({
	entryPoints: [new URL('./src/mobile-stats/client/main.ts', import.meta.url).pathname],
	outfile: new URL('app.js', out).pathname,
	bundle: true,
	format: 'esm',
	target: ['es2020'],
	minify: true,
	legalComments: 'none',
});
await cp(new URL('./src/mobile-stats/static/', import.meta.url), out, { recursive: true });
console.log('mobile-stats：dist/mobile/ 建置完成');
