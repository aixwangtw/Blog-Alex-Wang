<template>
	<Teleport to="body">
		<div v-if="visible" class="detail-popover" :style="style">
			<div class="popover-title">{{ title }}</div>
			<table>
				<tbody>
					<tr v-for="(row, index) in rows" :key="index" :class="{ indent: row.indent }">
						<td>{{ row.indent ? '└ ' : '' }}{{ row.name }}</td>
						<td class="num">{{ row.value }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/** 滑鼠旁的浮動清單（名稱＋數字）；indent 的列縮排顯示，用於「其他」底下的細項。 */
const props = defineProps<{ visible: boolean; x: number; y: number; title: string; rows: { name: string; value: string; indent?: boolean }[] }>();

const style = computed(() => {
	const width = 300;
	const left = Math.max(8, Math.min(props.x + 14, window.innerWidth - width - 8));
	const top = Math.max(8, Math.min(props.y + 18, window.innerHeight - 40 - props.rows.length * 26));
	return { left: `${left}px`, top: `${top}px`, width: `${width}px` };
});
</script>

<style>
.detail-popover {
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
.detail-popover .popover-title {
	margin-bottom: 6px;
	font-weight: 600;
	color: var(--theme--foreground-accent, inherit);
}
.detail-popover table {
	width: 100%;
	border-collapse: collapse;
}
.detail-popover td {
	padding: 3px 0;
	text-align: left;
}
.detail-popover tr.indent td {
	padding-left: 12px;
	color: var(--theme--foreground-subdued, #888);
}
.detail-popover .num {
	text-align: right;
	font-variant-numeric: tabular-nums;
}
</style>
