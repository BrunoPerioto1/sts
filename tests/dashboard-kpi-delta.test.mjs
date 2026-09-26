import test from 'node:test';
import assert from 'node:assert/strict';
import { kpiDelta } from '../src/lib/dashboard-kpi-delta.ts';

const base = {
  totalBets: 10, settledBets: 10, wonBets: 6, lostBets: 4, pendingBets: 0, canceledBets: 0,
  totalStaked: 1000, settledStake: 1000, totalReturn: 0, averageStake: 100, averageOdd: 1.9,
  totalProfit: 100, roi: 0.1, hitRate: 0.6,
};

test('ROI e acerto comparam em pontos percentuais', () => {
  const current = { ...base, roi: 0.123, hitRate: 0.65 };
  assert.deepEqual(kpiDelta('roi', current, base, 1000), { text: '+2,3 p.p.', signed: 2.3 });
  assert.deepEqual(kpiDelta('hitRate', current, base, 1000), { text: '+5,0 p.p.', signed: 5 });
});

test('volume compara em percentual do período anterior', () => {
  const current = { ...base, totalStaked: 800 };
  assert.deepEqual(kpiDelta('totalStaked', current, base, 1000), { text: '−20%', signed: -20 });
});

test('unidades e apostas comparam pela diferença absoluta', () => {
  const current = { ...base, totalProfit: 150, totalBets: 7 };
  assert.deepEqual(kpiDelta('units', current, base, 1000), { text: '+5 U', signed: 5 });
  assert.deepEqual(kpiDelta('bets', current, base, 1000), { text: '−3', signed: -3 });
});

test('sem apostas no período anterior não há comparação', () => {
  assert.equal(kpiDelta('roi', base, { ...base, totalBets: 0 }, 1000), null);
});

test('pendentes não comparam; unidades sem banca também não', () => {
  assert.equal(kpiDelta('pending', base, base, 1000), null);
  assert.equal(kpiDelta('units', base, base, 0), null);
});

test('mesma coisa nos dois períodos vira "igual"', () => {
  assert.deepEqual(kpiDelta('roi', base, base, 1000), { text: 'igual', signed: 0 });
});
