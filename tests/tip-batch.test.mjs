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

test('lote em paralelo respeita o teto e devolve na ordem da lista', async () => {
  let emVoo = 0;
  let pico = 0;
  const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
  const result = await runTipBatch(items, async ({ id }) => {
    emVoo++;
    pico = Math.max(pico, emVoo);
    await new Promise((r) => setTimeout(r, id % 3));
    emVoo--;
    if (id === 4) throw new Error('falhou');
  }, 3);
  assert.equal(pico, 3);
  assert.deepEqual(result.succeeded, [1, 2, 3, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(result.failed, [{ id: 4, message: 'falhou' }]);
});
