import test from 'node:test';
import assert from 'node:assert/strict';
import { groupHouses, houseMoney } from '../src/lib/house-groups.ts';

const NOW = new Date('2026-09-25T12:00:00Z').getTime();
const daysAgo = (d) => new Date(NOW - d * 86_400_000).toISOString();
const casa = (houseId, realHouseBalance, lastBetAt, openStake = 0) => ({ houseId, realHouseBalance, lastBetAt, openStake });

test('disponível desconta o que está em aberto', () => {
  assert.deepEqual(houseMoney(casa(1, 500, daysAgo(1), 120)), { available: 380, open: 120, shortfall: 0 });
});

test('saldo real negativo vira "a conferir", sem disponível negativo', () => {
  assert.deepEqual(houseMoney(casa(1, -40, daysAgo(1))), { available: 0, open: 0, shortfall: -40 });
});

test('em uso, paradas e sem uso', () => {
  const houses = [
    casa(1, 300, daysAgo(2)),      // em uso
    casa(2, 0, daysAgo(3)),        // em uso (apostou há pouco, saldo zerado)
    casa(3, 150, daysAgo(40)),     // parada com saldo
    casa(4, 0, daysAgo(90)),       // parada sem saldo
    casa(5, 0, null),              // nunca usada
    casa(6, 200, null),            // depositou e ainda não apostou: em uso
  ];
  const grupos = groupHouses(houses, 20, NOW);
  assert.deepEqual(grupos.map((g) => [g.id, g.houses.map((h) => h.houseId)]), [
    ['inUse', [1, 2, 6]],
    ['stopped', [3, 4]],
    ['unused', [5]],
  ]);
});

test('grupo vazio não aparece e a ordem de entrada é preservada', () => {
  const grupos = groupHouses([casa(9, 10, daysAgo(1)), casa(8, 20, daysAgo(1))], 20, NOW);
  assert.deepEqual(grupos.map((g) => [g.id, g.houses.map((h) => h.houseId)]), [['inUse', [9, 8]]]);
});
