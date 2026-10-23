/**
 * 入口分類的固定排序，需與 tools/lib/traffic-sources-lib.mjs 的
 * EXTERNAL_CHANNELS／DERIVED_CHANNELS／TAIL_CHANNELS 一致：
 * 外部來源依人數多到少 → 衍生分類依人數多到少 → 固定最後「其他」「疑似自動程式」。
 */
export const EXTERNAL_CHANNELS = ['Google 搜尋', 'Facebook', 'Threads', 'Instagram', 'AI 助理', 'YouTube', 'LINE'];
export const DERIVED_CHANNELS = ['站內換頁'];
export const TAIL_CHANNELS = ['其他', '疑似自動程式'];
const ALL_CHANNELS = [...EXTERNAL_CHANNELS, ...DERIVED_CHANNELS, ...TAIL_CHANNELS];

function rank(name: string): number {
	return DERIVED_CHANNELS.includes(name) ? 1 : TAIL_CHANNELS.includes(name) ? 2 : 0;
}

/** 依固定規則排列 [{ channel, <countKey> }]（回傳新陣列）。 */
export function sortChannels<T extends { channel: string }>(items: T[], countKey: keyof T): T[] {
	const count = (item: T) => Number(item[countKey] ?? 0);
	return [...items].sort((a, b) => {
		const ra = rank(a.channel);
		const rb = rank(b.channel);
		if (ra !== rb) return ra - rb;
		if (ra === 2) return TAIL_CHANNELS.indexOf(a.channel) - TAIL_CHANNELS.indexOf(b.channel);
		return count(b) - count(a) || ALL_CHANNELS.indexOf(a.channel) - ALL_CHANNELS.indexOf(b.channel);
	});
}

export interface DetailItem {
	name: string;
	sessions: number;
}

/** 依數字降冪（同數依名稱）。 */
export function sortDetails(items: DetailItem[]): DetailItem[] {
	return [...items].sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name, 'zh-TW'));
}
