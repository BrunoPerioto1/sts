import test from 'node:test';
import assert from 'node:assert/strict';
import { nextSelection } from '../src/lib/settlement-selection.ts';

const vazio = new Set();

test('primeira carga marca tudo', () => {
  const marcados = nextSelection({
    betIds: [1, 2, 3],
    previous: vazio,
    known: vazio,
  });
  assert.deepEqual([...marcados], [1, 2, 3]);
});

test('o que o usuário desmarcou não volta marcado no refetch', () => {
  // Ele desmarcou a 2 de propósito; recarregar não pode remarcar, senão o
  // próximo toque no botão verde planilha uma aposta que ele recusou.
  const marcados = nextSelection({
    betIds: [1, 2, 3],
    previous: new Set([1, 3]),
    known: new Set([1, 2, 3]),
  });
  assert.deepEqual([...marcados], [1, 3]);
});

test('proposta nova chega marcada mesmo com as antigas desmarcadas', () => {
  const marcados = nextSelection({
    betIds: [1, 2, 4],
    previous: vazio,
    known: new Set([1, 2]),
  });
  assert.deepEqual([...marcados], [4]);
});

test('proposta que saiu da lista não é arrastada', () => {
  // 1 e 2 foram planilhadas e não vêm mais na listagem.
  const marcados = nextSelection({
    betIds: [3],
    previous: new Set([1, 2, 3]),
    known: new Set([1, 2, 3]),
  });
  assert.deepEqual([...marcados], [3]);
});

test('lista vazia não deixa resto marcado', () => {
  const marcados = nextSelection({
    betIds: [],
    previous: new Set([1, 2]),
    known: new Set([1, 2]),
  });
  assert.equal(marcados.size, 0);
});
