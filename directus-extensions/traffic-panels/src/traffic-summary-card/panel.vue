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
			<div v-for="cell in cells" :key="cell.label" class="cell" :class="{ 'has-sub': cell.sub }">
				<div class="value">{{ cell.value }}</div>
				<div class="label">{{ cell.label }}</div>
				<div
					v-if="cell.sub"
					class="sub"
					@mouseenter="onEnterSub"
					@mouseleave="hoverSub = false"
				>{{ cell.sub }}</div>
			</div>
		</div>

		<Teleport to="body">
			<div v-if="hovering && shownDetails.length > 0" class="traffic-popover" :style="popoverStyle">
				<div class="popover-title">{{ hoverSub ? subTitle : detailTitle }}</div>
				<table>
					<thead v-if="shownHead.length > 0">
						<tr>
							<th v-for="(head, index) in shownHead" :key="index" :class="{ num: index > 0 }">{{ head }}</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="row in shownDetails" :key="row[0]">
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
import { formatNumber, todayIn } from '../shared/format';
import { KINDS, query } from '../shared/query';

const props = withDefaults(
	defineProps<{ kind?: 'users' | 'articles' | 'pages'; timezone?: string; showHeader?: boolean }>(),
	{ kind: 'users', timezone: 'Asia/Taipei', showHeader: false },
);

const api = useApi();
const loading = ref(true);
const errorText = ref('');
const cells = ref<{ label: string; value: string; sub?: string }[]>([]);
const subTitle = ref('');
const subDetails = ref<string[][]>([]);
const hoverSub = ref(false);
const shownDetails = computed(() => (hoverSub.value ? subDetails.value : details.value));
const shownHead = computed(() => (hoverSub.value ? ['入口', '人數'] : detailHead.value));
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
function onEnterSub() {
	hoverSub.value = subDetails.value.length > 0;
}
function onLeave() {
	hovering.value = false;
	hoverSub.value = false;
}

async function aggregate(collection: string, params: Record<string, string>) {
	const response = await api.get(`/items/${collection}?${query({ ...params, limit: 1 })}`);
	return response.data.data?.[0] ?? {};
}

async function loadUsers() {
	const row = (await api.get(`/items/audience_metrics?${query({ 'filter[key][_eq]': 'site', limit: 1 })}`)).data.data?.[0];
	if (!row) throw new Error('audience_metrics 沒有 key=site 的資料');
	// 今日入口：audience_metrics.today_sources（同步腳本寫入的 [{channel, users}]，人數多的在前）。
	let sources: { channel: string; users: number }[] = [];
	try {
		const raw = typeof row.today_sources === 'string' ? JSON.parse(row.today_sources) : row.today_sources;
		if (Array.isArray(raw)) sources = raw.filter((item) => item && Number(item.users) > 0);
	} catch {
		sources = [];
	}
	subTitle.value = '今日入口（活躍使用者）';
	subDetails.value = sources.map((item) => [String(item.channel), formatNumber(item.users)]);
	cells.value = [
		{
			label: '今日活躍',
			value: formatNumber(row.active_users_today),
			sub: sources.length > 0 ? sources.slice(0, 3).map((item) => `${item.channel} ${formatNumber(item.users)}`).join(' · ') : undefined,
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

async function load() {
	loading.value = true;
	errorText.value = '';
	try {
		if (props.kind === 'users') await loadUsers();
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
	align-items: center;
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
.sub {
	margin-top: 2px;
	font-size: 12px;
	color: var(--theme--foreground-subdued, #888);
	line-height: 1.35;
	overflow-wrap: anywhere;
	cursor: default;
}
.cell.has-sub {
	flex: 1.9 1 0;
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
