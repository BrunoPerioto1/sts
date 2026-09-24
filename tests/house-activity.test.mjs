import test from 'node:test';
import assert from 'node:assert/strict';
import { houseActivity, idleDays, STALE_BET_DAYS } from '../src/lib/house-activity.ts';

const NOW = Date.parse('2026-09-24T12:00:00.000Z');
const agoDays = (d) => new Date(NOW - d * 86_400_000).toISOString();

test('casa com aposta recente não ganha aviso', () => {
  assert.deepEqual(houseActivity(agoDays(3), 500, NOW), { kind: 'active', days: 3 });
});

test('só vira "sacar" depois de passar do limite, não no limite', () => {
  assert.equal(houseActivity(agoDays(STALE_BET_DAYS), 500, NOW).kind, 'active');
  assert.deepEqual(houseActivity(agoDays(STALE_BET_DAYS + 1), 500, NOW), { kind: 'withdraw', days: STALE_BET_DAYS + 1 });
});

test('parada sem saldo não pede saque — não há o que sacar', () => {
  assert.deepEqual(houseActivity(agoDays(40), 0, NOW), { kind: 'idle', days: 40 });
  assert.deepEqual(houseActivity(agoDays(40), -30, NOW), { kind: 'idle', days: 40 });
});

test('casa onde nunca se apostou não é confundida com parada', () => {
  assert.deepEqual(houseActivity(null, 800, NOW), { kind: 'never' });
});

test('ordenar por parada: mais dias primeiro, nunca apostada no fim', () => {
  assert.equal(idleDays(agoDays(30), NOW), 30);
  assert.equal(idleDays(null, NOW), -1);
});
