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
  // Quantas gravações correm juntas. 1 (padrão) para planilhar, que cria aposta
  // e mexe no saldo da casa — ali a ordem importa. Marcar como caiu/devolver
  // para a fila é só virar status, então vale disparar em paralelo: com 30 tips
  // o lote passa de meio minuto para poucos segundos.
  concurrency = 1,
) {
  const succeeded: number[] = [];
  const failed: { id: number; message: string }[] = [];
  const seen = new Set<number>();
  const fila = items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  let cursor = 0;
  const worker = async () => {
    while (cursor < fila.length) {
      const item = fila[cursor++];
      try {
        await execute(item);
        succeeded.push(item.id);
      } catch (error) {
        failed.push({
          id: item.id,
          message: error instanceof Error ? error.message : "Não foi possível concluir.",
        });
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(concurrency, fila.length)) }, worker),
  );

  // A ordem de conclusão varia com a concorrência; devolve na ordem da lista.
  const ordem = new Map(fila.map((item, index) => [item.id, index]));
  succeeded.sort((x, y) => ordem.get(x)! - ordem.get(y)!);
  failed.sort((x, y) => ordem.get(x.id)! - ordem.get(y.id)!);
  return { succeeded, failed };
}
