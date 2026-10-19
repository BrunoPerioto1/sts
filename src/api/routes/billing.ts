import { api } from "../apiClient";
import { unwrap } from "../request";

/**
 * Cria a assinatura do Pro e devolve o link do checkout do Mercado Pago, onde
 * a pessoa escolhe cartão, Pix ou boleto. O e-mail é o da conta de lá.
 */
export function postSubscribe(payerEmail: string) {
  return unwrap<{ initPoint: string }>(api.dashboard.post("billing/subscription", { payerEmail }));
}

/** Cancela a cobrança automática. O Pro já pago continua até o fim. */
export function postCancelSubscription() {
  return unwrap<{ success: true }>(api.dashboard.post("billing/subscription/cancel"));
}
