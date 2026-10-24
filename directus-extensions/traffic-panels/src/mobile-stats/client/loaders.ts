/**
 * 手機版用的資料讀取：查詢條件與計算方式逐一對照桌面版面板（src/<panel>/panel.vue），
 * 數字必須一致。改了桌面版面板的口徑，這裡也要一起改。
 * 共用的分類排序、格式化、查詢字串都直接用 ../../shared/。
 */
import { type DetailItem, sortChannels, sortDetails, withPinned } from '../../shared/channels';
import { formatDate, formatDecimal, formatNumber, todayIn } from '../../shared/format';
import { KINDS, query } from '../../shared/query';

/** 呼叫 Directus REST，回傳 JSON 本體（{ data }）。 */
export type Getter = (path: string) => Promise<any>;

const TIMEZONE = 'Asia/Taipei';

export interface Tip {
	title: string;
	head: string[];
	rows: string[][];
}
export interface Cell {
	label: string;
	value: string;
	tip?: Tip;
}
export interface Card {
	cells: Cell[];
	/** 桌面版 hover 整張卡片顯示的細項，手機版直接列在卡片下方。 */
	detail?: Tip;
}

async function aggregate(get: Getter, collection: string, params: Record<string, string>) {
	const body = await get(`/items/${collection}?${query({ ...params, limit: 1 })}`);
	return body.data?.[0] ?? {};
}

/** 路徑比對用：去掉查詢字串、補結尾斜線、轉小寫（同 traffic-content-table／traffic-source-table）。 */
export function normalizePath(path: string): string {
	let value = String(path ?? '').split('#')[0].split('?')[0].toLowerCase();
	if (!value.startsWith('/')) value = `/${value}`;
	return value.endsWith('/') ? value : `${value}/`;
}

// ── 卡片（traffic-summary-card） ──

export async function loadUsersCard(get: Getter): Promise<Card> {
	const row = (await get(`/items/audience_metrics?${query({ 'filter[key][_eq]': 'site', limit: 1 })}`)).data?.[0];
	if (!row) throw new Error('audience_metrics 沒有 key=site 的資料');
	let sources: { channel: string; users: number; details?: { name: string; users: number }[] }[] = [];
	try {
		const raw = typeof row.today_sources === 'string' ? JSON.parse(row.today_sources) : row.today_sources;
		if (Array.isArray(raw)) sources = raw.filter((item) => item && item.channel);
	} catch {
		sources = [];
	}
	const todayRows = sources.flatMap((item) => [
		[String(item.channel), formatNumber(item.users)],
		...(Array.isArray(item.details) ? item.details.filter((detail) => Number(detail.users) > 0).map((detail) => [`　└ ${detail.name}`, formatNumber(detail.users)]) : []),
	]);
	const devices: [string, string, string][] = [
		['桌機', 'desktop_users', 'desktop_users_30d'],
		['手機', 'mobile_users', 'mobile_users_30d'],
		['平板', 'tablet_users', 'tablet_users_30d'],
	];
	const deviceRows = devices.map(([label, total, recent]) => [label, formatNumber(row[total]), formatNumber(row[recent])]);
	if (Number(row.other_users) > 0 || Number(row.other_users_30d) > 0) {
		deviceRows.push(['其他', formatNumber(row.other_users), formatNumber(row.other_users_30d)]);
	}
	return {
		cells: [
			{
				label: '今日活躍',
				value: formatNumber(row.active_users_today),
				tip: todayRows.length > 0 ? { title: '今日入口（活躍使用者）', head: ['入口', '人數'], rows: todayRows } : undefined,
			},
			{ label: '近 30 天活躍', value: formatNumber(row.active_users_30d) },
			{ label: '總使用者', value: formatNumber(row.total_users) },
		],
		detail: { title: '裝置分布', head: ['裝置', '累積', '近 30 天'], rows: deviceRows },
	};
}

export async function loadViewsCard(get: Getter, kind: 'articles' | 'pages'): Promise<Card> {
	const { collection, contentType } = KINDS[kind];
	const published = kind === 'articles';
	let publishedPaths = '';
	if (published) {
		const slugs = (await get(`/items/articles?${query({ fields: 'slug', 'filter[status][_eq]': 'published', limit: -1 })}`)).data ?? [];
		publishedPaths = slugs.map((item: any) => `/blog/${item.slug}/`).join(',');
	}
	const [today, totals] = await Promise.all([
		published && !publishedPaths
			? Promise.resolve({} as any)
			: aggregate(get, 'daily_content_views', {
					'aggregate[sum]': 'views',
					'filter[content_type][_eq]': contentType,
					'filter[date][_eq]': todayIn(TIMEZONE),
					...(published ? { 'filter[path][_in]': publishedPaths } : {}),
				}),
		aggregate(get, collection, {
			'aggregate[sum]': 'views,views_30d',
			'aggregate[avg]': 'avg_engagement_seconds_30d',
			...(published ? { 'filter[status][_eq]': 'published' } : {}),
		}),
	]);
	const avg = totals.avg?.avg_engagement_seconds_30d;
	return {
		cells: [
			{ label: '當日', value: formatNumber(today.sum?.views ?? 0) },
			{ label: '近 30 天', value: formatNumber(totals.sum?.views_30d ?? 0) },
			{ label: '累積', value: formatNumber(totals.sum?.views ?? 0) },
		],
		detail: { title: '停留時間', head: [], rows: [['平均停留（近 30 天）', avg === null || avg === undefined ? '—' : `${formatNumber(avg)} 秒`]] },
	};
}

async function fetchStats(get: Getter): Promise<any[]> {
	return (await get(`/items/content_stats?${query({ limit: -1 })}`)).data ?? [];
}

export async function loadPostsCard(get: Getter): Promise<Card> {
	const [publishedBody, draft, latestHistory] = await Promise.all([
		get(`/items/articles?${query({ fields: 'slug,title,pub_date,featured', 'filter[status][_eq]': 'published', sort: 'pub_date', limit: -1 })}`),
		aggregate(get, 'articles', { 'aggregate[count]': 'id', 'filter[status][_neq]': 'published' }),
		get(`/items/content_stats_history?${query({ fields: 'max_gap_days,run_date', sort: '-run_date', limit: 1 })}`),
	]);
	const published = (publishedBody.data ?? []) as { pub_date: string | null; featured: boolean }[];
	const dates = published.map((item) => item.pub_date).filter((value): value is string => Boolean(value)).sort();
	const gap = latestHistory.data?.[0]?.max_gap_days;
	return {
		cells: [
			{ label: '已發布', value: formatNumber(published.length) },
			{ label: '草稿', value: formatNumber(draft.count?.id ?? draft.count ?? 0) },
			{ label: '主打', value: formatNumber(published.filter((item) => item.featured).length) },
		],
		detail: {
			title: '發文時間',
			head: [],
			rows: [
				['第一篇發布日', formatDate(dates[0])],
				['最新一篇發布日', formatDate(dates[dates.length - 1])],
				['最長多久沒發文', gap === null || gap === undefined ? '—' : `${formatNumber(gap)} 天`],
			],
		},
	};
}

export async function loadQualityCard(get: Getter): Promise<Card> {
	const stats = await fetchStats(get);
	const average = (field: string) => (stats.length === 0 ? null : stats.reduce((sum, item) => sum + Number(item[field] ?? 0), 0) / stats.length);
	const byWords = [...stats].sort((a, b) => Number(a.word_count) - Number(b.word_count));
	const fewest = byWords[0];
	const most = byWords[byWords.length - 1];
	return {
		cells: [
			{ label: '平均字數', value: formatNumber(average('word_count')) },
			{ label: '平均標籤數', value: formatDecimal(average('tag_count')) },
			{ label: '平均 FAQ 數', value: formatDecimal(average('faq_count')) },
		],
		detail: {
			title: '字數最少與最多',
			head: [],
			rows: [
				['最少', fewest ? `${formatNumber(fewest.word_count)} 字` : '—'],
				...(fewest ? [[String(fewest.title), '']] : []),
				['最多', most ? `${formatNumber(most.word_count)} 字` : '—'],
				...(most ? [[String(most.title), '']] : []),
			],
		},
	};
}

export async function loadLinksCard(get: Getter): Promise<Card> {
	const stats = await fetchStats(get);
	const titles = (list: any[]) => (list.length === 0 ? [['（沒有）']] : list.map((item) => [String(item.title || item.slug)]));
	const islands = stats.filter((item) => item.is_island);
	const deadEnds = stats.filter((item) => item.is_dead_end);
	return {
		cells: [
			{ label: '沒有其他文章連進來', value: formatNumber(islands.length), tip: { title: '沒有其他文章連進來的文章', head: [], rows: titles(islands) } },
			{ label: '沒有連到其他文章', value: formatNumber(deadEnds.length), tip: { title: '沒有連到其他文章的文章', head: [], rows: titles(deadEnds) } },
		],
	};
}

// ── 觀看明細（traffic-content-table） ──

export interface Entry {
	channel: string;
	sessions: number;
	details?: DetailItem[];
}
export interface ContentRow {
	path: string;
	title: string;
	today: number;
	views30d: number;
	views: number;
	avg: number | null;
	entries: Entry[];
	entrySessions: number;
	entryShare: number | null;
}

export async function loadContentRows(get: Getter, kind: 'articles' | 'pages'): Promise<ContentRow[]> {
	const { collection, contentType } = KINDS[kind];
	const fields = kind === 'articles' ? 'slug,title' : 'path,name';
	const [list, today, sources] = await Promise.all([
		get(`/items/${collection}?${query({ fields: `${fields},views,views_30d,avg_engagement_seconds_30d`, 'filter[status][_eq]': kind === 'articles' ? 'published' : undefined, limit: -1 })}`),
		get(`/items/daily_content_views?${query({ 'aggregate[sum]': 'views', 'groupBy[]': 'path', 'filter[content_type][_eq]': contentType, 'filter[date][_eq]': todayIn(TIMEZONE), limit: -1 })}`),
		get(`/items/traffic_sources?${query({ 'aggregate[sum]': 'sessions', 'groupBy[]': 'landing_page,channel,channel_detail', limit: -1 })}`),
	]);
	const entriesByPath = new Map<string, Entry[]>();
	for (const item of sources.data ?? []) {
		const sessions = Number(item.sum?.sessions ?? 0);
		if (!item.landing_page || sessions <= 0) continue;
		const key = normalizePath(item.landing_page);
		const entries = entriesByPath.get(key) ?? [];
		const channel = item.channel || '其他';
		let entry = entries.find((candidate) => candidate.channel === channel);
		if (!entry) {
			entry = { channel, sessions: 0 };
			entries.push(entry);
		}
		entry.sessions += sessions;
		if (item.channel_detail) entry.details = [...(entry.details ?? []), { name: item.channel_detail, sessions }];
		entriesByPath.set(key, entries);
	}
	for (const entries of entriesByPath.values()) for (const entry of entries) if (entry.details) entry.details = sortDetails(entry.details);
	const todayByPath = new Map<string, number>();
	for (const item of today.data ?? []) todayByPath.set(item.path, Number(item.sum?.views ?? 0));

	return (list.data ?? []).map((item: any): ContentRow => {
		const path = kind === 'articles' ? `/blog/${item.slug}/` : item.path;
		const entries = withPinned(entriesByPath.get(normalizePath(path)) ?? [], 'sessions', (channel) => ({ channel, sessions: 0 }));
		const entrySessions = entries.reduce((sum, entry) => sum + entry.sessions, 0);
		return {
			entries,
			entrySessions,
			entryShare: entrySessions > 0 ? Math.max(...entries.map((entry) => entry.sessions)) / entrySessions : null,
			path,
			title: (kind === 'articles' ? item.title : item.name) || path,
			today: todayByPath.get(path) ?? 0,
			views30d: Number(item.views_30d ?? 0),
			views: Number(item.views ?? 0),
			avg: item.avg_engagement_seconds_30d === null || item.avg_engagement_seconds_30d === undefined ? null : Number(item.avg_engagement_seconds_30d),
		};
	});
}

/** 「主要入口」是造訪最多的那一類（同桌面版 entryText）。 */
export function entryText(row: ContentRow): string {
	if (row.entries.length === 0 || row.entrySessions <= 0) return '—';
	const main = row.entries.reduce((best, entry) => (entry.sessions > best.sessions ? entry : best), row.entries[0]);
	return `${main.channel} ${Math.round(row.entryShare! * 100)}%`;
}

export async function loadDailyDetail(get: Getter, kind: 'articles' | 'pages', path: string): Promise<any[]> {
	const body = await get(`/items/daily_content_views?${query({ fields: 'date,views,active_users,total_users', 'filter[path][_eq]': path, 'filter[content_type][_eq]': KINDS[kind].contentType, sort: '-date', limit: -1 })}`);
	return body.data ?? [];
}

// ── 熱門入口（traffic-channel-bars） ──

export interface ChannelRow {
	channel: string;
	sessions: number;
	details: DetailItem[];
}

export async function loadChannelBars(get: Getter): Promise<ChannelRow[]> {
	const body = await get(`/items/traffic_sources?${query({ 'aggregate[sum]': 'sessions', 'groupBy[]': 'channel,channel_detail', limit: -1 })}`);
	const byChannel = new Map<string, ChannelRow>();
	for (const item of body.data ?? []) {
		const channel = item.channel || '其他';
		const sessions = Number(item.sum?.sessions ?? 0);
		const row = byChannel.get(channel) ?? { channel, sessions: 0, details: [] };
		row.sessions += sessions;
		if (item.channel_detail) row.details.push({ name: item.channel_detail, sessions });
		byChannel.set(channel, row);
	}
	for (const row of byChannel.values()) row.details = sortDetails(row.details);
	return withPinned([...byChannel.values()], 'sessions', (channel) => ({ channel, sessions: 0, details: [] }));
}

// ── 流量入口與進站頁（traffic-source-table） ──

export interface SourceRow {
	channel: string;
	details: DetailItem[];
	path: string;
	title: string;
	sessions: number;
	views: number;
}

export async function loadSourceRows(get: Getter): Promise<SourceRow[]> {
	const [sources, articles, pages] = await Promise.all([
		get(`/items/traffic_sources?${query({ 'aggregate[sum]': 'sessions,views', 'groupBy[]': 'channel,channel_detail,landing_page', limit: -1 })}`),
		get(`/items/articles?${query({ fields: 'slug,title', limit: -1 })}`),
		get(`/items/page_views?${query({ fields: 'path,name', limit: -1 })}`),
	]);
	const titles = new Map<string, string>();
	for (const item of pages.data ?? []) if (item.path && item.name) titles.set(normalizePath(item.path), item.name);
	for (const item of articles.data ?? []) if (item.slug && item.title) titles.set(normalizePath(`/blog/${item.slug}/`), item.title);
	const merged = new Map<string, SourceRow>();
	for (const item of sources.data ?? []) {
		if (!item.landing_page) continue;
		const path = normalizePath(item.landing_page);
		const channel = item.channel || '其他';
		const key = `${channel}|${path}`;
		const sessions = Number(item.sum?.sessions ?? 0);
		const row = merged.get(key) ?? { channel, details: [], path, title: titles.get(path) ?? (path === '/' ? '首頁' : path), sessions: 0, views: 0 };
		row.sessions += sessions;
		row.views += Number(item.sum?.views ?? 0);
		if (item.channel_detail) row.details.push({ name: item.channel_detail, sessions });
		merged.set(key, row);
	}
	for (const row of merged.values()) row.details = sortDetails(row.details);
	return [...merged.values()];
}

/** 入口分類固定順序的名次（同桌面版 channelRank）。 */
export function channelRanks(rows: SourceRow[]): Map<string, number> {
	const totals = new Map<string, number>();
	for (const row of rows) totals.set(row.channel, (totals.get(row.channel) ?? 0) + row.sessions);
	const ordered = sortChannels([...totals].map(([channel, sessions]) => ({ channel, sessions })), 'sessions');
	return new Map(ordered.map((item, index) => [item.channel, index]));
}

// ── 文章明細（content-article-table） ──

export interface ArticleRow {
	slug: string;
	title: string;
	pubDate: string | null;
	updatedDate: string | null;
	wordCount: number | null;
	descLen: number | null;
	tagCount: number | null;
	faqCount: number | null;
	linkRank: number;
	linkText: string;
}

function linkStatus(stat: any): { rank: number; text: string } {
	if (!stat) return { rank: 4, text: '—（統計尚未產生）' };
	if (stat.is_island && stat.is_dead_end) return { rank: 0, text: '沒人連進來，也沒連出去' };
	if (stat.is_island) return { rank: 1, text: '沒有其他文章連進來' };
	if (stat.is_dead_end) return { rank: 2, text: '沒有連到其他文章' };
	return { rank: 3, text: `正常（${formatNumber(stat.inbound_link_count)} 篇連進來）` };
}

export async function loadArticleRows(get: Getter): Promise<ArticleRow[]> {
	const [articles, stats] = await Promise.all([
		get(`/items/articles?${query({ fields: 'slug,title,pub_date,updated_date', 'filter[status][_eq]': 'published', limit: -1 })}`),
		get(`/items/content_stats?${query({ limit: -1 })}`),
	]);
	const statBySlug = new Map<string, any>((stats.data ?? []).map((item: any) => [item.slug, item]));
	return (articles.data ?? []).map((item: any): ArticleRow => {
		const stat = statBySlug.get(item.slug);
		const link = linkStatus(stat);
		const num = (value: unknown) => (stat && value !== null && value !== undefined ? Number(value) : null);
		return {
			slug: item.slug,
			title: item.title || item.slug,
			pubDate: item.pub_date ?? null,
			updatedDate: item.updated_date ?? null,
			wordCount: num(stat?.word_count),
			descLen: num(stat?.desc_len),
			tagCount: num(stat?.tag_count),
			faqCount: num(stat?.faq_count),
			linkRank: link.rank,
			linkText: link.text,
		};
	});
}

// ── Directus 內建面板（time-series、pie-chart）對應的資料 ──

export interface Point {
	label: string;
	value: number;
}

/** 依日期欄位取出逐日數值（每日一列，sum/avg 等同原值；同一天多列時依 fn 合併）。 */
export async function loadDailySeries(get: Getter, collection: string, dateField: string, valueField: string, fn: 'sum' | 'avg'): Promise<Point[]> {
	const body = await get(`/items/${collection}?${query({ fields: `${dateField},${valueField}`, sort: dateField, limit: -1 })}`);
	const groups = new Map<string, number[]>();
	for (const item of body.data ?? []) {
		const day = String(item[dateField] ?? '').slice(0, 10);
		if (!day) continue;
		groups.set(day, [...(groups.get(day) ?? []), Number(item[valueField] ?? 0)]);
	}
	return [...groups].map(([label, values]) => ({
		label,
		value: fn === 'sum' ? values.reduce((a, b) => a + b, 0) : values.reduce((a, b) => a + b, 0) / values.length,
	}));
}

/** 已發布文章依 pub_date 每月篇數（同「每月發文數」面板的 filter）；中間沒發文的月份補 0。 */
export async function loadMonthlyPosts(get: Getter): Promise<Point[]> {
	const body = await get(`/items/articles?${query({ fields: 'pub_date', 'filter[status][_eq]': 'published', limit: -1 })}`);
	const counts = new Map<string, number>();
	for (const item of body.data ?? []) {
		const month = String(item.pub_date ?? '').slice(0, 7);
		if (month) counts.set(month, (counts.get(month) ?? 0) + 1);
	}
	const months = [...counts.keys()].sort();
	if (months.length === 0) return [];
	const result: Point[] = [];
	let [year, month] = months[0].split('-').map(Number);
	const last = months[months.length - 1];
	for (;;) {
		const key = `${year}-${String(month).padStart(2, '0')}`;
		result.push({ label: key, value: counts.get(key) ?? 0 });
		if (key >= last) break;
		month += 1;
		if (month > 12) {
			month = 1;
			year += 1;
		}
	}
	return result;
}

/** 發布狀態圓餅圖：依 status 計數。 */
export async function loadStatusCounts(get: Getter): Promise<Point[]> {
	const body = await get(`/items/articles?${query({ 'aggregate[count]': 'id', 'groupBy[]': 'status', limit: -1 })}`);
	return (body.data ?? [])
		.map((item: any) => ({ label: String(item.status ?? '（空白）'), value: Number(item.count?.id ?? item.count ?? 0) }))
		.sort((a: Point, b: Point) => b.value - a.value);
}
