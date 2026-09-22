import test from 'node:test';
import assert from 'node:assert/strict';
import { ageLevel, ageParts, countLevel, formatSaoPaulo, HEALTH_THRESHOLDS, isLocked } from '../src/lib/admin-health.ts';

const NOW = Date.parse('2026-09-22T16:00:00.000Z');
const agoHours = (h) => new Date(NOW - h * 3600_000).toISOString();

test('idade do coletor muda de faixa nos limiares, não perto deles', () => {
  const { collector } = HEALTH_THRESHOLDS;
  assert.equal(ageLevel(agoHours(0.9), collector, NOW), 'ok');
  assert.equal(ageLevel(agoHours(1), collector, NOW), 'warn');
  assert.equal(ageLevel(agoHours(5.9), collector, NOW), 'warn');
  assert.equal(ageLevel(agoHours(6), collector, NOW), 'bad');
});

test('nunca coletado é vermelho, não neutro', () => {
  assert.equal(ageLevel(null, HEALTH_THRESHOLDS.collector, NOW), 'bad');
  assert.deepEqual(ageParts(null, NOW), { value: '—', unit: 'nunca' });
});

test('tip tolera silêncio de um dia', () => {
  assert.equal(ageLevel(agoHours(12), HEALTH_THRESHOLDS.tip, NOW), 'ok');
  assert.equal(ageLevel(agoHours(30), HEALTH_THRESHOLDS.tip, NOW), 'warn');
  assert.equal(ageLevel(agoHours(72), HEALTH_THRESHOLDS.tip, NOW), 'bad');
});

test('unidade acompanha a escala', () => {
  assert.deepEqual(ageParts(agoHours(0.25), NOW), { value: '15', unit: 'min' });
  assert.deepEqual(ageParts(agoHours(7), NOW), { value: '7', unit: 'h' });
  assert.deepEqual(ageParts(agoHours(72), NOW), { value: '3', unit: 'd' });
});

test('zero é verde e a escada de contagem sobe uma vez só', () => {
  assert.equal(countLevel(0), 'ok');
  assert.equal(countLevel(1), 'warn');
  assert.equal(countLevel(5), 'warn');
  assert.equal(countLevel(6), 'bad');
});

test('data sai no fuso de Brasília, não no do navegador', () => {
  // 16:00Z é 13:00 em São Paulo (UTC-3).
  assert.equal(formatSaoPaulo('2026-09-22T16:00:00.000Z'), '22/09 13:00');
  assert.equal(formatSaoPaulo(null), '—');
});

test('bloqueio vencido não conta como bloqueado', () => {
  assert.equal(isLocked(new Date(NOW + 60_000).toISOString(), NOW), true);
  assert.equal(isLocked(new Date(NOW - 60_000).toISOString(), NOW), false);
  assert.equal(isLocked(null, NOW), false);
});
