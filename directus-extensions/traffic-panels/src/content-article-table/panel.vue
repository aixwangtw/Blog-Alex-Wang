<template>
	<div class="article-table-wrap">
		<div v-if="errorText" class="state error">{{ errorText }}</div>
		<div v-else-if="loading" class="state">載入中…</div>
		<table v-else class="article-table" :style="{ width: '100%', minWidth: `${totalWidth}px` }">
			<colgroup>
				<col v-for="column in COLUMNS" :key="column.key" :style="{ width: `${widths[column.key]}px` }" />
			</colgroup>
			<thead>
				<tr>
					<th
						v-for="column in COLUMNS"
						:key="column.key"
						:class="{ num: column.numeric }"
						:title="`${column.hint ? column.hint + '。' : ''}點擊依「${column.label}」排序，拖拉右緣調整寬度`"
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
				<tr v-for="row in sortedRows" :key="row.slug">
					<td class="text-cell" :title="row.title">{{ row.title }}</td>
					<td>{{ formatDate(row.pubDate) }}</td>
					<td>{{ formatDate(row.updatedDate) }}</td>
					<td class="num">{{ formatNumber(row.wordCount) }}</td>
					<td class="num">{{ formatNumber(row.descLen) }}</td>
					<td class="num">{{ formatNumber(row.tagCount) }}</td>
					<td class="num">{{ formatNumber(row.faqCount) }}</td>
					<td class="text-cell" :class="{ warn: row.linkRank < 3 }" :title="row.linkText">{{ row.linkText }}</td>
				</tr>
				<tr v-if="sortedRows.length === 0">
					<td :colspan="COLUMNS.length" class="state">沒有已發布的文章。</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { formatDate, formatNumber, readStorage, writeStorage } from '../shared/format';
import { query } from '../shared/query';

interface Row {
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

type ColumnKey = 'title' | 'pubDate' | 'updatedDate' | 'wordCount' | 'descLen' | 'tagCount' | 'faqCount' | 'linkRank';

const COLUMNS: { key: ColumnKey; label: string; numeric: boolean; hint?: string }[] = [
	{ key: 'title', label: '標題', numeric: false },
	{ key: 'pubDate', label: '發布日', numeric: false },
	{ key: 'updatedDate', label: '更新日', numeric: false },
	{ key: 'wordCount', label: '字數', numeric: true, hint: '正文字數' },
	{ key: 'descLen', label: 'SEO 描述字數', numeric: true, hint: 'SEO 描述（description）的字數，建議 40～80 字' },
	{ key: 'tagCount', label: '標籤數', numeric: true },
	{ key: 'faqCount', label: 'FAQ 數', numeric: true },
	{ key: 'linkRank', label: '站內連結狀況', numeric: false, hint: '依嚴重程度排序：完全孤立、沒人連進來、沒連出去、正常' },
];
const DEFAULT_WIDTHS: Record<ColumnKey, number> = { title: 460, pubDate: 110, updatedDate: 110, wordCount: 90, descLen: 130, tagCount: 90, faqCount: 90, linkRank: 220 };
const MIN_WIDTH = 60;
const STORAGE_KEY = 'content-panels:widths:articles';

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

const sortKey = ref<ColumnKey>('pubDate');
const sortDesc = ref(true);

function toggleSort(key: ColumnKey) {
	if (sortKey.value === key) {
		sortDesc.value = !sortDesc.value;
	} else {
		sortKey.value = key;
		sortDesc.value = !['title', 'linkRank'].includes(key);
	}
}

const sortedRows = computed(() => {
	const key = sortKey.value;
	const direction = sortDesc.value ? -1 : 1;
	return [...rows.value].sort((a, b) => {
		const left = a[key];
		const right = b[key];
		// 沒有資料（null）一律排最後，不受升降冪影響。
		if (left === null && right === null) return a.title.localeCompare(b.title, 'zh-TW');
		if (left === null) return 1;
		if (right === null) return -1;
		const result = typeof left === 'string' ? left.localeCompare(String(right), 'zh-TW') : (left as number) - (right as number);
		return result * direction || a.title.localeCompare(b.title, 'zh-TW');
	});
});

/** 站內連結狀況白話說明；rank 越小越嚴重（排序用）。 */
function linkStatus(stat: any): { rank: number; text: string } {
	if (!stat) return { rank: 4, text: '—（統計尚未產生）' };
	if (stat.is_island && stat.is_dead_end) return { rank: 0, text: '沒人連進來，也沒連出去' };
	if (stat.is_island) return { rank: 1, text: '沒有其他文章連進來' };
	if (stat.is_dead_end) return { rank: 2, text: '沒有連到其他文章' };
	return { rank: 3, text: `正常（${formatNumber(stat.inbound_link_count)} 篇連進來）` };
}

async function load() {
	loading.value = true;
	errorText.value = '';
	try {
		const [articles, stats] = await Promise.all([
			api.get(`/items/articles?${query({ fields: 'slug,title,pub_date,updated_date', 'filter[status][_eq]': 'published', limit: -1 })}`),
			api.get(`/items/content_stats?${query({ limit: -1 })}`),
		]);
		const statBySlug = new Map<string, any>((stats.data.data ?? []).map((item: any) => [item.slug, item]));
		rows.value = (articles.data.data ?? []).map((item: any): Row => {
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
.article-table-wrap {
	height: 100%;
	overflow: auto;
	font-size: 13px;
}
.article-table {
	table-layout: fixed;
	border-collapse: collapse;
}
.article-table th,
.article-table td {
	padding: 8px 10px;
	text-align: left;
	border-bottom: 1px solid var(--theme--border-color-subdued, rgba(128, 128, 128, 0.25));
	overflow: hidden;
	white-space: nowrap;
}
.article-table thead th {
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
.warn {
	color: var(--theme--warning, #c58a00);
}
.article-table tbody tr:hover {
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
