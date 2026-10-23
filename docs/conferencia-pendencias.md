# Conferência: o que ficou de fora do desenho novo

O redesenho da Conferência (abas "Propostas do bot" / "Liquidar na mão",
painel de detalhe, convite do Pro e "Tudo conferido") foi feito todo no front.
Três partes do desenho dependem de dados que a API ainda não manda.

## 1. Status de cada seleção no "Liquidar na mão"

O desenho mostra, em cada perna de uma múltipla ou criar aposta:

- ✅ "Flamengo vence · Confirmado pelo placar 2×1"
- ❓ "Pedro marca · Você confere"

**Hoje:** as seleções aparecem só como lista, sem status. O texto é o
`market` quebrado por `" / "`, em `selecoesDe` (`src/lib/settlement-view.ts`).

**Por quê:** o motor (`trackton-api/src/settlement/settle.ts`) avalia cada
condição (`outcomes`), mas só guarda o resultado final. São três campos:
`suggestedResultId`, `reason` e `explanation`, este último com os textos
juntados por `"; "`. O resultado de cada perna e o trecho do mercado a que
ela corresponde se perdem.

**O que fazer na API:**

- Gravar as pernas numa coluna nova, `legs jsonb`, em
  `bet_settlement_suggestions`. Cada perna seria
  `[{ label, outcome: 'WON' | 'LOST' | 'VOID' | 'UNKNOWN', text }]`.
- Fazer `parseMarket` guardar, em cada `Condition`, o trecho do mercado de
  onde ela saiu (o `label`).
- Subir `ENGINE_VERSION`, pra recalcular as sugestões que já existem.
- Devolver `legs` em `GET /settlement/review`.
- No front, trocar a lista simples de `CorpoMao`
  (`src/components/conferir/LiquidarNaMao.tsx`) pelos status.

## 2. Apostas de longo prazo em "Esperando resultado"

O desenho mostra, por exemplo, "Brasileirão 2026 · Campeão: Palmeiras ·
Longo prazo, liquide quando o campeonato acabar".

**Hoje:** "Esperando resultado" só lista as apostas com
`reason = JOGO_NAO_FINALIZADO` ou `SEM_PLACAR`. Aposta de longo prazo não
tem evento ligado, então não entra na fila de conferência
(`findPendingSuggestions` exige `eventResults` ou pernas com placar).

**O que fazer:** decidir de onde vêm essas apostas. Uma opção é uma
consulta à parte, com as pendentes sem evento e marcadas como longo prazo.
Depois, devolver essas apostas no `review` com um `reason` próprio.

## 3. Motivo específico em cada linha

O desenho mostra frases como "O placar não diz quem marcou os gols" ou
"Cartões não vêm no placar".

**Hoje:** a linha mostra uma frase genérica por código de motivo, que vem do
mapa `MOTIVO` em `src/lib/settlement-view.ts` (por exemplo,
`DADO_INDISPONIVEL` vira "O placar não traz esse dado"). O texto técnico da
API (`explanation`) aparece no aviso do detalhe e às vezes soa robótico
("jogador ausente, homônimo ou participação não confirmada").

**O que fazer:** fazer os avaliadores (`market-evaluators.ts`) devolverem
uma frase pensada pro usuário junto com o texto técnico. Uma opção é um
campo `userText` no `Evaluation`, gravado e devolvido no `review`.
