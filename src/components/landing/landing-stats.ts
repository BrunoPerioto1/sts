/**
 * Os números que a landing afirma, num lugar só pra conferir com o banco antes
 * de mudar. Só entra número real, arredondado pra baixo (PRODUCT.md, "Evidence
 * on Hand"): 11.979 apostas viram 11 mil.
 */
export const LANDING_STATS = {
  /** Segundos do print no Telegram até a aposta registrada. A CONFERIR: valor pedido pelo dono, ainda sem medição. */
  printToBetSeconds: 8,
  /** Apostas registradas, em milhares (11.979 em 2026-10-18). */
  betsThousands: 11,
  /** Apostadores usando o app ("mais de 200", informado pelo dono em 2026-10-18). */
  users: 200,
  /** Casas cadastradas, arredondado pra baixo (182 na API em 2026-10-20). */
  houses: 170,
};
