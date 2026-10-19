import type { CSSProperties } from "react";
import { Check } from "@phosphor-icons/react";
import { useInView } from "./use-in-view";

/**
 * Lado direito do fechamento: o app numa cena só. Na frente, a conferência de
 * um jogo encerrado; atrás, o saldo de cada casa. Quando aparece, o
 * "Confirmar" é apertado e o saldo da Betano muda na hora (480 vira 535) — a
 * promessa da página num gesto. Toca uma vez, com as classes .ws-* da área de
 * trabalho; com movimento reduzido, já nasce no fim.
 */

const at = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

const HOUSES = [
  { name: "Bet365", value: "R$ 210,00" },
  { name: "Superbet", value: "R$ 98,40" },
];

export function ClosingArt() {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: "0px 0px -15% 0px", once: true });

  return (
    <div
      ref={ref}
      data-paused={!inView || undefined}
      aria-hidden
      className="grain step-bg-3 relative min-h-[380px] overflow-hidden border-t border-foreground/[0.08] p-6 sm:min-h-[420px] sm:p-10 lg:border-l lg:border-t-0"
    >
      {/* Atrás: o saldo de cada casa. */}
      <div className="relative w-[82%] max-w-[360px] rounded-xl border border-foreground/10 bg-background/90 text-[13px] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-foreground/[0.08] px-4 py-3">
          <span className="font-semibold">Saldo por casa</span>
          <span className="rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[11px] text-zinc-400">hoje</span>
        </div>
        <div className="relative flex items-center justify-between px-4 py-3">
          {/* A linha da Betano acende quando o saldo muda. */}
          <span className="ws-in absolute inset-0 bg-accent/[0.08]" style={at(1900)} />
          <span className="relative">Betano</span>
          <span className="relative inline-grid justify-items-end tabular-nums">
            <span className="ws-out col-start-1 row-start-1 text-zinc-300" style={at(1800)}>
              R$ 480,00
            </span>
            <span className="ws-in col-start-1 row-start-1 font-semibold" style={at(1900)}>
              R$ 535,00
            </span>
          </span>
        </div>
        {HOUSES.map((house) => (
          <div key={house.name} className="flex items-center justify-between border-t border-foreground/[0.06] px-4 py-3">
            <span className="text-zinc-300">{house.name}</span>
            <span className="tabular-nums text-zinc-300">{house.value}</span>
          </div>
        ))}
      </div>

      {/* Na frente: a proposta do placar, por cima do saldo. */}
      <div
        className="ws-in absolute bottom-6 right-6 w-[74%] max-w-[330px] rounded-xl border border-foreground/10 bg-background/95 p-4 text-[13px] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.85)] sm:bottom-10 sm:right-10"
        style={at(300)}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold">Conferência</span>
          <span className="rounded bg-foreground/[0.07] px-1.5 py-0.5 text-[11px] text-zinc-400">Encerrado 2 × 1</span>
        </div>
        <p className="mt-3 font-medium">Flamengo x Palmeiras</p>
        <p className="text-[12px] text-zinc-400">Resultado final: Flamengo, Betano</p>
        <div className="mt-3.5 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-success/15 px-2 py-0.5 text-[12px] font-medium text-success">
            Ganha <span className="tabular-nums">+R$ 55,00</span>
          </span>
          <span className="ws-press inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-white" style={at(1300)}>
            <Check size={12} weight="bold" /> Confirmar
          </span>
        </div>
      </div>
    </div>
  );
}
