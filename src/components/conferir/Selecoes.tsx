import { selecoesDe } from "@/lib/settlement-view";
import { cn } from "@/lib/utils";

/**
 * Seleções da aposta no detalhe das duas abas. Mercado simples é uma linha;
 * múltipla e criar aposta viram uma lista numerada, com o tipo no título
 * ("3 seleções · Criar aposta"), em vez do texto todo espremido à direita.
 */
export function Selecoes({ market, className }: { market: string; className?: string }) {
  const { rotulo, itens } = selecoesDe(market);
  const varias = itens.length > 1;
  return (
    <div className={className}>
      <p className="mb-2 flex items-baseline justify-between gap-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        <span>{varias ? `${itens.length} seleções` : "Seleção"}</span>
        {rotulo && <span className="normal-case tracking-normal text-zinc-400">{rotulo}</span>}
      </p>
      <ol className="divide-y divide-foreground/[0.07] overflow-hidden rounded-xl border border-foreground/10 text-[13.5px]">
        {itens.map((m, i) => (
          <li key={i} className={cn("flex items-start gap-3 px-4 text-foreground", varias ? "py-3" : "py-2.5")}>
            {varias && (
              <span className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-foreground/[0.07] text-[11px] font-semibold tabular-nums text-zinc-400">
                {i + 1}
              </span>
            )}
            <span className="min-w-0 leading-snug">{m}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
