import { LANDING_STATS } from "./landing-stats";

/**
 * Três números com contexto, logo depois do topo. Os valores aparecem prontos:
 * a contagem a partir do zero deixava "0 segundos" na tela de quem rolava
 * rápido. Os números moram em landing-stats.ts.
 */
export function LandingStats() {
  const items = [
    { value: LANDING_STATS.printToBetSeconds, unit: "segundos", text: "do print no Telegram até a aposta registrada." },
    { value: "Zero", unit: "fórmulas", text: "o resultado vem pelo placar, e lucro e ROI se calculam sozinhos." },
    {
      // "+50 mil": o "mais de" vai no número, que é o que se lê primeiro.
      value: `+${LANDING_STATS.betsThousands}`,
      unit: "mil",
      text: `apostas registradas por ${LANDING_STATS.users} apostadores.`,
    },
  ];

  return (
    <div className="grid gap-10 md:grid-cols-3 md:gap-8">
      {items.map(({ value, unit, text }) => (
        <div key={unit}>
          <span aria-hidden className="block h-0.5 w-8 rounded-full bg-accent" />
          {/* Menor que o título do topo, que é quem manda na abertura. No md, 26px: "Zero fórmulas" passava da coluna de ~210px a 30px. */}
          <p className="landing-display mt-4 whitespace-nowrap text-[34px] md:text-[26px] lg:text-[34px] xl:text-[38px]">
            <span className="tabular-nums">{value}</span> {unit}
          </p>
          <p className="mt-2 max-w-[30ch] text-[15px] leading-relaxed text-zinc-400">{text}</p>
        </div>
      ))}
    </div>
  );
}
