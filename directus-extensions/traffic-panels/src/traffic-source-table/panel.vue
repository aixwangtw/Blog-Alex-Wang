<template>
	<div class="traffic-table-wrap">
		<div v-if="errorText" class="state error">{{ errorText }}</div>
		<div v-else-if="loading" class="state">載入中…</div>
		<table v-else class="traffic-table" :style="{ width: '100%', minWidth: `${totalWidth}px` }">
			<colgroup>
				<col v-for="column in COLUMNS" :key="column.key" :style="{ width: `${widths[column.key]}px` }" />
			</colgroup>
			<thead>
				<tr>
					<th
						v-for="column in COLUMNS"
						:key="column.key"
						:class="{ num: column.numeric }"
						:title="`點擊依「${column.label}」排序，拖拉右緣調整寬度`"
						@click="toggleSort(column.key)"
					>
						<span class="head-text">
							{{ column.label }}
							<span v-if="sortKey === column.key" class="sort-mark">{{ sortDesc ? '▼' : '▲' }}</span>
						</span>
						<span class="resizer" @click.stop @pointerdown.stop.prevent="startResize($event, column.key)"></span>
					</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in sortedRows" :key="`${row.channel}|${row.path}`">
					<td
						class="text-cell"
						:class="{ 'has-detail': row.details.length > 0 }"
						:title="row.details.length > 0 ? '' : row.channel"
						@mouseenter="showTip($event, row)"
						@mousemove="moveTip"
						@mouseleave="tip.visible = false"
					>{{ row.channel }}</td>
					<td class="text-cell" :title="row.path">{{ row.title }}</td>
					<td class="num">{{ formatNumber(row.sessions) }}</td>
					<td class="num">{{ formatNumber(row.views) }}</td>
				</tr>
				<tr v-if="sortedRows.length === 0">
					<td :colspan="COLUMNS.length" class="state">沒有資料。</td>
				</tr>
			</tbody>
		</table>
		<DetailPopover :visible="tip.visible" :x="tip.x" :y="tip.y" :title="tip.title" :rows="tip.rows" />
	</div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { type DetailItem, sortChannels, sortDetails } from '../shared/channels';
import DetailPopover from '../shared/DetailPopover.vue';
import { formatNumber, readStorage, writeStorage } from '../shared/format';
import { query } from '../shared/query';

interface Row {
	channel: string;
	/** 「其他」底下的細項（人數／造訪次數多到少），其他分類為空。 */
	details: DetailItem[];
	path: string;
	title: string;
	sessions: number;
	views: number;
}
type ColumnKey = 'channel' | 'title' | 'sessions' | 'views';

const COLUMNS: { key: ColumnKey; label: string; numeric: boolean }[] = [
	{ key: 'channel', label: '入口', numeric: false },
	{ key: 'title', label: '進站頁', numeric: false },
	{ key: 'sessions', label: '造訪次數', numeric: true },
	{ key: 'views', label: '觀看次數', numeric: true },
];
const DEFAULT_WIDTHS: Record<ColumnKey, number> = { channel: 160, title: 420, sessions: 120, views: 120 };
const MIN_WIDTH = 60;
const STORAGE_KEY = 'traffic-panels:widths:sources';

const tip = ref({ visible: false, x: 0, y: 0, title: '', rows: [] as { name: string; value: string; indent?: boolean }[] });
function showTip(event: MouseEvent, row: Row) {
	if (row.details.length === 0) {
		tip.value.visible = false;
		return;
	}
	tip.value = { visible: true, x: event.clientX, y: event.clientY, title: `「${row.channel}」的細項（造訪次數）`, rows: row.details.map((item) => ({ name: item.name, value: formatNumber(item.sessions) })) };
}
function moveTip(event: MouseEvent) {
	if (tip.value.visible) tip.value = { ...tip.value, x: event.clientX, y: event.clientY };
}

const api = useApi();
const loading = ref(true);
const errorText = ref('');
const rows = ref<Row[]>([]);
const widths = ref<Record<ColumnKey, number>>({ ...DEFAULT_WIDTHS });
const totalWidth = computed(() => COLUMNS.reduce((sum, column) => sum + widths.value[column.key], 0));

function loadWidths() {
	const saved = readStorage<Partial<Record<ColumnKey, number>>>(STORAGE_KEY, {});
	const next = { ...DEFAULT_WIDTHS };
	for (const column of COLUMNS) {
		const value = Number(saved[column.key]);
		if (Number.isFinite(value) && value >= MIN_WIDTH) next[column.key] = value;
	}
	widths.value = next;
}

let resizing: { key: ColumnKey; startX: number; startWidth: number } | null = null;

function startResize(event: PointerEvent, key: ColumnKey) {
	resizing = { key, startX: event.clientX, startWidth: widths.value[key] };
	window.addEventListener('pointermove', onResizeMove);
	window.addEventListener('pointerup', stopResize);
}
function onResizeMove(event: PointerEvent) {
	if (!resizing) return;
	const next = Math.max(MIN_WIDTH, Math.round(resizing.startWidth + event.clientX - resizing.startX));
	widths.value = { ...widths.value, [resizing.key]: next };
}
function stopResize() {
	window.removeEventListener('pointermove', onResizeMove);
	window.removeEventListener('pointerup', stopResize);
	if (resizing) writeStorage(STORAGE_KEY, widths.value);
	resizing = null;
}

/** 路徑比對用：去掉查詢字串、補結尾斜線、轉小寫。 */
function normalizePath(path: string): string {
	let value = String(path ?? '').split('#')[0].split('?')[0].toLowerCase();
	if (!value.startsWith('/')) value = `/${value}`;
	return value.endsWith('/') ? value : `${value}/`;
}

// 預設排序（sortKey 為 null）：入口分類依固定順序，同一分類內依造訪次數多到少；點欄位標題才改用該欄排序。
const sortKey = ref<ColumnKey | null>(null);
const sortDesc = ref(true);

/** 入口分類的固定順序名次（依各分類造訪次數合計）。 */
const channelRank = computed(() => {
	const totals = new Map<string, number>();
	for (const row of rows.value) totals.set(row.channel, (totals.get(row.channel) ?? 0) + row.sessions);
	const ordered = sortChannels([...totals].map(([channel, sessions]) => ({ channel, sessions })), 'sessions');
	return new Map(ordered.map((item, index) => [item.channel, index]));
});

function toggleSort(key: ColumnKey) {
	if (sortKey.value === key) {
		sortDesc.value = !sortDesc.value;
	} else {
		sortKey.value = key;
		sortDesc.value = key === 'sessions' || key === 'views';
	}
}

const sortedRows = computed(() => {
	const key = sortKey.value;
	const ranks = channelRank.value;
	if (key === null) {
		return [...rows.value].sort((a, b) => (ranks.get(a.channel) ?? 0) - (ranks.get(b.channel) ?? 0) || b.sessions - a.sessions || a.path.localeCompare(b.path));
	}
	const direction = sortDesc.value ? -1 : 1;
	return [...rows.value].sort((a, b) => {
		if (key === 'channel') {
			// 入口欄也照固定順序（升冪＝固定順序，降冪＝反過來）。
			return ((ranks.get(a.channel) ?? 0) - (ranks.get(b.channel) ?? 0)) * direction || b.sessions - a.sessions || a.path.localeCompare(b.path);
		}
		const left = a[key];
		const right = b[key];
		const result =
			typeof left === 'string' || typeof right === 'string'
				? String(left).localeCompare(String(right), 'zh-TW')
				: (left as number) - (right as number);
		return result * direction || b.sessions - a.sessions || a.path.localeCompare(b.path);
	});
});

async function load() {
	loading.value = true;
	errorText.value = '';
	try {
		const [sources, articles, pages] = await Promise.all([
			api.get(`/items/traffic_sources?${query({ 'aggregate[sum]': 'sessions,views', 'groupBy[]': 'channel,channel_detail,landing_page', limit: -1 })}`),
			api.get(`/items/articles?${query({ fields: 'slug,title', limit: -1 })}`),
			api.get(`/items/page_views?${query({ fields: 'path,name', limit: -1 })}`),
		]);
		const titles = new Map<string, string>();
		for (const item of pages.data.data ?? []) if (item.path && item.name) titles.set(normalizePath(item.path), item.name);
		for (const item of articles.data.data ?? []) if (item.slug && item.title) titles.set(normalizePath(`/blog/${item.slug}/`), item.title);

		// 同一（入口分類, 進站頁）可能有多筆細項，合併成一列並保留細項。
		const merged = new Map<string, Row>();
		for (const item of sources.data.data ?? []) {
			if (!item.landing_page) continue;
			const path = normalizePath(item.landing_page);
			const channel = item.channel || '其他';
			const key = `${channel}|${path}`;
			const sessions = Number(item.sum?.sessions ?? 0);
			const row = merged.get(key) ?? { channel, details: [], path, title: titles.get(path) ?? (path === '/' ? '首頁' : path), sessions: 0, views: 0 };
			row.sessions += sessions;
			row.views += Number(item.sum?.views ?? 0);
			if (channel === '其他') row.details.push({ name: item.channel_detail || '查不出來源', sessions });
			merged.set(key, row);
		}
		for (const row of merged.values()) row.details = sortDetails(row.details);
		rows.value = [...merged.values()];
	} catch (error: any) {
		errorText.value = `讀取失敗：${error?.response?.data?.errors?.[0]?.message ?? error?.message ?? error}`;
	} finally {
		loading.value = false;
	}
}

onMounted(() => {
	loadWidths();
	load();
});
onBeforeUnmount(stopResize);
</script>

<style scoped>
.traffic-table-wrap {
	height: 100%;
	overflow: auto;
	font-size: 13px;
}
.traffic-table {
	table-layout: fixed;
	border-collapse: collapse;
}
.traffic-table th,
.traffic-table td {
	padding: 8px 10px;
	text-align: left;
	border-bottom: 1px solid var(--theme--border-color-subdued, rgba(128, 128, 128, 0.25));
	overflow: hidden;
	white-space: nowrap;
}
.traffic-table thead th {
	position: sticky;
	top: 0;
	z-index: 2;
	background: var(--theme--background-subdued, #f0f4f9);
	color: var(--theme--foreground-subdued, #666);
	font-weight: 600;
	user-select: none;
	text-overflow: ellipsis;
	cursor: pointer;
}
.sort-mark {
	font-size: 10px;
	margin-left: 2px;
}
.resizer {
	position: absolute;
	top: 0;
	right: 0;
	width: 8px;
	height: 100%;
	cursor: col-resize;
	touch-action: none;
}
.resizer::after {
	content: '';
	position: absolute;
	top: 20%;
	bottom: 20%;
	right: 3px;
	width: 1px;
	background: var(--theme--border-color, rgba(128, 128, 128, 0.5));
}
.resizer:hover::after {
	width: 2px;
	background: var(--theme--primary, #6644ff);
}
.num {
	text-align: right !important;
	font-variant-numeric: tabular-nums;
}
.text-cell {
	text-overflow: ellipsis;
}
.has-detail {
	text-decoration: underline dotted;
	cursor: help;
}
.traffic-table tbody tr:hover {
	background: var(--theme--background-subdued, rgba(128, 128, 128, 0.1));
}
.state {
	padding: 10px;
	color: var(--theme--foreground-subdued, #888);
}
.state.error {
	color: var(--theme--danger, #e35169);
}
</style>
