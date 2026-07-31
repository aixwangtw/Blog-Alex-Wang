// 跑法：node --test tools/lib/insights-dashboard-lib.test.mjs
// （或用 package.json 的 npm run test:insights-dashboard）
//
// 不打真的 Directus API。這裡驗證的是「PANELS 這份寫死的 panel 清單本身有沒有問題」與
// 「layoutPanels() 的版面計算邏輯對不對」——這兩件事沒有真的 Directus 實例可以幫忙把關
// （dry-run 只會印出 payload，不會驗證 Directus 收到後會不會噴錯），所以特別重要。
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  KNOWN_PANEL_TYPES,
  layoutPanels,
  PANELS,
  REQUIRED_OPTION_FIELDS,
  validatePanelDefs,
} from './insights-dashboard-lib.mjs';

// ── PANELS 本身的完整性 ───────────────────────────────────────────────────

test('PANELS：每個 panel 的 name 在整份清單裡是唯一的（name 是冪等比對的 key）', () => {
  const names = PANELS.map((p) => p.name);
  const unique = new Set(names);
  assert.equal(unique.size, names.length, `有重複的 panel name：${names.filter((n, i) => names.indexOf(n) !== i).join('、')}`);
});

test('PANELS：每個 panel 的 type 都是已知的內建 panel type', () => {
  for (const p of PANELS) {
    assert.ok(KNOWN_PANEL_TYPES.includes(p.type), `「${p.name}」用了未知的 type「${p.type}」`);
  }
});

test('PANELS：每個 panel 都有 group（A/B/C 之一）、正整數 minWidth/minHeight', () => {
  for (const p of PANELS) {
    assert.ok(['A', 'B', 'C'].includes(p.group), `「${p.name}」的 group 不是 A/B/C`);
    assert.ok(Number.isInteger(p.minWidth) && p.minWidth > 0, `「${p.name}」的 minWidth 不是正整數`);
    assert.ok(Number.isInteger(p.minHeight) && p.minHeight > 0, `「${p.name}」的 minHeight 不是正整數`);
  }
});

test('PANELS：通過 validatePanelDefs() 檢查（沒有缺任何 panel type 要求的必要 options 欄位）', () => {
  const problems = validatePanelDefs(PANELS);
  assert.deepEqual(problems, []);
});

test('PANELS：group B／C 裡讀 content_stats* 的 panel，collection 只會是 content_stats 或 content_stats_history', () => {
  const nonArticlesPanels = PANELS.filter((p) => p.group !== 'A');
  for (const p of nonArticlesPanels) {
    const collection = p.options?.collection;
    assert.ok(
      collection === 'content_stats' || collection === 'content_stats_history',
      `「${p.name}」（group ${p.group}）的 collection 是「${collection}」，預期是 content_stats 或 content_stats_history`,
    );
  }
});

test('PANELS：group A 的 panel 只查 articles collection（不依賴還沒寫入的 content_stats*）', () => {
  const groupA = PANELS.filter((p) => p.group === 'A');
  assert.ok(groupA.length > 0);
  for (const p of groupA) {
    assert.equal(p.options?.collection, 'articles', `「${p.name}」（group A）的 collection 不是 articles`);
  }
});

// ── validatePanelDefs：邊界情況 ────────────────────────────────────────────

test('validatePanelDefs：抓出未知的 panel type', () => {
  const problems = validatePanelDefs([{ name: '壞掉的 panel', type: 'not-a-real-type', options: {} }]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /不是已知的內建 panel type/);
});

test('validatePanelDefs：抓出 metric panel 缺 function', () => {
  const problems = validatePanelDefs([{ name: '缺 function 的 metric', type: 'metric', options: { collection: 'articles' } }]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /options\.function/);
});

test('validatePanelDefs：抓出 bar-chart panel 缺 xAxis／yAxis', () => {
  const problems = validatePanelDefs([{ name: '缺軸的長條圖', type: 'bar-chart', options: { collection: 'articles' } }]);
  assert.equal(problems.length, 2);
  assert.ok(problems.some((p) => p.includes('options.xAxis')));
  assert.ok(problems.some((p) => p.includes('options.yAxis')));
});

test('validatePanelDefs：抓出 time-series panel 缺 dateField', () => {
  const problems = validatePanelDefs([
    { name: '缺日期欄位的時序圖', type: 'time-series', options: { collection: 'articles', function: 'count', valueField: 'id' } },
  ]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /options\.dateField/);
});

test('validatePanelDefs：欄位齊全時回傳空陣列', () => {
  const problems = validatePanelDefs([
    { name: '正常的 metric', type: 'metric', options: { collection: 'articles', field: 'id', function: 'count' } },
    { name: '正常的 list', type: 'list', options: { collection: 'articles' } },
    { name: '正常的 pie', type: 'pie-chart', options: { collection: 'articles', column: 'status' } },
  ]);
  assert.deepEqual(problems, []);
});

// ── layoutPanels ─────────────────────────────────────────────────────────

test('layoutPanels：單欄堆疊，position_x 固定 1，position_y 由 1 開始依序累加 minHeight', () => {
  const panels = [
    { name: 'a', minWidth: 6, minHeight: 4 },
    { name: 'b', minWidth: 12, minHeight: 6 },
    { name: 'c', minWidth: 10, minHeight: 10 },
  ];
  const laidOut = layoutPanels(panels);

  assert.deepEqual(
    laidOut.map((p) => [p.position_x, p.position_y, p.width, p.height]),
    [
      [1, 1, 6, 4],
      [1, 5, 12, 6],
      [1, 11, 10, 10],
    ],
  );
});

test('layoutPanels：任兩個 panel 的 y 範圍不重疊（每個 panel 的 [position_y, position_y+height) 互斥）', () => {
  const laidOut = layoutPanels(PANELS);
  const ranges = laidOut
    .map((p) => [p.position_y, p.position_y + p.height])
    .sort((a, b) => a[0] - b[0]);

  for (let i = 1; i < ranges.length; i++) {
    const [, prevEnd] = ranges[i - 1];
    const [curStart] = ranges[i];
    assert.ok(curStart >= prevEnd, `第 ${i} 個 panel 的起點 ${curStart} 跟前一個的結束 ${prevEnd} 重疊`);
  }
});

test('layoutPanels：不修改傳入的原始陣列與物件（回傳新物件）', () => {
  const original = [{ name: 'a', minWidth: 6, minHeight: 4 }];
  const laidOut = layoutPanels(original);
  assert.equal('position_x' in original[0], false);
  assert.notEqual(laidOut[0], original[0]);
});

test('layoutPanels：空陣列回傳空陣列', () => {
  assert.deepEqual(layoutPanels([]), []);
});

// ── REQUIRED_OPTION_FIELDS 本身的合理性（避免筆誤成沒作用的檢查）─────────────

test('REQUIRED_OPTION_FIELDS：每個 key 都是已知的 panel type，每個必要欄位清單至少一項', () => {
  for (const [type, fields] of Object.entries(REQUIRED_OPTION_FIELDS)) {
    assert.ok(KNOWN_PANEL_TYPES.includes(type), `REQUIRED_OPTION_FIELDS 裡的「${type}」不是已知 panel type`);
    assert.ok(Array.isArray(fields) && fields.length > 0, `「${type}」的必要欄位清單是空的`);
  }
});
