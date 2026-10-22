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
			<div v-for="cell in cells" :key="cell.label" class="cell">
				<div class="value">{{ cell.value }}</div>
				<div class="label">{{ cell.label }}</div>
			</div>
		</div>

		<Teleport to="body">
			<div v-if="hovering && details.length > 0" class="traffic-popover" :style="popoverStyle">
				<div class="popover-title">{{ detailTitle }}</div>
				<table>
					<thead v-if="detailHead.length > 0">
						<tr>
							<th v-for="(head, index) in detailHead" :key="index" :class="{ num: index > 0 }">{{ head }}</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="row in details" :key="row[0]">
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
const cells = ref<{ label: string; value: string }[]>([]);
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
}

async function aggregate(collection: string, params: Record<string, string>) {
	const response = await api.get(`/items/${collection}?${query({ ...params, limit: 1 })}`);
	return response.data.data?.[0] ?? {};
}

async function loadUsers() {
	const row = (await api.get(`/items/audience_metrics?${query({ 'filter[key][_eq]': 'site', limit: 1 })}`)).data.data?.[0];
	if (!row) throw new Error('audience_metrics 沒有 key=site 的資料');
	cells.value = [
		{ label: '今日活躍', value: formatNumber(row.active_users_today) },
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
	const [today, totals] = await Promise.all([
		aggregate('daily_content_views', {
			'aggregate[sum]': 'views',
			'filter[content_type][_eq]': contentType,
			'filter[date][_eq]': todayIn(props.timezone),
		}),
		aggregate(collection, { 'aggregate[sum]': 'views,views_30d', 'aggregate[avg]': 'avg_engagement_seconds_30d' }),
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
