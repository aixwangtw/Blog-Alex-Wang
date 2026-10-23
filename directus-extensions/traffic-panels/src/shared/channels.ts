/**
 * 入口分類的固定排序，需與 tools/lib/traffic-sources-lib.mjs 的
 * HEAD_CHANNELS／RANKED_CHANNELS／PINNED_CHANNELS／TAIL_CHANNELS 一致：
 * Google 搜尋第一、AI 搜尋第二（不論數字）→ Facebook、Threads、Instagram、LINE、YouTube、站內換頁依數字降冪（0 排此區最後）
 * → 固定最後「其他」「疑似自動程式」。
 */
export const HEAD_CHANNELS = ['Google 搜尋', 'AI 搜尋'];
export const RANKED_CHANNELS = ['Facebook', 'Threads', 'Instagram', 'LINE', 'YouTube', '站內換頁'];
export const TAIL_CHANNELS = ['其他', '疑似自動程式'];
/** 沒有資料也要列出 0 的分類。 */
export const PINNED_CHANNELS = ['Google 搜尋', 'AI 搜尋', 'LINE', 'YouTube'];
const ALL_CHANNELS = [...HEAD_CHANNELS, ...RANKED_CHANNELS, ...TAIL_CHANNELS];

function rank(name: string): number {
	return HEAD_CHANNELS.includes(name) ? 0 : TAIL_CHANNELS.includes(name) ? 2 : 1;
}

/** 依固定規則排列 [{ channel, <countKey> }]（回傳新陣列）。 */
export function sortChannels<T extends { channel: string }>(items: T[], countKey: keyof T): T[] {
	const count = (item: T) => Number(item[countKey] ?? 0);
	return [...items].sort((a, b) => {
		const ra = rank(a.channel);
		const rb = rank(b.channel);
		if (ra !== rb) return ra - rb;
		if (ra === 0) return HEAD_CHANNELS.indexOf(a.channel) - HEAD_CHANNELS.indexOf(b.channel);
		if (ra === 2) return TAIL_CHANNELS.indexOf(a.channel) - TAIL_CHANNELS.indexOf(b.channel);
		return count(b) - count(a) || ALL_CHANNELS.indexOf(a.channel) - ALL_CHANNELS.indexOf(b.channel);
	});
}

/** 補上 PINNED_CHANNELS 缺的 0 筆（零值筆數由 make 提供欄位格式），再依固定規則排列。 */
export function withPinned<T extends { channel: string }>(items: T[], countKey: keyof T, make: (channel: string) => T): T[] {
	const missing = PINNED_CHANNELS.filter((name) => !items.some((item) => item.channel === name)).map(make);
	return sortChannels([...items, ...missing], countKey);
}

export interface DetailItem {
	name: string;
	sessions: number;
}

/** 依數字降冪（同數依名稱）。 */
export function sortDetails(items: DetailItem[]): DetailItem[] {
	return [...items].sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name, 'zh-TW'));
}
