import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'traffic-summary-card',
	name: '流量與內容合併卡片',
	description: '並排顯示三個（或兩個）數字，滑鼠移上去顯示細項；流量卡片為當日／近 30 天／累積，內容卡片為發文概況、寫作品質、站內連結。',
	icon: 'dashboard',
	component: PanelComponent,
	options: [
		{
			field: 'kind',
			name: '卡片類型',
			type: 'string',
			schema: { default_value: 'users' },
			meta: {
				interface: 'select-dropdown',
				width: 'full',
				options: {
					choices: [
						{ text: '使用者', value: 'users' },
						{ text: '文章觀看', value: 'articles' },
						{ text: '頁面觀看', value: 'pages' },
						{ text: '內容：發文概況', value: 'content-posts' },
						{ text: '內容：寫作品質', value: 'content-quality' },
						{ text: '內容：站內連結', value: 'content-links' },
					],
				},
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
	minWidth: 12,
	minHeight: 6,
});
