import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'traffic-source-table',
	name: '流量入口表格',
	description: '入口、進站頁（中文標題）、造訪次數、觀看次數；可排序、拖拉欄寬。',
	icon: 'alt_route',
	component: PanelComponent,
	options: [],
	minWidth: 24,
	minHeight: 12,
});
