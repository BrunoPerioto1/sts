import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { defaultDashboardPreferences, normalizeDashboardPreferences, KPI_IDS, ICON_IDS, kpiColumnSpan, toggleKpi, moveKpi, performanceColor, POSITIVE_COLORS, NEGATIVE_COLORS } from '../src/lib/dashboard-preferences.ts';

test('usuário antigo recebe os oito indicadores, ordem e ícones originais', () => {
  const defaults = defaultDashboardPreferences();
  assert.deepEqual(normalizeDashboardPreferences(undefined), defaults);
  assert.deepEqual(normalizeDashboardPreferences(null), defaults);
  assert.deepEqual(defaults.kpis.map((kpi) => kpi.id), ['roi', 'units', 'bets', 'pending', 'totalStaked', 'averageStake', 'averageOdd', 'hitRate']);
  assert.deepEqual(defaults.kpis.map((kpi) => kpi.icon), ['trending-up', 'coins', 'database', 'clock', 'credit-card', 'chart-bar', 'trending-up', 'target']);
  assert.ok(defaults.kpis.every((kpi) => kpi.visible));
});

for (let count = 2; count <= 8; count++) {
  test(`${count} KPIs: ocultar/reexibir e último span quando ímpar`, () => {
    let kpis = defaultDashboardPreferences().kpis;
    for (const id of KPI_IDS.slice(count)) kpis = toggleKpi(kpis, id);
    assert.equal(kpis.filter((kpi) => kpi.visible).length, count);
    for (let i = 0; i < count; i++) assert.equal(kpiColumnSpan(i, count), count % 2 && i === count - 1 ? 2 : 1);
    assert.equal(kpis.length, 8);
    for (const id of KPI_IDS.slice(count)) kpis = toggleKpi(kpis, id);
    assert.ok(kpis.every((kpi) => kpi.visible));
  });
}

test('mínimo de dois inclusive preferências corrompidas', () => {
  const prefs = defaultDashboardPreferences();
  prefs.kpis = prefs.kpis.map((kpi, index) => ({ ...kpi, visible: index < 2 }));
  assert.equal(toggleKpi(prefs.kpis, 'roi'), prefs.kpis);
  prefs.kpis.forEach((kpi) => { kpi.visible = false; });
  assert.equal(normalizeDashboardPreferences(prefs).kpis.filter((kpi) => kpi.visible).length, 2);
});

test('ordem, ícone, visibilidade e cores sobrevivem a serialização/reabertura', () => {
  const prefs = defaultDashboardPreferences();
  prefs.kpis = moveKpi(prefs.kpis, 7, 0);
  prefs.kpis[0].icon = 'trophy';
  prefs.kpis = toggleKpi(prefs.kpis, 'pending');
  prefs.performanceColors = { enabled: true, customEnabled: true, positive: 'emerald', negative: 'coral' };
  assert.deepEqual(normalizeDashboardPreferences(JSON.parse(JSON.stringify(prefs))), prefs);
  assert.equal(prefs.kpis[0].id, 'hitRate');
  assert.equal(moveKpi(prefs.kpis, 0, -1), prefs.kpis);
  assert.equal(moveKpi(prefs.kpis, 7, 8), prefs.kpis);
});

test('fallback de ícones/cores desconhecidos, duplicatas, campos faltantes e tipos inválidos', () => {
  const prefs = normalizeDashboardPreferences({ kpis: [{ id: 'units', visible: true, icon: 'gone' }, { id: 'units' }, { id: 'unknown' }, null], performanceColors: { positive: '__proto__', negative: '#ff0000', enabled: 'false' } });
  assert.equal(prefs.kpis[0].icon, 'coins');
  assert.equal(new Set(prefs.kpis.map((kpi) => kpi.id)).size, 8);
  assert.deepEqual(prefs.performanceColors, defaultDashboardPreferences().performanceColors);
  for (const malformed of [true, 'string', [], 1]) assert.deepEqual(normalizeDashboardPreferences(malformed), defaultDashboardPreferences());
  assert.ok(prefs.kpis.every((kpi) => ICON_IDS.includes(kpi.icon)));
});

test('positivos/negativos, zero, unidade indisponível e cores desativadas', () => {
  const colors = defaultDashboardPreferences().performanceColors;
  assert.equal(performanceColor(106.1, colors), POSITIVE_COLORS['default-positive'].token);
  assert.equal(performanceColor(-26.6, colors), NEGATIVE_COLORS['default-negative'].token);
  for (const value of [0, null, undefined, NaN, Infinity]) assert.equal(performanceColor(value, colors), 'var(--color-text)');
  for (const value of [-100, 100]) assert.equal(performanceColor(value, { ...colors, enabled: false }), 'var(--color-text)');
  for (const positive of Object.keys(POSITIVE_COLORS)) assert.equal(performanceColor(1, { ...colors, customEnabled: true, positive }), POSITIVE_COLORS[positive].token);
  for (const negative of Object.keys(NEGATIVE_COLORS)) assert.equal(performanceColor(-1, { ...colors, customEnabled: true, negative }), NEGATIVE_COLORS[negative].token);
});

test('todas as cores têm contraste AA nos fundos dos cards atuais', () => {
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  function luminance(hex) {
    const rgb = hex.match(/\w\w/g).map((v) => parseInt(v, 16) / 255).map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  }
  for (const color of [...Object.values(POSITIVE_COLORS), ...Object.values(NEGATIVE_COLORS)]) {
    const name = color.token.slice(4, -1);
    const hex = css.match(new RegExp(`${name}: (#\\w{6})`))[1];
    for (const bg of ['#09090b', '#131316', '#1c1c20']) assert.ok((luminance(hex) + .05) / (luminance(bg) + .05) >= 4.5, `${name} em ${bg}`);
  }
});
