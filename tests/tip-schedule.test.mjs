import test from 'node:test';
import assert from 'node:assert/strict';
import { compactStartLabel, groupPendingTips, startLabel } from '../src/lib/tip-schedule.ts';

const NOW = new Date('2026-09-25T18:00:00Z');
const at = (min) => new Date(NOW.getTime() + min * 60_000).toISOString();

test('rótulo relativo ao início do jogo', () => {
  assert.equal(startLabel(at(40), NOW), 'começa em 40 min');
  assert.equal(startLabel(at(0.5), NOW), 'começa em 1 min');
  assert.equal(startLabel(at(120), NOW), 'começa em 2h');
  assert.equal(startLabel(at(135), NOW), 'começa em 2h15');
  assert.equal(startLabel(at(-25), NOW), 'começou há 25 min');
  assert.equal(startLabel(at(-190), NOW), 'começou há 3h10');
  assert.equal(startLabel(at(-60 * 30), NOW), 'começou há mais de um dia');
});

test('rótulo curto cabe na coluna e some fora de um dia', () => {
  assert.equal(compactStartLabel(at(40), NOW), 'em 40 min');
  assert.equal(compactStartLabel(at(-135), NOW), 'há 2h15');
  assert.equal(compactStartLabel(at(60 * 30), NOW), null);
});

test('separa quem ainda dá tempo, quem não tem horário e quem já começou', () => {
  const tips = [
    { id: 1, eventStartAt: at(-10) },
    { id: 2, eventStartAt: at(90) },
    { id: 3, eventStartAt: null },
    { id: 4, eventStartAt: at(15) },
    { id: 5, eventStartAt: at(-120) },
  ];
  const grupos = groupPendingTips(tips, NOW);
  assert.deepEqual(grupos.map((g) => [g.id, g.tips.map((t) => t.id)]), [
    ['upcoming', [4, 2]],
    ['unknown', [3]],
    ['started', [1, 5]],
  ]);
});

test('grupo vazio não aparece', () => {
  const grupos = groupPendingTips([{ id: 1, eventStartAt: at(5) }], NOW);
  assert.deepEqual(grupos.map((g) => g.id), ['upcoming']);
});
