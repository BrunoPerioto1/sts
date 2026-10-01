import { ResultIdEnum } from "../api/routes/result-id.ts";

export interface PreviousBetStatus {
  id: number;
  resultId: number;
  cashoutValue?: string | number | null;
}

export type UndoCall =
  | { kind: "batch"; betIds: number[]; resultId: ResultIdEnum }
  | { kind: "single"; id: number; resultId: ResultIdEnum; cashoutValue?: number };

/**
 * Chamadas que devolvem cada aposta ao status de antes do lote.
 *
 * Cashout não entra no endpoint em lote (a API recusa: o valor é por aposta) e
 * sem o valor recebido a API devolve 400. Por isso cada Cashout volta sozinho,
 * com o próprio valor; o resto vai em um lote por status.
 */
export function planBetUndo(previous: PreviousBetStatus[]): UndoCall[] {
  const cashouts: UndoCall[] = [];
  const byResult = new Map<ResultIdEnum, number[]>();

  for (const bet of previous) {
    const resultId = bet.resultId as ResultIdEnum;
    if (resultId === ResultIdEnum.CASHOUT) {
      const value = bet.cashoutValue == null ? undefined : Number(bet.cashoutValue);
      cashouts.push({ kind: "single", id: bet.id, resultId, cashoutValue: value });
    } else {
      byResult.set(resultId, [...(byResult.get(resultId) ?? []), bet.id]);
    }
  }

  const batches = [...byResult].map(([resultId, betIds]): UndoCall =>
    betIds.length === 1
      ? { kind: "single", id: betIds[0], resultId }
      : { kind: "batch", betIds, resultId },
  );
  return [...batches, ...cashouts];
}

/** Quantas apostas uma chamada que falhou deixou sem voltar. */
export function betsInCall(call: UndoCall) {
  return call.kind === "batch" ? call.betIds.length : 1;
}
