/** 把數字格式化成千分位；null/NaN 顯示「—」。 */
export function formatNumber(value: unknown): string {
	const n = Number(value);
	if (value === null || value === undefined || value === '' || !Number.isFinite(n)) return '—';
	return Math.round(n).toLocaleString('zh-TW');
}

/** 取得指定時區的今天日期（YYYY-MM-DD）。GA4 日期以 Property 時區計算，預設台北。 */
export function todayIn(timeZone = 'Asia/Taipei'): string {
	try {
		return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
	} catch {
		return new Date().toISOString().slice(0, 10);
	}
}

/** localStorage 讀寫都包 try/catch，私密模式或被封鎖時不影響功能。 */
export function readStorage<T>(key: string, fallback: T): T {
	try {
		const raw = window.localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

export function writeStorage(key: string, value: unknown): void {
	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch {
		/* 寫不進去就算了，下次載入回到預設寬度 */
	}
}
