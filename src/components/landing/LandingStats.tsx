import { useState } from "react";
import { LANDING_STATS } from "./landing-stats";
import { at, reducedMotion } from "./motion";
import { useInView } from "./use-in-view";
import { useTween } from "./use-tween";

/**
 * Três números com contexto, logo depois do topo. Quando o bloco entra na tela, cada número conta até o valor (o "0" desce de
 * 12) e as descrições aparecem logo depois. Os valores moram em landing-stats.ts.
 */
export function LandingStats() {
  const [reduced] = useState(reducedMotion);
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: "0px 0px -15% 0px", once: true });
  const on = inView || reduced;

  const seconds = useTween(on ? LANDING_STATS.printToBetSeconds : 0, reduced);
  const formulas = useTween(on ? 0 : 12, reduced);
  const bets = useTween(on ? LANDING_STATS.betsThousands : 0, reduced);

  const items = [
    {
      value: seconds,
      final: LANDING_STATS.printToBetSeconds,
      unit: "segundos",
      text: "do print no Telegram até a aposta registrada.",
    },
    { value: formulas, final: 0, unit: "fórmulas", text: "o resultado vem pelo placar, e lucro e ROI se calculam sozinhos." },
    {
      value: bets,
      final: LANDING_STATS.betsThousands,
      unit: "mil",
      text: `apostas já registradas por mais de ${LANDING_STATS.users} apostadores.`,
    },
  ];

  return (
    <div ref={ref} data-paused={!inView || undefined}>
      <div className="grid gap-10 md:grid-cols-3 md:gap-8">
        {items.map(({ value, final, unit, text }, i) => (
          <div key={unit}>
            <span aria-hidden className="block h-0.5 w-8 rounded-full bg-accent" />
            {/* O leitor de tela ouve o valor final, não a contagem. */}
            {/* Menor que o título do topo, que é quem manda na abertura; cabe na coluna até no md. */}
            <p className="landing-display mt-4 whitespace-nowrap text-[34px] md:text-[30px] lg:text-[34px] xl:text-[38px]" aria-label={`${final} ${unit}`}>
              <span aria-hidden className="tabular-nums">
                {Math.round(value)}
              </span>
              <span aria-hidden> {unit}</span>
            </p>
            <p className="ws-in mt-2 max-w-[30ch] text-[15px] leading-relaxed text-zinc-400" style={at(700 + i * 80)}>
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
