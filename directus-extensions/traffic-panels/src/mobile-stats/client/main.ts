/**
 * 手機版統計頁：單欄排版，涵蓋「流量統計」與「文章產出與品質」兩個儀表板的所有面板。
 * 用 Directus session cookie 登入（/auth/login mode=session），token 不經過也不存在前端程式。
 */
import { formatDate, formatDecimal, formatNumber } from '../../shared/format';
import * as L from './loaders';

const BASE = new URL('./', location.href).pathname; // /mobile-stats/
const app = document.getElementById('app')!;

// ── DOM 小工具：一律用 textContent，不拼 HTML ──

type Child = Node | string | null | undefined | false;
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, any> = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
	const el = document.createElement(tag);
	for (const [key, value] of Object.entries(attrs)) {
		if (value === undefined || value === null || value === false) continue;
		if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
		else if (key === 'class') el.className = value;
		else el.setAttribute(key, value === true ? '' : String(value));
	}
	for (const child of children) if (child !== null && child !== undefined && child !== false) el.append(child);
	return el;
}

// ── API：同網域、帶 cookie；401 時先試 refresh 一次 ──

class AuthError extends Error {}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
	return fetch(path, { credentials: 'same-origin', cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) } });
}

let refreshing: Promise<boolean> | null = null;
function refreshSession(): Promise<boolean> {
	refreshing ??= request('/auth/refresh', { method: 'POST', body: JSON.stringify({ mode: 'session' }) })
		.then((res) => res.ok)
		.catch(() => false)
		.finally(() => {
			setTimeout(() => (refreshing = null), 0);
		});
	return refreshing;
}

async function errorMessage(res: Response): Promise<string> {
	try {
		const body = await res.json();
		return body?.errors?.[0]?.message ?? `HTTP ${res.status}`;
	} catch {
		return `HTTP ${res.status}`;
	}
}

const get: L.Getter = async (path) => {
	let res = await request(path);
	if (res.status === 401) {
		if (await refreshSession()) res = await request(path);
	}
	if (res.status === 401) throw new AuthError('登入已過期');
	if (!res.ok) throw new Error(await errorMessage(res));
	return res.json();
};

async function whoami(): Promise<{ authenticated: boolean; admin: boolean }> {
	const res = await request(`${BASE}me`);
	return res.ok ? res.json() : { authenticated: false, admin: false };
}

// ── 畫面狀態 ──

const TABS = [
	{ id: 'traffic', label: '流量統計' },
	{ id: 'content', label: '文章產出與品質' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function readTab(): TabId {
	try {
		const saved = localStorage.getItem('mobile-stats:tab');
		return saved === 'content' ? 'content' : 'traffic';
	} catch {
		return 'traffic';
	}
}
let currentTab: TabId = (new URLSearchParams(location.search).get('tab') as TabId) === 'content' ? 'content' : readTab();
let lastLoaded = 0;

function showMessage(title: string, text: string, actions: Child[] = []) {
	app.replaceChildren(h('main', { class: 'center' }, h('div', { class: 'panel narrow' }, h('h1', {}, title), h('p', { class: 'muted' }, text), ...actions)));
}

// ── 登入 ──

function showLogin(errorText = '', needOtp = false, email = '') {
	const emailInput = h('input', { type: 'email', name: 'email', autocomplete: 'username', required: true, value: email, inputmode: 'email' });
	const passwordInput = h('input', { type: 'password', name: 'password', autocomplete: 'current-password', required: true });
	const otpInput = needOtp ? h('input', { type: 'text', name: 'otp', inputmode: 'numeric', autocomplete: 'one-time-code', required: true }) : null;
	const button = h('button', { type: 'submit', class: 'primary' }, '登入');
	const form = h(
		'form',
		{ class: 'panel narrow login' },
		h('img', { src: `${BASE}icon-192.png`, alt: '', class: 'logo', width: 64, height: 64 }),
		h('h1', {}, '網站統計'),
		h('p', { class: 'muted' }, '用 Directus 管理員帳號登入。'),
		errorText ? h('p', { class: 'error' }, errorText) : null,
		h('label', {}, '電子郵件', emailInput),
		h('label', {}, '密碼', passwordInput),
		otpInput ? h('label', {}, '兩步驟驗證碼', otpInput) : null,
		button,
	);
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		button.disabled = true;
		button.textContent = '登入中…';
		try {
			const payload: Record<string, string> = { email: emailInput.value.trim(), password: passwordInput.value, mode: 'session' };
			if (otpInput) payload.otp = otpInput.value.trim();
			const res = await request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				const code = body?.errors?.[0]?.extensions?.code;
				if (code === 'INVALID_OTP') {
					showLogin(otpInput ? '驗證碼不正確。' : '請輸入兩步驟驗證碼。', true, payload.email);
					return;
				}
				showLogin(code === 'INVALID_CREDENTIALS' ? '帳號或密碼不正確。' : `登入失敗：${body?.errors?.[0]?.message ?? res.status}`, needOtp, payload.email);
				return;
			}
			await start();
		} catch (error: any) {
			showLogin(`登入失敗：${error?.message ?? error}`, needOtp, emailInput.value);
		}
	});
	app.replaceChildren(h('main', { class: 'center' }, form));
	(email ? (otpInput ?? passwordInput) : emailInput).focus();
}

async function logout() {
	await request('/auth/logout', { method: 'POST', body: JSON.stringify({ mode: 'session' }) }).catch(() => undefined);
	showLogin();
}

// ── 元件 ──

function section(title: string, note?: string): { el: HTMLElement; body: HTMLElement } {
	const body = h('div', { class: 'section-body' }, h('div', { class: 'state' }, '載入中…'));
	const el = h('section', { class: 'panel' }, h('h2', {}, title), note ? h('p', { class: 'note' }, note) : null, body);
	return { el, body };
}

async function fill(body: HTMLElement, task: () => Promise<Child | Child[]>) {
	try {
		const result = await task();
		body.replaceChildren(...(Array.isArray(result) ? result : [result]).filter(Boolean) as (Node | string)[]);
	} catch (error: any) {
		if (error instanceof AuthError) {
			showLogin('登入已過期，請重新登入。');
			throw error;
		}
		body.replaceChildren(h('div', { class: 'state error' }, `讀取失敗：${error?.message ?? error}`));
	}
}

function tipTable(tip: L.Tip): HTMLElement {
	const table = h('table', { class: 'mini' });
	if (tip.head.length > 0) table.append(h('thead', {}, h('tr', {}, ...tip.head.map((text, index) => h('th', { class: index > 0 ? 'num' : '' }, text)))));
	table.append(
		h(
			'tbody',
			{},
			...tip.rows.map((row) =>
				h('tr', { class: row[0]?.startsWith('　└') ? 'sub' : '' }, ...row.map((text, index) => h('td', { class: index > 0 ? 'num' : '', colspan: row.length === 1 && tip.head.length > 1 ? tip.head.length : undefined }, text))),
			),
		),
	);
	return table;
}

/** 可收合的細項區塊（桌面版是 hover 彈窗，手機改成點開）。 */
function disclosure(summary: string, content: Node, open = false): HTMLElement {
	const details = h('details', { class: 'disclosure' }, h('summary', {}, summary), content);
	if (open) details.open = true;
	return details;
}

function renderCard(card: L.Card): Child[] {
	const cells = h('div', { class: `cells n${card.cells.length}` }, ...card.cells.map((cell) => h('div', { class: 'cell' }, h('div', { class: 'value' }, cell.value), h('div', { class: 'label' }, cell.label))));
	const extras: Child[] = [];
	for (const cell of card.cells) if (cell.tip) extras.push(disclosure(cell.tip.title, tipTable(cell.tip)));
	if (card.detail && card.detail.rows.length > 0) extras.push(h('div', { class: 'detail' }, card.detail.title ? h('h3', {}, card.detail.title) : null, tipTable(card.detail)));
	return [cells, ...extras];
}

/** 排序下拉選單（取代桌面版點欄位標題排序）。 */
function sorter<T>(options: { label: string; compare: (a: T, b: T) => number }[], rows: T[], render: (rows: T[]) => Node[], storageKey: string): Child[] {
	const list = h('div', { class: 'list' });
	let saved = 0;
	try {
		saved = Number(localStorage.getItem(storageKey) ?? 0);
	} catch {
		saved = 0;
	}
	if (!(saved >= 0 && saved < options.length)) saved = 0;
	const select = h('select', { 'aria-label': '排序方式' }, ...options.map((option, index) => h('option', { value: String(index), selected: index === saved }, option.label)));
	// 一次只畫 PAGE 筆，避免清單太長（流量入口有上百列）；按「再顯示」往下接。
	const PAGE = 10;
	let shown = PAGE;
	const more = h('button', { type: 'button', class: 'ghost more' });
	const draw = () => {
		const option = options[Number(select.value)] ?? options[0];
		const sorted = [...rows].sort(option.compare);
		list.replaceChildren(...render(sorted.slice(0, shown)));
		const rest = sorted.length - shown;
		more.textContent = `再顯示 ${Math.min(PAGE, rest)} 筆（已顯示 ${Math.min(shown, sorted.length)}／共 ${sorted.length} 筆）`;
		more.hidden = rest <= 0;
	};
	more.addEventListener('click', () => {
		shown += PAGE;
		draw();
	});
	const apply = () => {
		shown = PAGE;
		draw();
		try {
			localStorage.setItem(storageKey, select.value);
		} catch {
			/* 存不進去就用預設排序 */
		}
	};
	select.addEventListener('change', apply);
	apply();
	return [h('label', { class: 'sort' }, '排序', select), list, more];
}

const nullsLast = <T>(pick: (row: T) => number | null, desc = true) => (a: T, b: T) => {
	const left = pick(a);
	const right = pick(b);
	if (left === null && right === null) return 0;
	if (left === null) return 1;
	if (right === null) return -1;
	return desc ? right - left : left - right;
};
const byText = <T>(pick: (row: T) => string, desc = false) => (a: T, b: T) => pick(a).localeCompare(pick(b), 'zh-TW') * (desc ? -1 : 1);

function stat(label: string, value: string): HTMLElement {
	return h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, label), h('span', { class: 'stat-value' }, value));
}

// ── 觀看明細卡片 ──

function contentList(kind: 'articles' | 'pages', rows: L.ContentRow[]): Child[] {
	const render = (sorted: L.ContentRow[]) =>
		sorted.map((row) => {
			const dailyBox = h('div', { class: 'daily' }, h('div', { class: 'state' }, '載入逐日明細…'));
			let loaded = false;
			const entries = row.entrySessions > 0 ? row.entries : [];
			const body = h(
				'div',
				{ class: 'row-extra' },
				entries.length > 0
					? h(
							'div',
							{},
							h('h3', {}, `入口（共 ${formatNumber(row.entrySessions)} 次造訪）`),
							tipTable({
								title: '',
								head: ['入口', '造訪', '占比'],
								rows: entries.flatMap((entry) => [
									[entry.channel, formatNumber(entry.sessions), `${Math.round((entry.sessions / row.entrySessions) * 100)}%`],
									...(entry.details ?? []).map((detail) => [`　└ ${detail.name}`, formatNumber(detail.sessions), '']),
								]),
							}),
						)
					: null,
				h('h3', {}, '逐日明細'),
				dailyBox,
			);
			const card = h(
				'details',
				{ class: 'item' },
				h(
					'summary',
					{},
					h('div', { class: 'item-title' }, row.title),
					h('div', { class: 'stats' }, stat('當日', formatNumber(row.today)), stat('近 30 天', formatNumber(row.views30d)), stat('累積', formatNumber(row.views)), stat('平均停留', row.avg === null ? '—' : `${formatNumber(row.avg)} 秒`)),
					h('div', { class: 'item-meta' }, `主要入口：${L.entryText(row)}`, row.entrySessions > 0 ? `・入口造訪 ${formatNumber(row.entrySessions)} 次` : ''),
				),
				body,
			);
			card.addEventListener('toggle', () => {
				if (!card.open || loaded) return;
				loaded = true;
				fill(dailyBox, async () => {
					const days = await L.loadDailyDetail(get, kind, row.path);
					if (days.length === 0) return h('div', { class: 'state' }, '沒有逐日資料（只保存有觀看的日期）。');
					return tipTable({
						title: '',
						head: ['日期', '觀看', '活躍', '總使用者'],
						rows: days.map((day) => [String(day.date).replace(/-/g, '/'), formatNumber(day.views), formatNumber(day.active_users), formatNumber(day.total_users)]),
					});
				}).catch(() => undefined);
			});
			return card;
		});
	return sorter<L.ContentRow>(
		[
			{ label: '累積觀看（多到少）', compare: nullsLast((row) => row.views) },
			{ label: '近 30 天觀看（多到少）', compare: nullsLast((row) => row.views30d) },
			{ label: '當日觀看（多到少）', compare: nullsLast((row) => row.today) },
			{ label: '平均停留（長到短）', compare: nullsLast((row) => row.avg) },
			{ label: '入口造訪次數（多到少）', compare: nullsLast((row) => row.entrySessions) },
			{ label: '標題', compare: byText((row) => row.title) },
		],
		rows,
		render,
		`mobile-stats:sort:${kind}`,
	);
}

// ── 長條（熱門入口） ──

function channelBars(rows: L.ChannelRow[]): Child[] {
	const max = Math.max(0, ...rows.map((row) => row.sessions));
	return [
		h(
			'div',
			{ class: 'bars' },
			...rows.map((row) => {
				const bar = h(
					'div',
					{ class: 'bar-row' },
					h('div', { class: 'bar-head' }, h('span', {}, row.channel), h('span', { class: 'num' }, formatNumber(row.sessions))),
					h('div', { class: 'bar-track' }, h('div', { class: 'bar-fill', style: `width:${max > 0 ? (row.sessions / max) * 100 : 0}%` })),
				);
				if (row.details.length === 0) return bar;
				return h('div', {}, bar, disclosure(`「${row.channel}」的細項`, tipTable({ title: '', head: ['細項', '造訪'], rows: row.details.map((item) => [item.name, formatNumber(item.sessions)]) })));
			}),
		),
	];
}

// ── 流量入口與進站頁 ──

function sourceList(rows: L.SourceRow[]): Child[] {
	const ranks = L.channelRanks(rows);
	const tie = (a: L.SourceRow, b: L.SourceRow) => b.sessions - a.sessions || a.path.localeCompare(b.path);
	const byChannel = (a: L.SourceRow, b: L.SourceRow) => (ranks.get(a.channel) ?? 0) - (ranks.get(b.channel) ?? 0) || tie(a, b);
	const render = (sorted: L.SourceRow[]) =>
		sorted.map((row) =>
			h(
				'div',
				{ class: 'item flat' },
				h('div', { class: 'item-meta strong' }, row.channel),
				h('div', { class: 'item-title' }, row.title),
				row.title !== row.path ? h('div', { class: 'path' }, row.path) : null,
				h('div', { class: 'stats two' }, stat('造訪次數', formatNumber(row.sessions)), stat('觀看次數', formatNumber(row.views))),
				row.details.length > 0 ? disclosure('細項', tipTable({ title: '', head: ['細項', '造訪'], rows: row.details.map((item) => [item.name, formatNumber(item.sessions)]) })) : null,
			),
		);
	return sorter<L.SourceRow>(
		[
			{ label: '入口分類（固定順序）', compare: byChannel },
			{ label: '造訪次數（多到少）', compare: (a, b) => b.sessions - a.sessions || a.path.localeCompare(b.path) },
			{ label: '觀看次數（多到少）', compare: (a, b) => b.views - a.views || tie(a, b) },
			{ label: '進站頁標題', compare: (a, b) => a.title.localeCompare(b.title, 'zh-TW') || tie(a, b) },
		],
		rows,
		render,
		'mobile-stats:sort:sources',
	);
}

// ── 文章明細 ──

function articleList(rows: L.ArticleRow[]): Child[] {
	const render = (sorted: L.ArticleRow[]) =>
		sorted.map((row) =>
			h(
				'div',
				{ class: `item flat${row.linkRank < 3 ? ' warn' : ''}` },
				h('div', { class: 'item-title' }, row.title),
				h('div', { class: 'item-meta' }, `發布 ${formatDate(row.pubDate)}・更新 ${formatDate(row.updatedDate)}`),
				h(
					'div',
					{ class: 'stats' },
					stat('字數', formatNumber(row.wordCount)),
					stat('SEO 描述', formatNumber(row.descLen)),
					stat('標籤', formatNumber(row.tagCount)),
					stat('FAQ', formatNumber(row.faqCount)),
				),
				h('div', { class: 'item-meta' }, `站內連結：${row.linkText}`),
			),
		);
	const dateDesc = (pick: (row: L.ArticleRow) => string | null) => (a: L.ArticleRow, b: L.ArticleRow) => {
		const left = pick(a);
		const right = pick(b);
		if (!left && !right) return a.title.localeCompare(b.title, 'zh-TW');
		if (!left) return 1;
		if (!right) return -1;
		return right.localeCompare(left) || a.title.localeCompare(b.title, 'zh-TW');
	};
	return [
		h('p', { class: 'note' }, 'SEO 描述字數建議 40～80 字。'),
		...sorter<L.ArticleRow>(
			[
				{ label: '發布日（新到舊）', compare: dateDesc((row) => row.pubDate) },
				{ label: '更新日（新到舊）', compare: dateDesc((row) => row.updatedDate) },
				{ label: '字數（多到少）', compare: nullsLast((row) => row.wordCount) },
				{ label: 'SEO 描述字數（多到少）', compare: nullsLast((row) => row.descLen) },
				{ label: '標籤數（多到少）', compare: nullsLast((row) => row.tagCount) },
				{ label: 'FAQ 數（多到少）', compare: nullsLast((row) => row.faqCount) },
				{ label: '站內連結狀況（嚴重的在前）', compare: (a, b) => a.linkRank - b.linkRank || a.title.localeCompare(b.title, 'zh-TW') },
				{ label: '標題', compare: byText((row) => row.title) },
			],
			rows,
			render,
			'mobile-stats:sort:content-articles',
		),
	];
}

// ── 圖表（SVG，依容器寬度縮放，不會撐出畫面） ──

const SVG = 'http://www.w3.org/2000/svg';
function svg(tag: string, attrs: Record<string, string | number>): SVGElement {
	const el = document.createElementNS(SVG, tag);
	for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
	return el;
}

function chart(points: L.Point[], options: { type: 'line' | 'bar'; format?: (value: number) => string; labelFormat?: (label: string) => string } = { type: 'line' }): Child[] {
	if (points.length === 0) return [h('div', { class: 'state' }, '沒有資料。')];
	const fmt = options.format ?? formatNumber;
	const lab = options.labelFormat ?? ((label: string) => label.replace(/-/g, '/'));
	const W = 320;
	const H = 150;
	const pad = { l: 4, r: 4, t: 8, b: 4 };
	const max = Math.max(1, ...points.map((point) => point.value));
	const innerW = W - pad.l - pad.r;
	const innerH = H - pad.t - pad.b;
	const step = points.length > 1 ? innerW / (points.length - 1) : 0;
	const x = (index: number) => (options.type === 'bar' ? pad.l + (innerW / points.length) * (index + 0.5) : pad.l + (points.length > 1 ? step * index : innerW / 2));
	const y = (value: number) => pad.t + innerH - (value / max) * innerH;
	const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', preserveAspectRatio: 'none', role: 'img' });
	for (const ratio of [0, 0.5, 1]) root.append(svg('line', { x1: pad.l, x2: W - pad.r, y1: y(max * ratio), y2: y(max * ratio), class: 'grid' }));
	if (options.type === 'bar') {
		const width = Math.max(1, (innerW / points.length) * 0.7);
		points.forEach((point, index) => root.append(svg('rect', { x: x(index) - width / 2, y: y(point.value), width, height: Math.max(0, pad.t + innerH - y(point.value)), class: 'bar' })));
	} else {
		const line = points.map((point, index) => `${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join(' ');
		root.append(svg('polygon', { points: `${x(0)},${pad.t + innerH} ${line} ${x(points.length - 1)},${pad.t + innerH}`, class: 'area' }));
		root.append(svg('polyline', { points: line, class: 'line' }));
	}
	const marker = svg('line', { x1: 0, x2: 0, y1: pad.t, y2: pad.t + innerH, class: 'marker', visibility: 'hidden' });
	root.append(marker);

	const last = points[points.length - 1];
	const readout = h('div', { class: 'readout' }, `${lab(last.label)}：${fmt(last.value)}`);
	const wrap = h('div', { class: 'chart-wrap' }, root);
	const pick = (clientX: number) => {
		const rect = root.getBoundingClientRect();
		const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
		const index = options.type === 'bar' ? Math.min(points.length - 1, Math.floor(ratio * points.length)) : Math.round(ratio * (points.length - 1));
		const point = points[index];
		marker.setAttribute('x1', String(x(index)));
		marker.setAttribute('x2', String(x(index)));
		marker.setAttribute('visibility', 'visible');
		readout.textContent = `${lab(point.label)}：${fmt(point.value)}`;
	};
	wrap.addEventListener('pointerdown', (event) => pick(event.clientX));
	wrap.addEventListener('pointermove', (event) => {
		if (event.buttons > 0 || event.pointerType === 'mouse') pick(event.clientX);
	});
	const total = points.reduce((sum, point) => sum + point.value, 0);
	return [
		readout,
		wrap,
		h('div', { class: 'axis' }, h('span', {}, lab(points[0].label)), h('span', {}, `最高 ${fmt(Math.max(...points.map((point) => point.value)))}`), h('span', {}, lab(last.label))),
		options.type === 'bar' ? h('p', { class: 'note' }, `合計 ${fmt(total)}`) : null,
		h('p', { class: 'note' }, '點圖表或在圖上滑動可看各點數值。'),
	];
}

const STATUS_LABELS: Record<string, string> = { published: '已發布', draft: '草稿', archived: '封存' };
function statusChart(points: L.Point[]): Child[] {
	const total = points.reduce((sum, point) => sum + point.value, 0);
	if (total === 0) return [h('div', { class: 'state' }, '沒有資料。')];
	const colors = ['var(--accent)', 'var(--muted-bar)', 'var(--third)', 'var(--fourth)'];
	const root = svg('svg', { viewBox: '0 0 120 120', class: 'donut', role: 'img' });
	let offset = 0;
	const circumference = 2 * Math.PI * 45;
	points.forEach((point, index) => {
		const length = (point.value / total) * circumference;
		root.append(svg('circle', { cx: 60, cy: 60, r: 45, fill: 'none', stroke: colors[index % colors.length], 'stroke-width': 22, 'stroke-dasharray': `${length} ${circumference - length}`, 'stroke-dashoffset': -offset, transform: 'rotate(-90 60 60)' }));
		offset += length;
	});
	const legend = h(
		'ul',
		{ class: 'legend' },
		...points.map((point, index) =>
			h('li', {}, h('span', { class: 'swatch', style: `background:${colors[index % colors.length]}` }), h('span', {}, STATUS_LABELS[point.label] ?? point.label), h('span', { class: 'num' }, `${formatNumber(point.value)} 篇・${Math.round((point.value / total) * 100)}%`)),
		),
	);
	return [h('div', { class: 'donut-wrap' }, root, legend)];
}

// ── 組頁面 ──

function trafficTab(): HTMLElement {
	const parts: { title: string; note?: string; task: () => Promise<Child | Child[]> }[] = [
		{ title: '使用者', task: async () => renderCard(await L.loadUsersCard(get)) },
		{ title: '文章觀看', note: '只算已發布文章。', task: async () => renderCard(await L.loadViewsCard(get, 'articles')) },
		{ title: '頁面觀看', task: async () => renderCard(await L.loadViewsCard(get, 'pages')) },
		{ title: '文章觀看明細', note: '點一篇展開入口與逐日明細。', task: async () => contentList('articles', await L.loadContentRows(get, 'articles')) },
		{ title: '頁面觀看明細', note: '點一頁展開入口與逐日明細。', task: async () => contentList('pages', await L.loadContentRows(get, 'pages')) },
		{ title: '熱門入口造訪次數', task: async () => channelBars(await L.loadChannelBars(get)) },
		{ title: '流量入口與進站頁', task: async () => sourceList(await L.loadSourceRows(get)) },
		{ title: '每日流量趨勢', task: async () => chart(await L.loadDailySeries(get, 'daily_views', 'date', 'total_views', 'sum'), { type: 'line' }) },
		{ title: '每日活躍使用者', task: async () => chart(await L.loadDailySeries(get, 'daily_views', 'date', 'active_users', 'sum'), { type: 'line' }) },
	];
	return buildTab(parts);
}

function contentTab(): HTMLElement {
	const parts: { title: string; note?: string; task: () => Promise<Child | Child[]> }[] = [
		{ title: '發文概況', task: async () => renderCard(await L.loadPostsCard(get)) },
		{ title: '寫作品質', note: '只算已發布文章。', task: async () => renderCard(await L.loadQualityCard(get)) },
		{ title: '站內連結', task: async () => renderCard(await L.loadLinksCard(get)) },
		{ title: '發布狀態', task: async () => statusChart(await L.loadStatusCounts(get)) },
		{ title: '每月發文數', note: '只算已發布文章。', task: async () => chart(await L.loadMonthlyPosts(get), { type: 'bar', labelFormat: (label) => label.replace('-', '/') }) },
		{ title: '文章明細', task: async () => articleList(await L.loadArticleRows(get)) },
		{ title: '平均字數趨勢', task: async () => chart(await L.loadDailySeries(get, 'content_stats_history', 'run_date', 'avg_word_count', 'avg'), { type: 'line', format: (value) => formatDecimal(value) }) },
		{ title: '已發布篇數趨勢', task: async () => chart(await L.loadDailySeries(get, 'content_stats_history', 'run_date', 'article_count', 'avg'), { type: 'line', format: (value) => formatDecimal(value) }) },
	];
	return buildTab(parts);
}

function buildTab(parts: { title: string; note?: string; task: () => Promise<Child | Child[]> }[]): HTMLElement {
	const container = h('div', { class: 'tab-body' });
	for (const part of parts) {
		const { el, body } = section(part.title, part.note);
		container.append(el);
		fill(body, part.task).catch(() => undefined);
	}
	return container;
}

function renderDashboard() {
	lastLoaded = Date.now();
	const time = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
	const content = h('main', { id: 'content' });
	const tabButtons = TABS.map((tab) =>
		h(
			'button',
			{
				type: 'button',
				role: 'tab',
				class: tab.id === currentTab ? 'tab active' : 'tab',
				'aria-selected': tab.id === currentTab ? 'true' : 'false',
				onclick: () => {
					if (currentTab === tab.id) return;
					currentTab = tab.id;
					try {
						localStorage.setItem('mobile-stats:tab', tab.id);
					} catch {
						/* 記不住分頁也沒關係 */
					}
					renderDashboard();
					window.scrollTo(0, 0);
				},
			},
			tab.label,
		),
	);
	const header = h(
		'header',
		{ class: 'top' },
		h(
			'div',
			{ class: 'top-row' },
			h('div', { class: 'brand' }, h('img', { src: `${BASE}icon-192.png`, alt: '', width: 28, height: 28 }), h('span', {}, '網站統計')),
			h('div', { class: 'top-actions' }, h('button', { type: 'button', class: 'ghost', onclick: () => renderDashboard() }, '重新整理'), h('button', { type: 'button', class: 'ghost', onclick: logout }, '登出')),
		),
		h('nav', { class: 'tabs', role: 'tablist' }, ...tabButtons),
	);
	content.append(currentTab === 'traffic' ? trafficTab() : contentTab());
	content.append(h('p', { class: 'footer note' }, `${time} 載入・資料每日由排程同步，和後台儀表板同一份。`));
	app.replaceChildren(header, content);
}

async function start() {
	showMessage('網站統計', '載入中…');
	let me = await whoami();
	if (!me.authenticated && (await refreshSession())) me = await whoami();
	if (!me.authenticated) {
		showLogin();
		return;
	}
	if (!me.admin) {
		showMessage('沒有權限', '這個頁面只開放管理員帳號。', [h('button', { type: 'button', class: 'primary', onclick: logout }, '登出並換帳號')]);
		return;
	}
	renderDashboard();
}

// 從背景切回來超過 5 分鐘就自動重新整理，避免看到舊數字。
document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'visible' && lastLoaded > 0 && Date.now() - lastLoaded > 5 * 60 * 1000 && document.getElementById('content')) renderDashboard();
});

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register(`${BASE}sw.js`, { scope: BASE }).catch(() => undefined);
}

start().catch((error) => showMessage('發生錯誤', String(error?.message ?? error), [h('button', { type: 'button', class: 'primary', onclick: () => location.reload() }, '重新載入')]));
