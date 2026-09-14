import type { PlanilharTipDto, TipItem } from "../api/routes/get-tips";

// Usa os valores revisados na tela, mesmo que a banca mude durante o lote.
export function tipPlanilharDefaults(tip: TipItem): PlanilharTipDto {
  if (!Number.isFinite(tip.recommendedStake) || !(tip.recommendedStake! > 0) ||
      !Number.isFinite(tip.odd) || !(tip.odd! > 1)) {
    throw new Error("Confira stake e odd em Editar antes de planilhar esta tip.");
  }
  return {
    stake: tip.recommendedStake!,
    odd: tip.odd!,
    ...(tip.houseId ? { houseId: tip.houseId } : {}),
  };
}

export async function runTipBatch<T extends { id: number }>(
  items: T[],
  execute: (item: T) => Promise<unknown>,
) {
  const succeeded: number[] = [];
  const failed: { id: number; message: string }[] = [];
  const seen = new Set<number>();
  // Sequencial: não dispara centenas de gravações concorrentes nem repete ids.
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    try {
      await execute(item);
      succeeded.push(item.id);
    } catch (error) {
      failed.push({ id: item.id, message: error instanceof Error ? error.message : "Não foi possível concluir." });
    }
  }
  return { succeeded, failed };
}
