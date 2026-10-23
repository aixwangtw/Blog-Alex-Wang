import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'traffic-channel-bars',
	name: '熱門入口長條圖',
	description: '各入口分類的造訪次數；外部來源由多到少，接著是回訪讀者、App 內建瀏覽器、站內換頁，最後固定為其他、疑似自動程式、不明。',
	icon: 'bar_chart',
	component: PanelComponent,
	options: [],
	minWidth: 16,
	minHeight: 10,
});
