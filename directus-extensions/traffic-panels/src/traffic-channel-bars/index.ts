import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'traffic-channel-bars',
	name: '熱門入口長條圖',
	description: '各入口分類的造訪次數；Google 搜尋、AI 搜尋固定前兩名，之後由多到少（LINE、YouTube 為 0 也列出），最後固定為其他、疑似自動程式；滑鼠移到 AI 搜尋、其他可看細項。',
	icon: 'bar_chart',
	component: PanelComponent,
	options: [],
	minWidth: 16,
	minHeight: 10,
});
