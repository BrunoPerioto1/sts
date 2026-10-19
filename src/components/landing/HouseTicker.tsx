import { useState } from "react";
import { Pause, Play } from "@phosphor-icons/react";
import { useInView } from "./use-in-view";

// Só o nome, em texto: logo de casa aqui pareceria parceria, e não é.
const HOUSES = [
  "Bet365",
  "Betano",
  "Superbet",
  "Betfair",
  "Sportingbet",
  "Betnacional",
  "Esportes da Sorte",
  "KTO",
  "Novibet",
  "Pixbet",
  "Stake",
  "Estrelabet",
  "BetMGM",
  "Vaidebet",
  "F12.bet",
  "Multibet",
  "Br4bet",
  "Betsson",
  "Aposta Ganha",
  "Galera.bet",
];

/**
 * Faixa que anda sozinha, então precisa de pausa que não dependa do mouse
 * (WCAG 2.2.2): o botão pausa no toque e no teclado. Fora da tela ela para
 * por conta própria. Com movimento reduzido vira uma lista quebrada em linhas
 * (landing.css) e o botão some.
 */
export function HouseTicker() {
  const [paused, setPaused] = useState(false);
  const [ref, inView] = useInView<HTMLDivElement>({ initial: true });

  return (
    <div className="flex items-center gap-3">
      <div ref={ref} className="landing-marquee min-w-0 flex-1 overflow-hidden" data-paused={paused || !inView || undefined}>
        <div className="landing-marquee-track flex w-max">
          {/* Duas cópias: a animação anda meia faixa e recomeça sem emenda. */}
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1 || undefined}>
              {HOUSES.map((name) => (
                <li key={name} className="whitespace-nowrap px-5 text-[15px] font-medium text-zinc-400">
                  {name}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Continuar a faixa de casas" : "Pausar a faixa de casas"}
        className="relative flex h-8 w-8 flex-none items-center justify-center rounded-full border border-foreground/10 text-zinc-300 transition-colors after:absolute after:-inset-2 hover:bg-foreground/[0.07] hover:text-foreground motion-reduce:hidden"
      >
        {paused ? <Play size={14} weight="fill" /> : <Pause size={14} weight="fill" />}
      </button>
    </div>
  );
}
