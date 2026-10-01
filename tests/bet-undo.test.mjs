import test from 'node:test';
import assert from 'node:assert/strict';
import { betsInCall, planBetUndo } from '../src/lib/bet-undo.ts';

const WON = 1, LOST = 2, CASHOUT = 6, PENDING = 9;

test('cashout volta sozinho, com o valor recebido', () => {
  assert.deepEqual(planBetUndo([{ id: 7, resultId: CASHOUT, cashoutValue: '83.50' }]), [
    { kind: 'single', id: 7, resultId: CASHOUT, cashoutValue: 83.5 },
  ]);
});

test('todos cashout: nenhum vai pelo lote, que a API recusa', () => {
  const calls = planBetUndo([
    { id: 1, resultId: CASHOUT, cashoutValue: 10 },
    { id: 2, resultId: CASHOUT, cashoutValue: 20 },
  ]);
  assert.ok(calls.every((call) => call.kind === 'single'));
  assert.deepEqual(calls.map((call) => call.cashoutValue), [10, 20]);
});

test('status iguais vão num lote só; misturados, um lote por status', () => {
  assert.deepEqual(planBetUndo([
    { id: 1, resultId: PENDING },
    { id: 2, resultId: PENDING },
    { id: 3, resultId: WON },
    { id: 4, resultId: CASHOUT, cashoutValue: 5 },
    { id: 5, resultId: LOST },
    { id: 6, resultId: LOST },
  ]), [
    { kind: 'batch', betIds: [1, 2], resultId: PENDING },
    { kind: 'single', id: 3, resultId: WON },
    { kind: 'batch', betIds: [5, 6], resultId: LOST },
    { kind: 'single', id: 4, resultId: CASHOUT, cashoutValue: 5 },
  ]);
});

test('falha de lote conta todas as apostas dele', () => {
  assert.equal(betsInCall({ kind: 'batch', betIds: [1, 2, 3], resultId: LOST }), 3);
  assert.equal(betsInCall({ kind: 'single', id: 1, resultId: WON }), 1);
});
