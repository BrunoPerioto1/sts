import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STALE_BET_DAYS, houseActivity, idleDays, staleDaysFrom } from '../src/lib/house-activity.ts';

const NOW = Date.parse('2026-09-24T12:00:00.000Z');
const agoDays = (d) => new Date(NOW - d * 86_400_000).toISOString();

test('casa com aposta recente não ganha aviso', () => {
  assert.deepEqual(houseActivity(agoDays(3), 500, 20, NOW), { kind: 'active', days: 3 });
});

test('só vira "sacar" depois de passar do limite, não no limite', () => {
  assert.equal(houseActivity(agoDays(20), 500, 20, NOW).kind, 'active');
  assert.deepEqual(houseActivity(agoDays(21), 500, 20, NOW), { kind: 'withdraw', days: 21 });
});

test('o limite configurado manda', () => {
  assert.equal(houseActivity(agoDays(8), 500, 7, NOW).kind, 'withdraw');
  assert.equal(houseActivity(agoDays(25), 500, 30, NOW).kind, 'active');
});

test('parada sem saldo não pede saque — não há o que sacar', () => {
  assert.deepEqual(houseActivity(agoDays(40), 0, 20, NOW), { kind: 'idle', days: 40 });
  assert.deepEqual(houseActivity(agoDays(40), -30, 20, NOW), { kind: 'idle', days: 40 });
});

test('casa onde nunca se apostou não é confundida com parada', () => {
  assert.deepEqual(houseActivity(null, 800, 20, NOW), { kind: 'never' });
});

test('sem configuração usa o padrão; valor inválido também', () => {
  assert.equal(staleDaysFrom(null), DEFAULT_STALE_BET_DAYS);
  assert.equal(staleDaysFrom(undefined), DEFAULT_STALE_BET_DAYS);
  assert.equal(staleDaysFrom(0), DEFAULT_STALE_BET_DAYS);
  assert.equal(staleDaysFrom('15'), 15);
});

test('ordenar por parada: mais dias primeiro, nunca apostada no fim', () => {
  assert.equal(idleDays(agoDays(30), NOW), 30);
  assert.equal(idleDays(null, NOW), -1);
});
