import { useState } from "react";
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
 * Faixa que anda sozinha. Sem botão de pausa (pedido do dono): para com o
 * mouse em cima (landing.css) e com um toque na própria faixa, e fora da tela
 * para por conta própria. Com movimento reduzido vira uma lista quebrada em
 * linhas, parada.
 */
export function HouseTicker() {
  const [paused, setPaused] = useState(false);
  const [ref, inView] = useInView<HTMLDivElement>({ initial: true });

  return (
    <div
      ref={ref}
      className="landing-marquee min-w-0 overflow-hidden"
      data-paused={paused || !inView || undefined}
      onClick={() => setPaused((p) => !p)}
    >
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
  );
}
