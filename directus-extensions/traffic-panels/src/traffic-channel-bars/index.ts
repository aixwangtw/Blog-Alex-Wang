import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'traffic-channel-bars',
	name: '熱門入口長條圖',
	description: '各入口分類的造訪次數；Google 搜尋固定第一、AI 搜尋固定第二，其餘由多到少。',
	icon: 'bar_chart',
	component: PanelComponent,
	options: [],
	minWidth: 16,
	minHeight: 10,
});
