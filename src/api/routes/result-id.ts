/**
 * Ids de resultado, como estão na tabela `results` do backend.
 *
 * Mora num arquivo próprio, sem importar o cliente HTTP, pra que as funções
 * puras que dependem dele (lib/settlement-view) possam ser testadas com
 * `node --test` sem arrastar axios e as variáveis de ambiente do Vite junto.
 * `get-bets` reexporta, então os imports existentes continuam valendo.
 *
 * Objeto `as const` em vez de `enum` pelo mesmo motivo: o strip de tipos do
 * Node não executa enum, e o uso (`ResultIdEnum.WON`, tipo `ResultIdEnum`)
 * continua idêntico.
 */
export const ResultIdEnum = {
  WON: 1,
  LOST: 2,
  CANCELED: 3,
  HALF_WON: 4,
  HALF_LOST: 5,
  CASHOUT: 6,
  PENDING: 9,
} as const;

export type ResultIdEnum = (typeof ResultIdEnum)[keyof typeof ResultIdEnum];
