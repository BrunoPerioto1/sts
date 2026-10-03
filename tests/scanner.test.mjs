import test from 'node:test';
import assert from 'node:assert/strict';
import { collectLabel, nameFromUrl, parseTournamentId } from '../src/lib/scanner.ts';

test('id sai do último segmento do path, ignorando hash e query', () => {
  const url = 'https://www.sofascore.com/pt/torneio/futebol/england/premier-league/17';
  assert.equal(parseTournamentId('17'), 17);
  assert.equal(parseTournamentId(' 17 '), 17);
  assert.equal(parseTournamentId(url), 17);
  assert.equal(parseTournamentId(`${url}#id:61627`), 17);
  assert.equal(parseTournamentId(`${url}?tab=x`), 17);
  assert.equal(parseTournamentId(`${url}/`), 17);
});

test('o que não é id vira null, sem chamar a API', () => {
  for (const raw of ['', '0', '-3', 'premier', 'https://www.sofascore.com/pt/torneio/futebol', '#id:61627']) {
    assert.equal(parseTournamentId(raw), null, raw);
  }
});

test('nome sugerido vem do slug', () => {
  assert.equal(nameFromUrl('https://www.sofascore.com/pt/torneio/futebol/brazil/brasileirao-serie-a/325#id:1'), 'Brasileirao Serie A');
  assert.equal(nameFromUrl('325'), '');
});

const NOW = Date.parse('2026-10-03T12:00:00.000Z');
const agoDays = (d) => new Date(NOW - d * 86_400_000).toISOString();
const row = (over) => ({ isActive: true, lastEvents: 24, lastCheckAt: agoDays(1), lastCheckStatus: 'ok', ...over });

test('coluna "Próximos 30 dias" por estado', () => {
  const casos = [
    [row({}), '24 jogos', false],
    [row({ lastEvents: 0 }), '0 jogos', false],
    [row({ lastCheckStatus: 'invalid_id' }), 'ID inválido', true],
    [row({ lastCheckStatus: 'blocked' }), '24 jogos · coleta falhou', true],
    [row({ lastCheckStatus: 'error', lastEvents: null }), 'coleta falhou', true],
    [row({ lastCheckAt: null, lastEvents: null, lastCheckStatus: null }), 'aguardando coleta', false],
    [row({ lastCheckAt: agoDays(6) }), '24 jogos · desatualizado', true],
    [row({ isActive: false, lastEvents: 6 }), 'pausada · última: 6 jogos', false],
    [row({ isActive: false, lastEvents: null }), 'pausada', false],
  ];
  for (const [entrada, text, alert] of casos) {
    assert.deepEqual(collectLabel(entrada, NOW), { text, alert }, text);
  }
});

test('4 dias sem tentativa ainda é normal (seg e qui)', () => {
  assert.equal(collectLabel(row({ lastCheckAt: agoDays(4) }), NOW).alert, false);
});
