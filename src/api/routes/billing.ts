import { api } from "../apiClient";
import { unwrap } from "../request";

/**
 * Cria a assinatura do Pro e devolve o link do checkout do Mercado Pago, onde
 * a pessoa escolhe cartão, Pix ou boleto, com ou sem conta lá. O e-mail é o
 * dos avisos de cobrança (e o da conta do Mercado Pago, se ela entrar com uma).
 */
export function postSubscribe(payerEmail: string) {
  return unwrap<{ initPoint: string }>(api.dashboard.post("billing/subscription", { payerEmail }));
}

/** Cancela a cobrança automática. O Pro já pago continua até o fim. */
export function postCancelSubscription() {
  return unwrap<{ success: true }>(api.dashboard.post("billing/subscription/cancel"));
}
