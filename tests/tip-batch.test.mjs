import test from 'node:test';
import assert from 'node:assert/strict';
import { runTipBatch, tipPlanilharDefaults } from '../src/lib/tip-batch.ts';

test('lote não repete ids e continua após falha parcial', async () => {
  const calls = [];
  const result = await runTipBatch([{ id: 1 }, { id: 2 }, { id: 1 }, { id: 3 }], async ({ id }) => {
    calls.push(id);
    if (id === 2) throw new Error('Casa não reconhecida');
  });
  assert.deepEqual(calls, [1, 2, 3]);
  assert.deepEqual(result.succeeded, [1, 3]);
  assert.deepEqual(result.failed, [{ id: 2, message: 'Casa não reconhecida' }]);
});

test('planilhar preserva stake, odd e casa revisadas pelo usuário', () => {
  assert.deepEqual(tipPlanilharDefaults({ recommendedStake: 58.10, odd: 2.85, houseId: 4 }),
    { stake: 58.10, odd: 2.85, houseId: 4 });
  assert.deepEqual(tipPlanilharDefaults({ recommendedStake: 10, odd: 2, houseId: null }),
    { stake: 10, odd: 2 });
});

test('dados incompletos não viram apostas com valores inventados', () => {
  for (const recommendedStake of [null, 0, -1, NaN, Infinity]) {
    assert.throws(() => tipPlanilharDefaults({ recommendedStake, odd: 2 }));
  }
  for (const odd of [null, 0, 1, -1, NaN, Infinity]) {
    assert.throws(() => tipPlanilharDefaults({ recommendedStake: 10, odd }));
  }
});
