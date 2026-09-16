import test from 'node:test';
import assert from 'node:assert/strict';
import {
  diaRelativo,
  formatTally,
  lucroSugerido,
  tally,
} from '../src/lib/settlement-view.ts';
import { ResultIdEnum } from '../src/api/routes/result-id.ts';

const proposta = (suggestedResultId, stake = 100, odd = 1.85) => ({
  betId: 1,
  game: 'Flamengo x Vasco',
  market: 'Mais de 2.5 gols',
  stake,
  odd,
  eventStartAt: null,
  suggestedResultId,
  explanation: '',
  homeScore: null,
  awayScore: null,
});

test('ganha rende stake x (odd - 1); perdida tira a stake', () => {
  // Ponto flutuante: 100 * 0.85 não fecha exato em binário, e o que importa é
  // o valor que o usuário lê depois de formatado.
  assert.ok(Math.abs(lucroSugerido(proposta(ResultIdEnum.WON, 100, 1.85)) - 85) < 1e-9);
  assert.equal(lucroSugerido(proposta(ResultIdEnum.LOST, 100, 1.85)), -100);
});

test('anulada não move o lucro', () => {
  // Devolver a stake não é ganho nem perda: se entrasse como número aqui, o
  // rodapé prometeria um lucro que a planilha não vai registrar.
  assert.equal(lucroSugerido(proposta(ResultIdEnum.CANCELED, 150, 2.05)), 0);
});

test('tally separa por resultado sugerido', () => {
  const conta = tally([
    proposta(ResultIdEnum.WON),
    proposta(ResultIdEnum.WON),
    proposta(ResultIdEnum.LOST),
    proposta(ResultIdEnum.CANCELED),
  ]);
  assert.deepEqual(conta, { ganhas: 2, perdidas: 1, anuladas: 1 });
});

test('categoria zerada não aparece no resumo', () => {
  assert.equal(
    formatTally({ ganhas: 8, perdidas: 3, anuladas: 1 }),
    '8 ganhas · 3 perdidas · 1 anulada',
  );
  assert.equal(formatTally({ ganhas: 1, perdidas: 0, anuladas: 0 }), '1 ganha');
  assert.equal(formatTally({ ganhas: 0, perdidas: 0, anuladas: 0 }), '');
});

test('dia relativo vira data cheia quando fica antigo', () => {
  const agora = new Date(2026, 8, 14, 12, 0);
  assert.equal(diaRelativo(new Date(2026, 8, 14, 16, 0), agora), 'hoje');
  assert.equal(diaRelativo(new Date(2026, 8, 13, 21, 0), agora), 'ontem');
  assert.equal(diaRelativo(new Date(2026, 8, 12, 20, 30), agora), '2 dias');
  assert.equal(diaRelativo(new Date(2026, 8, 1, 20, 30), agora), '01/09');
});

test('data inválida não quebra a linha', () => {
  assert.equal(diaRelativo('nao e data'), '');
});
