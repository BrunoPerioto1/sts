import type { CSSProperties } from "react";
import {
  Buildings,
  ChartLineUp,
  ClipboardText,
  FileCsv,
  Image as ImageIcon,
  Keyboard,
  Microphone,
  TelegramLogo,
  type Icon,
} from "@phosphor-icons/react";
import { useInView } from "./use-in-view";

/**
 * O produto num desenho: as quatro portas de entrada da aposta descem por
 * trilhos até o SportsBet, e dele saem o que o app acompanha sozinho. Pulsos
 * azuis correm pelos trilhos (entrada, depois saída), em loop; fora da tela
 * param, e com movimento reduzido somem e fica o desenho parado.
 *
 * No desktop é um SVG de 1000x300 com as peças em HTML por cima, nas mesmas
 * coordenadas em %. No celular vira uma pilha: entradas, trilho, app, saídas.
 */

type Node = { icon: Icon; label: string; y: number };

const INPUTS: Node[] = [
  { icon: ImageIcon, label: "Print do bilhete", y: 45 },
  { icon: TelegramLogo, label: "Mensagem no Telegram", y: 115 },
  { icon: Microphone, label: "Áudio no Telegram", y: 185 },
  { icon: Keyboard, label: "Digitando", y: 255 },
];

const OUTPUTS: Node[] = [
  { icon: ClipboardText, label: "Resultado pelo placar", y: 45 },
  { icon: Buildings, label: "Saldo de cada casa", y: 115 },
  { icon: ChartLineUp, label: "Lucro, ROI e acerto", y: 185 },
  { icon: FileCsv, label: "Planilha pro Excel", y: 255 },
];

const HUB_Y = 150;
// Ponta dos trilhos: as peças encostam aqui (25% e 75% da largura).
const IN_X = 250;
const OUT_X = 750;

const inPath = (y: number) => `M${IN_X} ${y} H330 C390 ${y}, 390 ${HUB_Y}, 450 ${HUB_Y} H464`;
const outPath = (y: number) => `M536 ${HUB_Y} H550 C610 ${HUB_Y}, 610 ${y}, 670 ${y} H${OUT_X}`;

// Um pulso por trilho, em fila: as entradas chegam, e as saídas partem depois.
const PULSE_MS = 2800;
const delay = (ms: number) => ({ "--d": `${ms}ms`, "--dur": `${PULSE_MS}ms` }) as CSSProperties;

// `stacked`: no celular a coluna tem metade da tela, então o rótulo pode quebrar.
function Chip({ icon: IconComponent, label, stacked = false }: { icon: Icon; label: string; stacked?: boolean }) {
  return (
    <span className={`flex items-center gap-2 rounded-xl ${stacked ? "h-full text-left" : "whitespace-nowrap"} border border-foreground/10 bg-[rgb(var(--rgb-surface))] px-3 py-2 text-[13px] text-zinc-200 shadow-card`}>
      <IconComponent size={16} className="flex-none text-accent-text" />
      {label}
    </span>
  );
}

function Hub({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-accent text-white shadow-[0_14px_34px_-8px_rgba(0,0,0,0.75),0_0_0_6px_rgb(var(--rgb-bg))] ${className}`}
      aria-label="SportsBet"
    >
      <ChartLineUp size={32} weight="bold" />
    </span>
  );
}

export function EntryDiagram() {
  const [ref, inView] = useInView<HTMLDivElement>({ initial: true });

  return (
    <div ref={ref} data-paused={!inView || undefined}>
      {/* Desktop: trilhos em SVG, peças em HTML nas mesmas coordenadas. */}
      <div className="relative mx-auto hidden aspect-[1000/300] w-full max-w-[1000px] md:block" aria-hidden>
        <svg viewBox="0 0 1000 300" className="absolute inset-0 h-full w-full" fill="none">
          {[...INPUTS.map((n) => inPath(n.y)), ...OUTPUTS.map((n) => outPath(n.y))].map((d) => (
            <path key={d} d={d} className="flow-track" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          ))}
          {INPUTS.map((n, i) => (
            <path key={`p-${n.y}`} d={inPath(n.y)} pathLength={100} className="flow-pulse" strokeWidth={2} style={delay(i * 700)} vectorEffect="non-scaling-stroke" />
          ))}
          {OUTPUTS.map((n, i) => (
            <path key={`q-${n.y}`} d={outPath(n.y)} pathLength={100} className="flow-pulse" strokeWidth={2} style={delay(i * 700 + 1400)} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>

        <p className="absolute -top-2 text-right text-[13px] text-zinc-400" style={{ right: "75%" }}>
          Registre do seu jeito
        </p>
        <p className="absolute -top-2 text-[13px] text-zinc-400" style={{ left: "75%" }}>
          O app acompanha
        </p>

        {INPUTS.map((n) => (
          <div key={n.label} className="absolute -translate-y-1/2" style={{ right: "75%", top: `${(n.y / 300) * 100}%` }}>
            <Chip {...n} />
          </div>
        ))}
        {OUTPUTS.map((n) => (
          <div key={n.label} className="absolute -translate-y-1/2" style={{ left: "75%", top: `${(n.y / 300) * 100}%` }}>
            <Chip {...n} />
          </div>
        ))}
        <Hub className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Celular: a mesma ideia de cima pra baixo. */}
      <div className="flex flex-col items-center md:hidden" aria-hidden>
        <p className="text-[13px] text-zinc-400">Registre do seu jeito</p>
        <div className="mt-3 grid w-full grid-cols-2 gap-2">
          {INPUTS.map((n) => (
            <Chip key={n.label} {...n} stacked />
          ))}
        </div>
        <span className="flow-drop relative my-3 h-12 w-px overflow-hidden bg-foreground/15" style={delay(0)} />
        <Hub />
        <span className="flow-drop relative my-3 h-12 w-px overflow-hidden bg-foreground/15" style={delay(900)} />
        <p className="text-[13px] text-zinc-400">O app acompanha</p>
        <div className="mt-3 grid w-full grid-cols-2 gap-2">
          {OUTPUTS.map((n) => (
            <Chip key={n.label} {...n} stacked />
          ))}
        </div>
      </div>
    </div>
  );
}
