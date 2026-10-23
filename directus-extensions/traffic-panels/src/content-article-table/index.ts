import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'content-article-table',
	name: '文章明細表',
	description: '已發布文章一列：發布日、更新日、字數、SEO 描述字數、標籤數、FAQ 數、站內連結狀況；可排序、拖拉欄寬。',
	icon: 'table_view',
	component: PanelComponent,
	options: [],
	minWidth: 24,
	minHeight: 12,
});
