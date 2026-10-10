import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// 文章橫幅網址加內容版本號：?v=<PNG 內容的 sha256 前 10 碼>。
// 換圖後網址自動改變，瀏覽器、CDN 與社群平台都會當成新圖重抓；圖沒變，網址就不變。
// .webp 衍生圖（.webp、-thumb、-16x9、-4x3、-1x1）都由同一張 PNG 產生，所以共用 PNG 的版本號。
// 只在 build（prerender）時於 Node 執行，讀的是 public/images/blog/<slug>.png。
const versions = new Map<string, string>();

export function blogBannerVersion(slug: string): string {
  const cached = versions.get(slug);
  if (cached !== undefined) return cached;
  let version = '';
  try {
    const png = readFileSync(path.resolve(`public/images/blog/${slug}.png`));
    version = createHash('sha256').update(png).digest('hex').slice(0, 10);
  } catch {
    // 缺圖時不加版本號；check:banners 會在 build 前擋下缺圖的已發布文章。
  }
  versions.set(slug, version);
  return version;
}

/** 站內相對路徑，例如 blogBannerPath('x', '-thumb.webp') → /images/blog/x-thumb.webp?v=abc */
export function blogBannerPath(slug: string, suffix = '.png'): string {
  const version = blogBannerVersion(slug);
  return `/images/blog/${slug}${suffix}${version ? `?v=${version}` : ''}`;
}
