/**
 * Os números que a landing afirma, num lugar só pra conferir com o banco antes
 * de mudar. Só entra número real, arredondado pra baixo (PRODUCT.md, "Evidence
 * on Hand"): 11.979 apostas viram 11 mil.
 */
export const LANDING_STATS = {
  /** Segundos do print no Telegram até a aposta registrada. A CONFERIR: valor pedido pelo dono (era 8, virou 4 em 2026-10-20), ainda sem medição. */
  printToBetSeconds: 4,
  /**
   * Apostas registradas, em milhares, mostrado como "+50 mil". A CONFERIR:
   * informado pelo dono em 2026-10-20; o banco tinha 11.979 em 2026-10-18.
   */
  betsThousands: 50,
  /** Apostadores usando o app (informado pelo dono; desde 2026-10-20 sem o "mais de"). */
  users: 200,
  /** Casas cadastradas, arredondado pra baixo (182 na API em 2026-10-20). */
  houses: 170,
};
