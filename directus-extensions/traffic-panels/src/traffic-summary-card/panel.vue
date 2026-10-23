<template>
	<div
		class="traffic-card"
		:class="{ 'has-header': showHeader }"
		@mouseenter="onEnter"
		@mousemove="onMove"
		@mouseleave="onLeave"
	>
		<div v-if="errorText" class="state error">{{ errorText }}</div>
		<div v-else-if="loading" class="state">載入中…</div>
		<div v-else class="cells">
			<div v-for="cell in cells" :key="cell.label" class="cell" @mouseenter="cellTip = cell.tip ?? null">
				<div class="value">{{ cell.value }}</div>
				<div class="label">{{ cell.label }}</div>
			</div>
		</div>

		<Teleport to="body">
			<div v-if="hovering && shownDetails.length > 0" class="traffic-popover" :style="popoverStyle">
				<div class="popover-title">{{ shownTitle }}</div>
				<table>
					<thead v-if="shownHead.length > 0">
						<tr>
							<th v-for="(head, index) in shownHead" :key="index" :class="{ num: index > 0 }">{{ head }}</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(row, rowIndex) in shownDetails" :key="`${rowIndex}-${row[0]}`">
							<td v-for="(cell, index) in row" :key="index" :class="{ num: index > 0 }">{{ cell }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { computed, onMounted, ref, watch } from 'vue';
import { formatDate, formatDecimal, formatNumber, todayIn } from '../shared/format';
import { KINDS, query } from '../shared/query';

const props = withDefaults(
	defineProps<{ kind?: 'users' | 'articles' | 'pages' | 'content-posts' | 'content-quality' | 'content-links'; timezone?: string; showHeader?: boolean }>(),
	{ kind: 'users', timezone: 'Asia/Taipei', showHeader: false },
);

const api = useApi();
const loading = ref(true);
const errorText = ref('');
interface Tip {
	title: string;
	head: string[];
	rows: string[][];
}
const cells = ref<{ label: string; value: string; tip?: Tip }[]>([]);
/** 滑鼠目前所在那一格自己的提示（有的話優先於整張卡片共用的提示）。 */
const cellTip = ref<Tip | null>(null);
const shownDetails = computed(() => (cellTip.value ? cellTip.value.rows : details.value));
const shownHead = computed(() => (cellTip.value ? cellTip.value.head : detailHead.value));
const shownTitle = computed(() => (cellTip.value ? cellTip.value.title : detailTitle.value));
const detailTitle = ref('');
const detailHead = ref<string[]>([]);
const details = ref<string[][]>([]);

const hovering = ref(false);
const pointer = ref({ x: 0, y: 0 });

const popoverStyle = computed(() => {
	const width = 300;
	const left = Math.max(8, Math.min(pointer.value.x + 14, window.innerWidth - width - 8));
	const top = Math.max(8, Math.min(pointer.value.y + 18, window.innerHeight - 180));
	return { left: `${left}px`, top: `${top}px`, width: `${width}px` };
});

function onEnter(event: MouseEvent) {
	hovering.value = true;
	pointer.value = { x: event.clientX, y: event.clientY };
}
function onMove(event: MouseEvent) {
	pointer.value = { x: event.clientX, y: event.clientY };
}
function onLeave() {
	hovering.value = false;
	cellTip.value = null;
}

async function aggregate(collection: string, params: Record<string, string>) {
	const response = await api.get(`/items/${collection}?${query({ ...params, limit: 1 })}`);
	return response.data.data?.[0] ?? {};
}

async function loadUsers() {
	const row = (await api.get(`/items/audience_metrics?${query({ 'filter[key][_eq]': 'site', limit: 1 })}`)).data.data?.[0];
	if (!row) throw new Error('audience_metrics 沒有 key=site 的資料');
	// 今日入口：audience_metrics.today_sources（同步腳本寫入的 [{channel, users}]，人數多的在前）。
	let sources: { channel: string; users: number; details?: { name: string; users: number }[] }[] = [];
	try {
		const raw = typeof row.today_sources === 'string' ? JSON.parse(row.today_sources) : row.today_sources;
		if (Array.isArray(raw)) sources = raw.filter((item) => item && item.channel);
	} catch {
		sources = [];
	}
	// 「其他」底下接細項（縮排，人數多到少；同步腳本已排序）。
	const todayRows = sources.flatMap((item) => [
		[String(item.channel), formatNumber(item.users)],
		...(Array.isArray(item.details) ? item.details.filter((detail) => Number(detail.users) > 0).map((detail) => [`　└ ${detail.name}`, formatNumber(detail.users)]) : []),
	]);
	cells.value = [
		{
			label: '今日活躍',
			value: formatNumber(row.active_users_today),
			// 今日入口不放在卡片上，滑鼠移到這一格才在彈窗顯示（含 0 人的 LINE、YouTube 等）。
			tip: todayRows.length > 0 ? { title: '今日入口（活躍使用者）', head: ['入口', '人數'], rows: todayRows } : undefined,
		},
		{ label: '近 30 天活躍', value: formatNumber(row.active_users_30d) },
		{ label: '總使用者', value: formatNumber(row.total_users) },
	];
	detailTitle.value = '裝置分布';
	detailHead.value = ['裝置', '累積', '近 30 天'];
	const rows: [string, string, string][] = [
		['桌機', 'desktop_users', 'desktop_users_30d'],
		['手機', 'mobile_users', 'mobile_users_30d'],
		['平板', 'tablet_users', 'tablet_users_30d'],
	];
	const result = rows.map(([label, total, recent]) => [label, formatNumber(row[total]), formatNumber(row[recent])]);
	// 其他裝置（smart tv 等）有資料才列出，避免被靜默漏計。
	if (Number(row.other_users) > 0 || Number(row.other_users_30d) > 0) {
		result.push(['其他', formatNumber(row.other_users), formatNumber(row.other_users_30d)]);
	}
	details.value = result;
}

async function loadContent(kind: 'articles' | 'pages') {
	const { collection, contentType } = KINDS[kind];
	// 文章只算已發布：草稿不計入近 30 天、累積與當日。
	const published = kind === 'articles';
	let publishedPaths = '';
	if (published) {
		const slugs = (await api.get(`/items/articles?${query({ fields: 'slug', 'filter[status][_eq]': 'published', limit: -1 })}`)).data.data ?? [];
		publishedPaths = slugs.map((item: any) => `/blog/${item.slug}/`).join(',');
	}
	const [today, totals] = await Promise.all([
		published && !publishedPaths
			? Promise.resolve({})
			: aggregate('daily_content_views', {
					'aggregate[sum]': 'views',
					'filter[content_type][_eq]': contentType,
					'filter[date][_eq]': todayIn(props.timezone),
					...(published ? { 'filter[path][_in]': publishedPaths } : {}),
				}),
		aggregate(collection, {
			'aggregate[sum]': 'views,views_30d',
			'aggregate[avg]': 'avg_engagement_seconds_30d',
			...(published ? { 'filter[status][_eq]': 'published' } : {}),
		}),
	]);
	// Directus 對沒有符合列的 sum 會回 null，顯示成 0 比「—」合理。
	cells.value = [
		{ label: '當日', value: formatNumber(today.sum?.views ?? 0) },
		{ label: '近 30 天', value: formatNumber(totals.sum?.views_30d ?? 0) },
		{ label: '累積', value: formatNumber(totals.sum?.views ?? 0) },
	];
	detailTitle.value = '停留時間';
	detailHead.value = [];
	const avg = totals.avg?.avg_engagement_seconds_30d;
	details.value = [[`平均停留（近 30 天）`, avg === null || avg === undefined ? '—' : `${formatNumber(avg)} 秒`]];
}

// ── 內容統計卡片（「文章產出與品質」儀表板）：口徑一律只算已發布 ──

async function fetchPublishedArticles() {
	const response = await api.get(`/items/articles?${query({ fields: 'slug,title,pub_date,featured', 'filter[status][_eq]': 'published', sort: 'pub_date', limit: -1 })}`);
	return (response.data.data ?? []) as { slug: string; title: string; pub_date: string | null; featured: boolean }[];
}

async function fetchStats() {
	const response = await api.get(`/items/content_stats?${query({ limit: -1 })}`);
	return (response.data.data ?? []) as any[];
}

async function loadContentPosts() {
	const [published, draft, latestHistory] = await Promise.all([
		fetchPublishedArticles(),
		aggregate('articles', { 'aggregate[count]': 'id', 'filter[status][_neq]': 'published' }),
		api.get(`/items/content_stats_history?${query({ fields: 'max_gap_days,run_date', sort: '-run_date', limit: 1 })}`),
	]);
	const dates = published.map((item) => item.pub_date).filter((value): value is string => Boolean(value)).sort();
	const gap = latestHistory.data.data?.[0]?.max_gap_days;
	cells.value = [
		{ label: '已發布', value: formatNumber(published.length) },
		{ label: '草稿', value: formatNumber(draft.count?.id ?? draft.count ?? 0) },
		{ label: '主打', value: formatNumber(published.filter((item) => item.featured).length) },
	];
	detailTitle.value = '發文時間';
	detailHead.value = [];
	details.value = [
		['第一篇發布日', formatDate(dates[0])],
		['最新一篇發布日', formatDate(dates[dates.length - 1])],
		['最長多久沒發文', gap === null || gap === undefined ? '—' : `${formatNumber(gap)} 天`],
	];
}

async function loadContentQuality() {
	const stats = await fetchStats();
	const average = (field: string) => (stats.length === 0 ? null : stats.reduce((sum, item) => sum + Number(item[field] ?? 0), 0) / stats.length);
	const byWords = [...stats].sort((a, b) => Number(a.word_count) - Number(b.word_count));
	const fewest = byWords[0];
	const most = byWords[byWords.length - 1];
	cells.value = [
		{ label: '平均字數', value: formatNumber(average('word_count')) },
		{ label: '平均標籤數', value: formatDecimal(average('tag_count')) },
		{ label: '平均 FAQ 數', value: formatDecimal(average('faq_count')) },
	];
	detailTitle.value = '字數最少與最多';
	detailHead.value = [];
	details.value = [
		['最少', fewest ? `${formatNumber(fewest.word_count)} 字` : '—'],
		...(fewest ? [[String(fewest.title), '']] : []),
		['最多', most ? `${formatNumber(most.word_count)} 字` : '—'],
		...(most ? [[String(most.title), '']] : []),
	];
}

async function loadContentLinks() {
	const stats = await fetchStats();
	const titles = (list: any[]) => (list.length === 0 ? [['（沒有）']] : list.map((item) => [String(item.title || item.slug)]));
	const islands = stats.filter((item) => item.is_island);
	const deadEnds = stats.filter((item) => item.is_dead_end);
	cells.value = [
		{ label: '沒有其他文章連進來', value: formatNumber(islands.length), tip: { title: '沒有其他文章連進來的文章', head: [], rows: titles(islands) } },
		{ label: '沒有連到其他文章', value: formatNumber(deadEnds.length), tip: { title: '沒有連到其他文章的文章', head: [], rows: titles(deadEnds) } },
	];
	detailTitle.value = '';
	details.value = [];
}

async function load() {
	loading.value = true;
	errorText.value = '';
	try {
		cellTip.value = null;
		if (props.kind === 'users') await loadUsers();
		else if (props.kind === 'content-posts') await loadContentPosts();
		else if (props.kind === 'content-quality') await loadContentQuality();
		else if (props.kind === 'content-links') await loadContentLinks();
		else await loadContent(props.kind);
	} catch (error: any) {
		errorText.value = `讀取失敗：${error?.response?.data?.errors?.[0]?.message ?? error?.message ?? error}`;
	} finally {
		loading.value = false;
	}
}

onMounted(load);
watch(() => [props.kind, props.timezone], load);
</script>

<style scoped>
.traffic-card {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: 0 12px;
	cursor: default;
	container-type: inline-size;
}
.traffic-card.has-header {
	padding-top: 0;
}
.cells {
	display: flex;
	width: 100%;
	justify-content: space-around;
	align-items: stretch;
	gap: 8px;
}
.cell {
	flex: 1 1 0;
	min-width: 0;
	text-align: center;
}
.cell + .cell {
	border-left: 1px solid var(--theme--border-color-subdued, rgba(128, 128, 128, 0.3));
}
.value {
	font-size: clamp(18px, 7.5cqw, 36px);
	font-weight: 700;
	line-height: 1.1;
	color: var(--theme--foreground-accent, inherit);
	font-variant-numeric: tabular-nums;
}
.label {
	margin-top: 4px;
	font-size: 13px;
	color: var(--theme--foreground-subdued, #888);
}
.state {
	color: var(--theme--foreground-subdued, #888);
}
.state.error {
	color: var(--theme--danger, #e35169);
	font-size: 13px;
}
</style>

<style>
.traffic-popover {
	position: fixed;
	z-index: 10000;
	pointer-events: none;
	padding: 10px 12px;
	border-radius: 8px;
	background: var(--theme--background, #fff);
	color: var(--theme--foreground, #172940);
	border: 1px solid var(--theme--border-color, #d3dae4);
	box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
	font-size: 13px;
}
.traffic-popover .popover-title {
	margin-bottom: 6px;
	font-weight: 600;
	color: var(--theme--foreground-accent, inherit);
}
.traffic-popover table {
	width: 100%;
	border-collapse: collapse;
}
.traffic-popover th,
.traffic-popover td {
	padding: 3px 0;
	text-align: left;
}
.traffic-popover th {
	font-weight: 500;
	color: var(--theme--foreground-subdued, #888);
}
.traffic-popover .num {
	text-align: right;
	font-variant-numeric: tabular-nums;
}
</style>
