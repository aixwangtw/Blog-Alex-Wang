// 跑法：node --test tools/lib/insights-dashboard-lib.test.mjs
// （或用 package.json 的 npm run test:insights）
//
// 不打真的 Directus API。這裡驗證的是「PANELS 這份寫死的 panel 清單本身有沒有問題」與
// 「layoutPanels() 的版面計算邏輯對不對」。
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  articleTableHeight,
  CONTENT_CARD_KINDS,
  CUSTOM_PANEL_TYPES,
  DASHBOARD_NAME,
  GRID_WIDTH,
  KNOWN_PANEL_TYPES,
  LEGACY_DASHBOARD_NAMES,
  layoutPanels,
  OBSOLETE_PANEL_NAMES,
  PANELS,
  REQUIRED_OPTION_FIELDS,
  validatePanelDefs,
} from './insights-dashboard-lib.mjs';

test('dashboard 改名為「文章產出與品質」，舊名保留在 LEGACY 以便沿用原 dashboard', () => {
  assert.equal(DASHBOARD_NAME, '文章產出與品質');
  assert.ok(LEGACY_DASHBOARD_NAMES.includes('網站內容統計'));
  assert.ok(!LEGACY_DASHBOARD_NAMES.includes(DASHBOARD_NAME));
});

test('PANELS：name 唯一（name 是冪等比對的 key），type 都已知，通過 validatePanelDefs', () => {
  const names = PANELS.map((p) => p.name);
  assert.equal(new Set(names).size, names.length);
  for (const p of PANELS) assert.ok(KNOWN_PANEL_TYPES.includes(p.type), `「${p.name}」用了未知的 type「${p.type}」`);
  assert.deepEqual(validatePanelDefs(PANELS), []);
});

test('PANELS：新版面共 8 張，順序為 三張卡片、發布狀態、每月發文數、文章明細、兩張趨勢', () => {
  assert.deepEqual(
    PANELS.map((p) => p.name),
    ['發文概況', '寫作品質', '站內連結', '發布狀態', '每月發文數', '文章明細', '平均字數趨勢', '已發布篇數趨勢'],
  );
  assert.deepEqual(PANELS.map((p) => p.row), [1, 1, 1, 2, 2, 3, 4, 4]);
});

test('PANELS：每張都有 note 說明口徑與非空 icon', () => {
  for (const p of PANELS) {
    assert.ok(typeof p.note === 'string' && p.note.length >= 10, `「${p.name}」缺 note`);
    assert.ok(p.icon, `「${p.name}」缺 icon`);
  }
});

test('PANELS：三張卡片用 content-* kind，且 kind 都在擴充支援的清單內', () => {
  const cards = PANELS.filter((p) => p.type === 'traffic-summary-card');
  assert.deepEqual(cards.map((p) => p.options.kind), ['content-posts', 'content-quality', 'content-links']);
  for (const card of cards) assert.ok(CONTENT_CARD_KINDS.includes(card.options.kind));
  assert.ok(PANELS.some((p) => p.type === 'content-article-table'));
  for (const type of CUSTOM_PANEL_TYPES) assert.ok(KNOWN_PANEL_TYPES.includes(type));
});

test('PANELS：口徑只算已發布——每月發文數帶 status=published 篩選，趨勢讀 content_stats_history', () => {
  const monthly = PANELS.find((p) => p.name === '每月發文數');
  assert.deepEqual(monthly.options.filter, { status: { _eq: 'published' } });
  assert.equal(monthly.options.precision, 'month');
  for (const name of ['平均字數趨勢', '已發布篇數趨勢']) {
    assert.equal(PANELS.find((p) => p.name === name).options.collection, 'content_stats_history');
  }
});

test('OBSOLETE_PANEL_NAMES：舊的零碎 metric／list／達標分布／非 ASCII 清單／達標趨勢都在清單內，且不含新版 panel', () => {
  for (const name of ['總篇數', '平均正文字數', '正文字數排行', 'description 達標分布', 'slug 含非 ASCII 字元的文章', 'description 達標篇數趨勢', '孤島文章清單', '死路文章清單', '草稿篇數', '總篇數趨勢', 'status 分布']) {
    assert.ok(OBSOLETE_PANEL_NAMES.includes(name), `OBSOLETE 缺「${name}」`);
  }
  const current = new Set(PANELS.map((p) => p.name));
  for (const name of OBSOLETE_PANEL_NAMES) assert.ok(!current.has(name), `「${name}」同時在新版與 OBSOLETE`);
  assert.equal(new Set(OBSOLETE_PANEL_NAMES).size, OBSOLETE_PANEL_NAMES.length);
});

test('validatePanelDefs：抓出未知 type、缺必要欄位，欄位齊全時回傳空陣列', () => {
  assert.match(validatePanelDefs([{ name: 'x', type: 'not-a-real-type', options: {} }])[0], /不是已知的 panel type/);
  assert.match(validatePanelDefs([{ name: 'x', type: 'metric', options: { collection: 'articles' } }])[0], /options\.function/);
  assert.match(validatePanelDefs([{ name: 'x', type: 'traffic-summary-card', options: {} }])[0], /options\.kind/);
  assert.equal(validatePanelDefs([{ name: 'x', type: 'bar-chart', options: { collection: 'a' } }]).length, 2);
  assert.match(validatePanelDefs([{ name: 'x', type: 'time-series', options: { collection: 'a', function: 'count', valueField: 'id' } }])[0], /options\.dateField/);
  assert.deepEqual(validatePanelDefs([
    { name: 'm', type: 'metric', options: { function: 'count' } },
    { name: 'p', type: 'pie-chart', options: { column: 'status' } },
    { name: 't', type: 'content-article-table', options: {} },
  ]), []);
});

test('layoutPanels：60 格滿版，每排由左到右、排與排緊接，y 由上一排最高者推算', () => {
  const laidOut = layoutPanels(PANELS, { publishedCount: 5 });
  const byName = Object.fromEntries(laidOut.map((p) => [p.name, p]));
  assert.deepEqual([byName['發文概況'], byName['寫作品質'], byName['站內連結']].map((p) => [p.position_x, p.position_y, p.width]), [[1, 1, 20], [21, 1, 20], [41, 1, 20]]);
  assert.deepEqual([byName['發布狀態'], byName['每月發文數']].map((p) => [p.position_x, p.position_y, p.width]), [[1, 11, 24], [25, 11, 36]]);
  assert.deepEqual([byName['文章明細'].position_x, byName['文章明細'].position_y, byName['文章明細'].width], [1, 33, 60]);
  assert.deepEqual([byName['平均字數趨勢'], byName['已發布篇數趨勢']].map((p) => [p.position_x, p.position_y, p.width]), [[1, 33 + articleTableHeight(5), 30], [31, 33 + articleTableHeight(5), 30]]);
});

test('layoutPanels：每排剛好填滿 60 格，且任兩張不重疊', () => {
  const laidOut = layoutPanels(PANELS, { publishedCount: 12 });
  for (const row of new Set(laidOut.map((p) => p.row))) {
    assert.equal(laidOut.filter((p) => p.row === row).reduce((sum, p) => sum + p.width, 0), GRID_WIDTH, `第 ${row} 排沒有填滿 ${GRID_WIDTH} 格`);
  }
  for (let i = 0; i < laidOut.length; i++) {
    for (let j = i + 1; j < laidOut.length; j++) {
      const a = laidOut[i];
      const b = laidOut[j];
      const overlaps = a.position_x < b.position_x + b.width && b.position_x < a.position_x + a.width && a.position_y < b.position_y + b.height && b.position_y < a.position_y + a.height;
      assert.equal(overlaps, false, `「${a.name}」和「${b.name}」重疊`);
    }
  }
});

test('articleTableHeight：依篇數增加、下限 14、上限 50', () => {
  assert.equal(articleTableHeight(0), 14);
  assert.equal(articleTableHeight(5), 18);
  assert.ok(articleTableHeight(10) > articleTableHeight(5));
  assert.equal(articleTableHeight(500), 50);
});

test('layoutPanels：不指定篇數時用 panel 預設高度；不修改原陣列；空陣列回傳空陣列', () => {
  const original = [{ name: 'a', row: 1, type: 'content-article-table', width: 60, height: 18 }];
  const laidOut = layoutPanels(original);
  assert.equal(laidOut[0].height, 18);
  assert.equal('position_x' in original[0], false);
  assert.deepEqual(layoutPanels([]), []);
});

test('REQUIRED_OPTION_FIELDS：每個 key 都是已知的 panel type，每個必要欄位清單至少一項', () => {
  for (const [type, fields] of Object.entries(REQUIRED_OPTION_FIELDS)) {
    assert.ok(KNOWN_PANEL_TYPES.includes(type));
    assert.ok(Array.isArray(fields) && fields.length > 0);
  }
});
