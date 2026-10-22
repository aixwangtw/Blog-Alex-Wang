import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'traffic-content-table',
	name: '流量合併表格',
	description: '每篇文章或每個頁面一列：當日、近 30 天、累積觀看與平均停留；點一列展開逐日明細。',
	icon: 'table_view',
	component: PanelComponent,
	options: [
		{
			field: 'kind',
			name: '表格類型',
			type: 'string',
			schema: { default_value: 'articles' },
			meta: {
				interface: 'select-dropdown',
				width: 'full',
				options: { choices: [{ text: '文章', value: 'articles' }, { text: '頁面', value: 'pages' }] },
			},
		},
		{
			field: 'timezone',
			name: '「當日」的時區',
			type: 'string',
			schema: { default_value: 'Asia/Taipei' },
			meta: { interface: 'input', width: 'full', note: '判斷「今天」用；預設 Asia/Taipei，需與 GA4 Property 時區一致。' },
		},
	],
	minWidth: 24,
	minHeight: 16,
});
