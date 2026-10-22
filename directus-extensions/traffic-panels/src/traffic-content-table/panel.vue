<template>
	<div class="traffic-table-wrap">
		<div v-if="errorText" class="state error">{{ errorText }}</div>
		<div v-else-if="loading" class="state">載入中…</div>
		<table v-else class="traffic-table" :style="{ width: `${totalWidth}px` }">
			<colgroup>
				<col :style="{ width: `${ARROW_WIDTH}px` }" />
				<col v-for="column in COLUMNS" :key="column.key" :style="{ width: `${widths[column.key]}px` }" />
			</colgroup>
			<thead>
				<tr>
					<th class="arrow-cell"></th>
					<th
						v-for="column in COLUMNS"
						:key="column.key"
						:class="{ num: column.numeric, sortable: true }"
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
				<template v-for="row in sortedRows" :key="row.path">
					<tr class="data-row" :class="{ open: expanded === row.path }" @click="toggleRow(row)">
						<td class="arrow-cell">{{ expanded === row.path ? '▾' : '▸' }}</td>
						<td class="title-cell" :title="row.title">{{ row.title }}</td>
						<td class="num">{{ formatNumber(row.today) }}</td>
						<td class="num">{{ formatNumber(row.views30d) }}</td>
						<td class="num">{{ formatNumber(row.views) }}</td>
						<td class="num">{{ formatNumber(row.avg) }}</td>
					</tr>
					<tr v-if="expanded === row.path" class="detail-row">
						<td :colspan="COLUMNS.length + 1">
							<div v-if="detailLoading" class="state">載入逐日明細…</div>
							<div v-else-if="detailError" class="state error">{{ detailError }}</div>
							<div v-else-if="detailRows.length === 0" class="state">沒有逐日資料（只保存有觀看的日期）。</div>
							<table v-else class="detail-table">
								<thead>
									<tr>
										<th>日期</th>
										<th class="num">觀看</th>
										<th class="num">活躍使用者</th>
										<th class="num">總使用者</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="day in detailRows" :key="day.date">
										<td>{{ String(day.date).replace(/-/g, '/') }}</td>
										<td class="num">{{ formatNumber(day.views) }}</td>
										<td class="num">{{ formatNumber(day.active_users) }}</td>
										<td class="num">{{ formatNumber(day.total_users) }}</td>
									</tr>
								</tbody>
							</table>
						</td>
					</tr>
				</template>
				<tr v-if="sortedRows.length === 0">
					<td :colspan="COLUMNS.length + 1" class="state">沒有資料。</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { formatNumber, readStorage, todayIn, writeStorage } from '../shared/format';
import { KINDS, query } from '../shared/query';

interface Row {
	path: string;
	title: string;
	today: number;
	views30d: number;
	views: number;
	avg: number | null;
}
type ColumnKey = 'title' | 'today' | 'views30d' | 'views' | 'avg';

const COLUMNS: { key: ColumnKey; label: string; numeric: boolean }[] = [
	{ key: 'title', label: '標題', numeric: false },
	{ key: 'today', label: '當日觀看', numeric: true },
	{ key: 'views30d', label: '近 30 天觀看', numeric: true },
	{ key: 'views', label: '累積觀看', numeric: true },
	{ key: 'avg', label: '每人平均停留（秒）', numeric: true },
];
const DEFAULT_WIDTHS: Record<ColumnKey, number> = { title: 220, today: 100, views30d: 120, views: 100, avg: 170 };
const ARROW_WIDTH = 28;
const MIN_WIDTH = 60;

const props = withDefaults(defineProps<{ kind?: 'articles' | 'pages'; timezone?: string }>(), {
	kind: 'articles',
	timezone: 'Asia/Taipei',
});

const api = useApi();
const loading = ref(true);
const errorText = ref('');
const rows = ref<Row[]>([]);

const storageKey = computed(() => `traffic-panels:widths:${props.kind}`);
const widths = ref<Record<ColumnKey, number>>({ ...DEFAULT_WIDTHS });
const totalWidth = computed(() => ARROW_WIDTH + COLUMNS.reduce((sum, column) => sum + widths.value[column.key], 0));

function loadWidths() {
	const saved = readStorage<Partial<Record<ColumnKey, number>>>(storageKey.value, {});
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
	if (resizing) writeStorage(storageKey.value, widths.value);
	resizing = null;
}

const sortKey = ref<ColumnKey>('views');
const sortDesc = ref(true);

function toggleSort(key: ColumnKey) {
	if (sortKey.value === key) {
		sortDesc.value = !sortDesc.value;
	} else {
		sortKey.value = key;
		sortDesc.value = key !== 'title';
	}
}

const sortedRows = computed(() => {
	const key = sortKey.value;
	const direction = sortDesc.value ? -1 : 1;
	return [...rows.value].sort((a, b) => {
		const left = a[key];
		const right = b[key];
		// 空值（沒有停留資料）永遠排最後，不論升降冪。
		if (left === null && right === null) return 0;
		if (left === null) return 1;
		if (right === null) return -1;
		if (typeof left === 'string' || typeof right === 'string') {
			return String(left).localeCompare(String(right), 'zh-TW') * direction;
		}
		return (left - right) * direction;
	});
});

async function load() {
	loading.value = true;
	errorText.value = '';
	expanded.value = null;
	detailCache.clear();
	try {
		const { collection, contentType } = KINDS[props.kind];
		const fields = props.kind === 'articles' ? 'slug,title' : 'path,name';
		const [list, today] = await Promise.all([
			api.get(`/items/${collection}?${query({ fields: `${fields},views,views_30d,avg_engagement_seconds_30d`, limit: -1 })}`),
			api.get(
				`/items/daily_content_views?${query({
					'aggregate[sum]': 'views',
					'groupBy[]': 'path',
					'filter[content_type][_eq]': contentType,
					'filter[date][_eq]': todayIn(props.timezone),
					limit: -1,
				})}`,
			),
		]);
		const todayByPath = new Map<string, number>();
		for (const item of today.data.data ?? []) todayByPath.set(item.path, Number(item.sum?.views ?? 0));

		rows.value = (list.data.data ?? []).map((item: any): Row => {
			// 文章的路徑規則來自 tools/sync-ga4-daily-views.mjs：/blog/<slug>/
			const path = props.kind === 'articles' ? `/blog/${item.slug}/` : item.path;
			return {
				path,
				title: (props.kind === 'articles' ? item.title : item.name) || path,
				today: todayByPath.get(path) ?? 0,
				views30d: Number(item.views_30d ?? 0),
				views: Number(item.views ?? 0),
				avg: item.avg_engagement_seconds_30d === null || item.avg_engagement_seconds_30d === undefined ? null : Number(item.avg_engagement_seconds_30d),
			};
		});
	} catch (error: any) {
		errorText.value = `讀取失敗：${error?.response?.data?.errors?.[0]?.message ?? error?.message ?? error}`;
	} finally {
		loading.value = false;
	}
}

const expanded = ref<string | null>(null);
const detailLoading = ref(false);
const detailError = ref('');
const detailRows = ref<any[]>([]);
const detailCache = new Map<string, any[]>();

async function toggleRow(row: Row) {
	if (expanded.value === row.path) {
		expanded.value = null;
		return;
	}
	expanded.value = row.path;
	detailError.value = '';
	const cached = detailCache.get(row.path);
	if (cached) {
		detailRows.value = cached;
		return;
	}
	detailRows.value = [];
	detailLoading.value = true;
	try {
		const response = await api.get(
			`/items/daily_content_views?${query({
				fields: 'date,views,active_users,total_users',
				'filter[path][_eq]': row.path,
				'filter[content_type][_eq]': KINDS[props.kind].contentType,
				sort: '-date',
				limit: -1,
			})}`,
		);
		const data = response.data.data ?? [];
		detailCache.set(row.path, data);
		if (expanded.value === row.path) detailRows.value = data;
	} catch (error: any) {
		detailError.value = `讀取失敗：${error?.response?.data?.errors?.[0]?.message ?? error?.message ?? error}`;
	} finally {
		detailLoading.value = false;
	}
}

onMounted(() => {
	loadWidths();
	load();
});
onBeforeUnmount(stopResize);
watch(
	() => [props.kind, props.timezone],
	() => {
		loadWidths();
		load();
	},
);
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
}
.sortable {
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
.traffic-table thead th {
	position: sticky;
}
.num {
	text-align: right !important;
	font-variant-numeric: tabular-nums;
}
.arrow-cell {
	padding-left: 6px !important;
	padding-right: 0 !important;
	color: var(--theme--foreground-subdued, #888);
}
.title-cell {
	text-overflow: ellipsis;
}
.data-row {
	cursor: pointer;
}
.data-row:hover,
.data-row.open {
	background: var(--theme--background-subdued, rgba(128, 128, 128, 0.1));
}
.detail-row > td {
	padding: 6px 10px 12px 38px;
	white-space: normal;
	background: var(--theme--background-subdued, rgba(128, 128, 128, 0.06));
}
.detail-table {
	width: 100%;
	max-width: 480px;
	border-collapse: collapse;
}
.detail-table th,
.detail-table td {
	padding: 3px 10px 3px 0;
	text-align: left;
	border: none;
}
.detail-table th {
	color: var(--theme--foreground-subdued, #888);
	font-weight: 500;
}
.state {
	padding: 10px;
	color: var(--theme--foreground-subdued, #888);
}
.state.error {
	color: var(--theme--danger, #e35169);
}
</style>
