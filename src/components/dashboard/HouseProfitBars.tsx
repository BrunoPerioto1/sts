import type { HouseProfit } from "@/hooks/dashboard/use-house-profit";
import { formatSignedCurrency } from "@/lib/format";

/**
 * Barras divergentes a partir de um eixo zero central: perda cresce pra
 * esquerda, ganho pra direita. Comparar casas vira comparar comprimento, sem
 * precisar ler os números um a um.
 */
export function HouseProfitBars({ rows }: { rows: HouseProfit[] }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.profit)), 1);

  if (rows.length === 0) {
    return <p className="text-[13px] text-zinc-400">Nenhum resultado por casa no período.</p>;
  }

  return (
    <ul className="h-full flex flex-col justify-center gap-7">
      {rows.map(({ house, profit }) => {
        const width = `${(Math.abs(profit) / max) * 50}%`;
        const positive = profit >= 0;
        return (
          <li key={house} className="grid grid-cols-[minmax(72px,1fr)_1fr_auto] items-center gap-3">
            <span className="text-[13px] text-zinc-200 truncate">{house}</span>
            <span className="relative h-2 rounded-full bg-white/[0.04]">
              {/* O zero fica no meio da faixa; a barra sai dele pros dois lados. */}
              <span className="absolute inset-y-[-3px] left-1/2 w-px bg-white/15" aria-hidden="true" />
              <span
                className="absolute top-0 h-2 rounded-full"
                style={{
                  width,
                  left: positive ? "50%" : undefined,
                  right: positive ? undefined : "50%",
                  background: positive ? "var(--color-positive)" : "var(--color-negative)",
                }}
              />
            </span>
            <span
              className={`text-[13px] tabular-nums font-medium ${positive ? "text-positive" : "text-negative"}`}
            >
              {formatSignedCurrency(profit)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
