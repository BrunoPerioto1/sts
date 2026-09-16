// Quais propostas de liquidação ficam marcadas quando a lista recarrega.
//
// Sugestão nova chega marcada: o fluxo esperado é aceitar tudo e desmarcar as
// poucas que discordar, não marcar uma a uma. Mas o que o usuário desmarcou na
// mão precisa CONTINUAR desmarcado depois de um refetch — remarcar sozinho
// seria o app escolhendo planilhar por ele, que é exatamente o que a tela de
// conferência existe pra impedir.

export interface SelectionInput {
  /** Os betIds que a listagem acabou de devolver. */
  betIds: number[];
  /** O que estava marcado antes do recarregamento. */
  previous: ReadonlySet<number>;
  /** betIds que a tela já tinha mostrado alguma vez. */
  known: ReadonlySet<number>;
}

/**
 * -> o novo conjunto de marcados.
 *
 * Proposta que a tela nunca mostrou entra marcada. Proposta já conhecida mantém
 * o estado que o usuário deixou. Proposta que saiu da lista (planilhada ou
 * descartada) simplesmente não volta.
 */
export function nextSelection({
  betIds,
  previous,
  known,
}: SelectionInput): Set<number> {
  const next = new Set<number>();
  for (const betId of betIds) {
    if (!known.has(betId) || previous.has(betId)) next.add(betId);
  }
  return next;
}
