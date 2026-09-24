import test from 'node:test';
import assert from 'node:assert/strict';
import { daysUntilAccess, formatAccessDate, fromSaoPauloInput, toSaoPauloInput } from '../src/lib/access.ts';

// 23:30 em Brasília = 02:30 UTC do dia seguinte.
const ISO = '2026-09-25T02:30:00.000Z';

test('data digitada é hora de Brasília, qualquer que seja o fuso do navegador', () => {
  assert.equal(new Date(fromSaoPauloInput('2026-09-24T23:30')).toISOString(), ISO);
});

test('ida e volta do campo preserva o horário', () => {
  assert.equal(toSaoPauloInput(ISO), '2026-09-24T23:30');
  assert.equal(new Date(fromSaoPauloInput(toSaoPauloInput(ISO))).toISOString(), ISO);
});

test('rótulo mostra dia e hora de Brasília', () => {
  assert.equal(formatAccessDate(ISO), '24/09 23:30');
});

test('dias contam pelo calendário de Brasília, não por 24h', () => {
  // 21:00 de Brasília do dia 24: ainda é "hoje" para o vencimento das 23:30.
  assert.equal(daysUntilAccess(ISO, new Date('2026-09-25T00:00:00.000Z')), 0);
  // Meio-dia do dia 22 → vence em 2 dias.
  assert.equal(daysUntilAccess(ISO, new Date('2026-09-22T15:00:00.000Z')), 2);
});
