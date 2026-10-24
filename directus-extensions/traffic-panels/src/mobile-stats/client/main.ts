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

function section(title: string): { el: HTMLElement; body: HTMLElement } {
	const body = h('div', { class: 'section-body' }, h('div', { class: 'state' }, '載入中…'));
	const el = h('section', { class: 'panel' }, title ? h('h2', {}, title) : null, body);
	return { el, body };
}

async function fill(body: HTMLElement, task: () => Promise<Child | Child[]>) {
	try {
		const result = await task();
		body.replaceChildren(...((Array.isArray(result) ? result : [result]).filter(Boolean) as (Node | string)[]));
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

function stat(label: string, value: string): HTMLElement {
	return h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, label), h('span', { class: 'stat-value' }, value));
}

// ── 長按彈窗：手指按住約 400ms 才跳出；輕點、捲動、左右滑都不會觸發 ──

const HOLD_MS = 400;
const MOVE_TOLERANCE = 10;
let sheetOpenedAt = 0;

function closeSheet() {
	document.getElementById('sheet-backdrop')?.remove();
}

/** 開彈窗（底部面板）。content 可以是之後才填入的容器（例如逐日明細）。 */
function openSheet(title: string, ...content: Child[]) {
	closeSheet();
	sheetOpenedAt = Date.now();
	const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, h('div', { class: 'sheet-head' }, h('h3', {}, title), h('button', { type: 'button', class: 'ghost close', 'aria-label': '關閉', onclick: closeSheet }, '✕')), h('div', { class: 'sheet-body' }, ...content));
	const backdrop = h('div', { id: 'sheet-backdrop', class: 'sheet-backdrop' }, sheet);
	backdrop.addEventListener('click', (event) => {
		// 放開手指那一下的 click 不算「點外面」。
		if (event.target === backdrop && Date.now() - sheetOpenedAt > 350) closeSheet();
	});
	document.body.append(backdrop);
}

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') closeSheet();
});

/** 讓元素支援長按開彈窗；open 在長按成立時才呼叫。 */
function holdable(el: HTMLElement, open: () => void): HTMLElement {
	el.classList.add('holdable');
	let timer = 0;
	let start = { x: 0, y: 0 };
	let fired = false;
	const cancel = () => {
		window.clearTimeout(timer);
		timer = 0;
		el.classList.remove('pressing');
	};
	el.addEventListener('pointerdown', (event) => {
		if (event.button !== 0) return;
		fired = false;
		start = { x: event.clientX, y: event.clientY };
		el.classList.add('pressing');
		timer = window.setTimeout(() => {
			timer = 0;
			fired = true;
			el.classList.remove('pressing');
			if (navigator.vibrate) navigator.vibrate(10);
			open();
		}, HOLD_MS);
	});
	el.addEventListener('pointermove', (event) => {
		if (timer && Math.hypot(event.clientX - start.x, event.clientY - start.y) > MOVE_TOLERANCE) cancel();
	});
	el.addEventListener('pointerup', cancel);
	el.addEventListener('pointercancel', cancel);
	el.addEventListener('pointerleave', cancel);
	el.addEventListener('contextmenu', (event) => event.preventDefault());
	el.addEventListener('click', (event) => {
		if (fired) {
			event.preventDefault();
			event.stopPropagation();
			fired = false;
		}
	});
	return el;
}

// ── 輪播：三張統計卡左右滑（scroll-snap），下方頁碼點 ──

interface Slide {
	title: string;
	load: () => Promise<L.Card>;
	/** 卡片上不顯示、收進長按彈窗的說明。 */
	note?: string;
	/** 把細項裡的平均停留提到卡片上直接顯示（使用者要求平均停留不要收進彈窗）。 */
	showAvg?: boolean;
}

/** 觀看卡片的 detail 只有一列「平均停留（近 30 天）」，提成第四格。 */
function promoteAvg(card: L.Card): L.Card {
	const row = card.detail?.rows.find((item) => item[0].startsWith('平均停留'));
	if (!row) return card;
	return { cells: [...card.cells, { label: '平均停留', value: row[1] }], detail: { ...card.detail!, rows: card.detail!.rows.filter((item) => item !== row) } };
}

function carousel(slides: Slide[]): HTMLElement {
	const track = h('div', { class: 'carousel-track' });
	const dots = h('div', { class: 'dots', role: 'tablist' });
	slides.forEach((slide, index) => {
		const body = h('div', { class: 'slide-body' }, h('div', { class: 'state' }, '載入中…'));
		const el = h('div', { class: 'slide', role: 'group', 'aria-label': `${index + 1} / ${slides.length}：${slide.title}` }, h('h2', {}, slide.title), body);
		track.append(el);
		const dot = h('button', { type: 'button', class: index === 0 ? 'dot active' : 'dot', 'aria-label': `第 ${index + 1} 張：${slide.title}`, onclick: () => track.scrollTo({ left: el.offsetLeft - track.offsetLeft, behavior: 'smooth' }) });
		dots.append(dot);
		fill(body, async () => {
			const loaded = await slide.load();
			const card = slide.showAvg ? promoteAvg(loaded) : loaded;
			holdable(el, () => {
				const parts: Child[] = [];
				if (slide.note) parts.push(h('p', { class: 'note' }, slide.note));
				for (const cell of card.cells) if (cell.tip) parts.push(h('h4', {}, cell.tip.title), tipTable(cell.tip));
				if (card.detail && card.detail.rows.length > 0) parts.push(card.detail.title ? h('h4', {}, card.detail.title) : null, tipTable(card.detail));
				if (parts.length === 0) parts.push(h('p', { class: 'note' }, '沒有其他細項。'));
				openSheet(slide.title, ...parts);
			});
			return h('div', { class: `cells n${card.cells.length}` }, ...card.cells.map((cell) => h('div', { class: 'cell' }, h('div', { class: 'value' }, cell.value), h('div', { class: 'label' }, cell.label))));
		}).catch(() => undefined);
	});
	track.addEventListener(
		'scroll',
		() => {
			const index = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
			Array.from(dots.children).forEach((dot, i) => dot.classList.toggle('active', i === index));
		},
		{ passive: true },
	);
	return h('div', { class: 'carousel' }, track, h('div', { class: 'carousel-foot' }, dots, h('span', { class: 'hint' }, '按住卡片或列看細項')));
}

// ── 統一的精簡表格：一列一筆，點欄位標題排序，整列按住看細項 ──

interface Column<T> {
	label: string;
	/** 欄寬（px）；不給的那欄（標題）吃掉剩下的寬度並截斷成一行。 */
	width?: number;
	numeric?: boolean;
	text: (row: T) => string;
	/** 排序用；不給就依 text。 */
	sort?: (row: T) => number | string | null;
	/** 第一次點這欄時的方向（數字預設多到少）。 */
	desc?: boolean;
	/** 儲存格額外樣式（例如長條背景）。 */
	style?: (row: T) => string | undefined;
}

interface TableOptions<T> {
	columns: Column<T>[];
	rows: T[];
	/** 預設排序（不對應任何欄位時也可以用，例如固定入口順序）。 */
	defaultSort: (a: T, b: T) => number;
	detail: (row: T) => { title: string; content: Child[] };
	rowClass?: (row: T) => string;
	pageSize?: number;
}

function compareValues(left: number | string | null, right: number | string | null, desc: boolean): number {
	if (left === null && right === null) return 0;
	if (left === null) return 1;
	if (right === null) return -1;
	const result = typeof left === 'string' || typeof right === 'string' ? String(left).localeCompare(String(right), 'zh-TW') : left - right;
	return desc ? -result : result;
}

function dataTable<T>(options: TableOptions<T>): Child[] {
	const pageSize = options.pageSize ?? 10;
	let shown = pageSize;
	let sortIndex: number | null = null;
	let sortDesc = true;
	const table = h('table', { class: 'data' });
	const colgroup = h('colgroup', {}, ...options.columns.map((column) => h('col', { style: column.width ? `width:${column.width}px` : undefined })));
	const headRow = h('tr', {});
	const tbody = h('tbody', {});
	table.append(colgroup, h('thead', {}, headRow), tbody);
	const more = h('button', { type: 'button', class: 'ghost more' });

	const sorted = () => {
		if (sortIndex === null) return [...options.rows].sort(options.defaultSort);
		const column = options.columns[sortIndex];
		const pick = column.sort ?? column.text;
		return [...options.rows].sort((a, b) => compareValues(pick(a), pick(b), sortDesc) || options.defaultSort(a, b));
	};

	const draw = () => {
		headRow.replaceChildren(
			...options.columns.map((column, index) =>
				h(
					'th',
					{
						class: column.numeric ? 'num' : '',
						'aria-sort': sortIndex === index ? (sortDesc ? 'descending' : 'ascending') : undefined,
						onclick: () => {
							if (sortIndex === index) sortDesc = !sortDesc;
							else {
								sortIndex = index;
								sortDesc = column.desc ?? Boolean(column.numeric);
							}
							shown = pageSize;
							draw();
						},
					},
					column.label,
					sortIndex === index ? (sortDesc ? ' ▼' : ' ▲') : '',
				),
			),
		);
		const list = sorted();
		tbody.replaceChildren(
			...list.slice(0, shown).map((row) => {
				const tr = h('tr', { class: options.rowClass?.(row) ?? '' }, ...options.columns.map((column) => h('td', { class: column.numeric ? 'num' : 'text', style: column.style?.(row) }, column.text(row))));
				return holdable(tr, () => {
					const { title, content } = options.detail(row);
					openSheet(title, ...content);
				});
			}),
		);
		if (list.length === 0) tbody.append(h('tr', {}, h('td', { colspan: options.columns.length, class: 'text muted' }, '沒有資料。')));
		const rest = list.length - shown;
		more.textContent = `再顯示 ${Math.min(pageSize, rest)} 筆（${Math.min(shown, list.length)}／${list.length}）`;
		more.hidden = rest <= 0;
	};
	more.addEventListener('click', () => {
		shown += pageSize;
		draw();
	});
	draw();
	return [table, more];
}

const fmtSeconds = (value: number | null) => (value === null ? '—' : `${formatNumber(value)} 秒`);

// ── 文章／頁面觀看明細 ──

function contentTable(kind: 'articles' | 'pages', rows: L.ContentRow[]): Child[] {
	return dataTable<L.ContentRow>({
		rows,
		columns: [
			{ label: kind === 'articles' ? '文章' : '頁面', text: (row) => row.title, desc: false },
			{ label: '當日', width: 40, numeric: true, text: (row) => formatNumber(row.today), sort: (row) => row.today },
			{ label: '30天', width: 46, numeric: true, text: (row) => formatNumber(row.views30d), sort: (row) => row.views30d },
			{ label: '累積', width: 48, numeric: true, text: (row) => formatNumber(row.views), sort: (row) => row.views },
			{ label: '停留', width: 46, numeric: true, text: (row) => (row.avg === null ? '—' : `${formatNumber(row.avg)}秒`), sort: (row) => row.avg },
		],
		// 同桌面版預設：累積觀看多到少。
		defaultSort: (a, b) => b.views - a.views,
		detail: (row) => {
			const daily = h('div', {}, h('div', { class: 'state' }, '載入逐日明細…'));
			fill(daily, async () => {
				const days = await L.loadDailyDetail(get, kind, row.path);
				if (days.length === 0) return h('div', { class: 'state' }, '沒有逐日資料（只保存有觀看的日期）。');
				return tipTable({ title: '', head: ['日期', '觀看', '活躍', '總使用者'], rows: days.map((day) => [String(day.date).replace(/-/g, '/'), formatNumber(day.views), formatNumber(day.active_users), formatNumber(day.total_users)]) });
			}).catch(() => undefined);
			const entries = row.entrySessions > 0 ? row.entries : [];
			return {
				title: row.title,
				content: [
					h('div', { class: 'path' }, row.path),
					h('div', { class: 'stats' }, stat('當日', formatNumber(row.today)), stat('近 30 天', formatNumber(row.views30d)), stat('累積', formatNumber(row.views)), stat('平均停留', fmtSeconds(row.avg))),
					h('p', { class: 'item-meta' }, `主要入口：${L.entryText(row)}`, row.entrySessions > 0 ? `・入口造訪 ${formatNumber(row.entrySessions)} 次` : ''),
					entries.length > 0
						? tipTable({
								title: '',
								head: ['入口', '造訪', '占比'],
								rows: entries.flatMap((entry) => [
									[entry.channel, formatNumber(entry.sessions), `${Math.round((entry.sessions / row.entrySessions) * 100)}%`],
									...(entry.details ?? []).map((detail) => [`　└ ${detail.name}`, formatNumber(detail.sessions), '']),
								]),
							})
						: null,
					h('h4', {}, '逐日明細'),
					daily,
				],
			};
		},
	});
}

// ── 熱門入口 ──

function channelTable(rows: L.ChannelRow[]): Child[] {
	const max = Math.max(0, ...rows.map((row) => row.sessions));
	const order = new Map(rows.map((row, index) => [row.channel, index]));
	return dataTable<L.ChannelRow>({
		rows,
		pageSize: 20,
		columns: [
			{
				label: '入口',
				text: (row) => row.channel,
				desc: false,
				style: (row) => `background-image:linear-gradient(to right,var(--accent-soft) ${max > 0 ? (row.sessions / max) * 100 : 0}%,transparent 0)`,
			},
			{ label: '造訪', width: 64, numeric: true, text: (row) => formatNumber(row.sessions), sort: (row) => row.sessions },
		],
		// 同桌面版：Google 搜尋、AI 搜尋固定前兩名 → 其餘由多到少 → 其他、疑似自動程式。
		defaultSort: (a, b) => (order.get(a.channel) ?? 0) - (order.get(b.channel) ?? 0),
		detail: (row) => ({
			title: `「${row.channel}」`,
			content: [
				h('div', { class: 'stats two' }, stat('造訪次數', formatNumber(row.sessions))),
				row.details.length > 0 ? tipTable({ title: '', head: ['細項', '造訪'], rows: row.details.map((item) => [item.name, formatNumber(item.sessions)]) }) : h('p', { class: 'note' }, '這個入口沒有細項。'),
			],
		}),
	});
}

// ── 流量入口與進站頁 ──

function sourceTable(rows: L.SourceRow[]): Child[] {
	const ranks = L.channelRanks(rows);
	const tie = (a: L.SourceRow, b: L.SourceRow) => b.sessions - a.sessions || a.path.localeCompare(b.path);
	return dataTable<L.SourceRow>({
		rows,
		columns: [
			{ label: '入口', width: 84, text: (row) => row.channel, sort: (row) => ranks.get(row.channel) ?? 0, desc: false },
			{ label: '進站頁', text: (row) => row.title, desc: false },
			{ label: '造訪', width: 52, numeric: true, text: (row) => formatNumber(row.sessions), sort: (row) => row.sessions },
		],
		defaultSort: (a, b) => (ranks.get(a.channel) ?? 0) - (ranks.get(b.channel) ?? 0) || tie(a, b),
		detail: (row) => ({
			title: row.title,
			content: [
				h('div', { class: 'path' }, row.path),
				h('p', { class: 'item-meta' }, `入口：${row.channel}`),
				h('div', { class: 'stats two' }, stat('造訪次數', formatNumber(row.sessions)), stat('觀看次數', formatNumber(row.views))),
				row.details.length > 0 ? tipTable({ title: '', head: ['細項', '造訪'], rows: row.details.map((item) => [item.name, formatNumber(item.sessions)]) }) : null,
			],
		}),
	});
}

// ── 文章產出明細 ──

const LINK_SHORT = ['孤立', '沒人連進', '沒連出去', '正常', '—'];

function articleTable(rows: L.ArticleRow[]): Child[] {
	const byDateDesc = (a: L.ArticleRow, b: L.ArticleRow) => {
		if (!a.pubDate && !b.pubDate) return a.title.localeCompare(b.title, 'zh-TW');
		if (!a.pubDate) return 1;
		if (!b.pubDate) return -1;
		return b.pubDate.localeCompare(a.pubDate) || a.title.localeCompare(b.title, 'zh-TW');
	};
	return dataTable<L.ArticleRow>({
		rows,
		columns: [
			{ label: '文章', text: (row) => row.title, desc: false },
			{ label: '字數', width: 56, numeric: true, text: (row) => formatNumber(row.wordCount), sort: (row) => row.wordCount },
			{ label: '連結', width: 70, text: (row) => LINK_SHORT[row.linkRank] ?? '—', sort: (row) => row.linkRank, desc: false },
		],
		// 同桌面版預設：發布日新到舊。
		defaultSort: byDateDesc,
		rowClass: (row) => (row.linkRank < 3 ? 'warn' : ''),
		detail: (row) => ({
			title: row.title,
			content: [
				h('p', { class: 'item-meta' }, `發布 ${formatDate(row.pubDate)}・更新 ${formatDate(row.updatedDate)}`),
				h('div', { class: 'stats' }, stat('字數', formatNumber(row.wordCount)), stat('SEO 描述', formatNumber(row.descLen)), stat('標籤', formatNumber(row.tagCount)), stat('FAQ', formatNumber(row.faqCount))),
				h('p', { class: 'item-meta' }, `站內連結：${row.linkText}`),
				h('p', { class: 'note' }, 'SEO 描述字數建議 40～80 字。'),
			],
		}),
	});
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

type Part = { title: string; task: () => Promise<Child | Child[]> };

function trafficTab(): HTMLElement {
	return buildTab(
		carousel([
			{ title: '文章觀看', note: '只算已發布文章。', showAvg: true, load: () => L.loadViewsCard(get, 'articles') },
			{ title: '頁面觀看', showAvg: true, load: () => L.loadViewsCard(get, 'pages') },
			{ title: '使用者', load: () => L.loadUsersCard(get) },
		]),
		[
			{ title: '文章觀看明細', task: async () => contentTable('articles', await L.loadContentRows(get, 'articles')) },
			{ title: '頁面觀看明細', task: async () => contentTable('pages', await L.loadContentRows(get, 'pages')) },
			{ title: '熱門入口造訪次數', task: async () => channelTable(await L.loadChannelBars(get)) },
			{ title: '流量入口與進站頁', task: async () => sourceTable(await L.loadSourceRows(get)) },
			{ title: '每日流量趨勢', task: async () => chart(await L.loadDailySeries(get, 'daily_views', 'date', 'total_views', 'sum'), { type: 'line' }) },
			{ title: '每日活躍使用者', task: async () => chart(await L.loadDailySeries(get, 'daily_views', 'date', 'active_users', 'sum'), { type: 'line' }) },
		],
	);
}

function contentTab(): HTMLElement {
	return buildTab(
		carousel([
			{ title: '發文概況', load: () => L.loadPostsCard(get) },
			{ title: '寫作品質', note: '只算已發布文章。', load: () => L.loadQualityCard(get) },
			{ title: '站內連結', load: () => L.loadLinksCard(get) },
		]),
		[
			{ title: '文章明細', task: async () => articleTable(await L.loadArticleRows(get)) },
			{ title: '發布狀態', task: async () => statusChart(await L.loadStatusCounts(get)) },
			{ title: '每月發文數（已發布）', task: async () => chart(await L.loadMonthlyPosts(get), { type: 'bar', labelFormat: (label) => label.replace('-', '/') }) },
			{ title: '平均字數趨勢', task: async () => chart(await L.loadDailySeries(get, 'content_stats_history', 'run_date', 'avg_word_count', 'avg'), { type: 'line', format: (value) => formatDecimal(value) }) },
			{ title: '已發布篇數趨勢', task: async () => chart(await L.loadDailySeries(get, 'content_stats_history', 'run_date', 'article_count', 'avg'), { type: 'line', format: (value) => formatDecimal(value) }) },
		],
	);
}

function buildTab(top: HTMLElement, parts: Part[]): HTMLElement {
	const container = h('div', { class: 'tab-body' }, top);
	for (const part of parts) {
		const { el, body } = section(part.title);
		container.append(el);
		fill(body, part.task).catch(() => undefined);
	}
	return container;
}

function renderDashboard() {
	lastLoaded = Date.now();
	const time = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
	closeSheet();
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
	content.append(h('p', { class: 'footer note' }, `${time} 載入・按住任一列或卡片看細項`));
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
