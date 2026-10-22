/**
 * 組出 Directus REST 查詢字串。axios 的 params 序列化行為跨版本不一，這裡自己組，
 * 例：query({ 'aggregate[sum]': 'views', 'filter[date][_eq]': '2026-10-22' })。
 */
export function query(params: Record<string, string | number | undefined>): string {
	return Object.entries(params)
		.filter(([, value]) => value !== undefined)
		.map(([key, value]) => `${key.replace(/[^[\]_a-zA-Z0-9]/g, encodeURIComponent)}=${encodeURIComponent(String(value))}`)
		.join('&');
}

/** 內容類型：卡片與表格共用的對應表。 */
export const KINDS = {
	articles: { collection: 'articles', contentType: '文章', label: '文章' },
	pages: { collection: 'page_views', contentType: '頁面', label: '頁面' },
} as const;
