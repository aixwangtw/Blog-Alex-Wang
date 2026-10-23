<template>
	<div class="bars-wrap">
		<div v-if="errorText" class="state error">{{ errorText }}</div>
		<div v-else-if="loading" class="state">載入中…</div>
		<div v-else-if="rows.length === 0" class="state">沒有資料。</div>
		<ul v-else class="bars">
			<li
				v-for="row in rows"
				:key="row.channel"
				:class="{ 'has-detail': row.details.length > 0 }"
				@mouseenter="showTip($event, row)"
				@mousemove="moveTip"
				@mouseleave="tip.visible = false"
			>
				<span class="name">{{ row.channel }}</span>
				<span class="track"><span class="fill" :style="{ width: `${max > 0 ? (row.sessions / max) * 100 : 0}%` }"></span></span>
				<span class="value">{{ formatNumber(row.sessions) }}</span>
			</li>
		</ul>
		<DetailPopover :visible="tip.visible" :x="tip.x" :y="tip.y" :title="tip.title" :rows="tip.rows" />
	</div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { computed, onMounted, ref } from 'vue';
import { type DetailItem, sortDetails, withPinned } from '../shared/channels';
import DetailPopover from '../shared/DetailPopover.vue';
import { formatNumber } from '../shared/format';
import { query } from '../shared/query';

interface Row {
	channel: string;
	sessions: number;
	/** 「其他」底下的細項，其他分類為空。 */
	details: DetailItem[];
}

const tip = ref({ visible: false, x: 0, y: 0, title: '', rows: [] as { name: string; value: string }[] });
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
const max = computed(() => Math.max(0, ...rows.value.map((row) => row.sessions)));

onMounted(async () => {
	try {
		const response = await api.get(`/items/traffic_sources?${query({ 'aggregate[sum]': 'sessions', 'groupBy[]': 'channel,channel_detail', limit: -1 })}`);
		const byChannel = new Map<string, Row>();
		for (const item of response.data.data ?? []) {
			const channel = item.channel || '其他';
			const sessions = Number(item.sum?.sessions ?? 0);
			const row = byChannel.get(channel) ?? { channel, sessions: 0, details: [] };
			row.sessions += sessions;
			if (item.channel_detail) row.details.push({ name: item.channel_detail, sessions });
			byChannel.set(channel, row);
		}
		for (const row of byChannel.values()) row.details = sortDetails(row.details);
		rows.value = withPinned([...byChannel.values()], 'sessions', (channel) => ({ channel, sessions: 0, details: [] }));
	} catch (error: any) {
		errorText.value = `讀取失敗：${error?.response?.data?.errors?.[0]?.message ?? error?.message ?? error}`;
	} finally {
		loading.value = false;
	}
});
</script>

<style scoped>
.bars-wrap {
	height: 100%;
	overflow: auto;
	font-size: 13px;
	padding: 4px 10px;
}
.bars {
	list-style: none;
	margin: 0;
	padding: 0;
}
.bars li {
	display: grid;
	grid-template-columns: 130px 1fr 70px;
	align-items: center;
	gap: 10px;
	padding: 4px 0;
}
.has-detail .name {
	text-decoration: underline dotted;
	cursor: help;
}
.name {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.track {
	height: 14px;
	background: var(--theme--background-subdued, rgba(128, 128, 128, 0.12));
	border-radius: 7px;
	overflow: hidden;
}
.fill {
	display: block;
	height: 100%;
	background: var(--theme--primary, #6644ff);
	border-radius: 7px;
	min-width: 2px;
}
.value {
	text-align: right;
	font-variant-numeric: tabular-nums;
}
.state {
	padding: 10px;
	color: var(--theme--foreground-subdued, #888);
}
.state.error {
	color: var(--theme--danger, #e35169);
}
</style>
