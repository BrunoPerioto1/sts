import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Buildings,
  Check,
  ClipboardText,
  Pause,
  PaperPlaneTilt,
  Play,
  Receipt,
  Sparkle,
  SquaresFour,
  TelegramLogo,
  type Icon,
} from "@phosphor-icons/react";
import { LogoIcon } from "@/components/brand/LogoIcon";
import { GlowingBorder } from "@/components/ui/glowing-border";
import { cn } from "@/lib/utils";
import { at, reducedMotion } from "./motion";
import { useInView } from "./use-in-view";

/**
 * O app trabalhando, em três cenas que se repetem: print vira aposta, tip do
 * canal vira fila, placar vira resultado conferido. Sem gravação de vídeo: é
 * HTML com a cara do app, então fica nítido em qualquer tela e acompanha o
 * tema. A barra de progresso da cena é o relógio — quando a animação dela
 * acaba, passa pra próxima; pausar a barra pausa tudo.
 */

type SceneId = "print" | "tip" | "result";

// `short` é o rótulo no celular, onde três nomes inteiros não cabem lado a lado.
const SCENES: { id: SceneId; label: string; short: string; nav: string; ms: number }[] = [
  { id: "print", label: "Print do bilhete", short: "Print", nav: "Apostas", ms: 7200 },
  { id: "tip", label: "Tip do Telegram", short: "Tip", nav: "Tips", ms: 6400 },
  { id: "result", label: "Resultado conferido", short: "Resultado", nav: "Conferência", ms: 6400 },
];

const NAV: { label: string; icon: Icon; badge?: number }[] = [
  { label: "Dashboard", icon: SquaresFour },
  { label: "Apostas", icon: Receipt },
  { label: "Tips", icon: PaperPlaneTilt, badge: 1 },
  { label: "Conferência", icon: ClipboardText, badge: 2 },
  { label: "Casas", icon: Buildings },
];

// Espaço fixo entre "R$" e o número: a linha não quebra no meio do valor.
const LOG: Record<SceneId, { at: number; text: string }[]> = {
  print: [
    { at: 0, text: "Print colado com Ctrl+V" },
    { at: 1700, text: "Casa reconhecida pela logo: Betano" },
    { at: 2400, text: "Evento, mercado, odd e valor preenchidos" },
    { at: 3600, text: "Você conferiu os campos" },
    { at: 4700, text: "Aposta registrada: R$ 50,00 a 2,10" },
  ],
  tip: [
    { at: 0, text: "Mensagem nova no canal de tips" },
    { at: 1400, text: "Tip na fila: mais de 2.5 gols a 1,85" },
    { at: 2200, text: "Stake sugerida pela sua banca: R$ 50,00" },
    { at: 3400, text: "Planilhada: virou aposta pendente" },
  ],
  result: [
    { at: 0, text: "Jogo encerrado: Flamengo 2 x 1 Palmeiras" },
    { at: 1300, text: "Resultado proposto: ganha, +R$ 55,00" },
    { at: 2900, text: "Você confirmou" },
    { at: 3400, text: "Saldo da Betano: R$ 535,00" },
  ],
};

export function LandingWorkspace() {
  const [index, setIndex] = useState(0);
  // Com movimento reduzido nada troca sozinho: as cenas ficam nos botões.
  const [paused, setPaused] = useState(reducedMotion);
  // Fora da tela as cenas param onde estão (sem mexer no botão de pausa) e
  // continuam quando o visitante volta, em vez de rodar pra ninguém.
  const [ref, inView] = useInView<HTMLDivElement>({ initial: true });
  const scene = SCENES[index];

  return (
    <div ref={ref} className="relative rounded-2xl">
      <GlowingBorder spread={56} proximity={80} inactiveZone={0.5} />
      {/* Sombra escura, não brilho azul: profundidade sem cara de neon (DESIGN.md). */}
      <div
        className="overflow-hidden rounded-2xl border border-foreground/10 bg-[rgb(var(--rgb-surface))] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.7)]"
        data-paused={paused || !inView || undefined}
      >
        <div className="grid lg:grid-cols-[188px_minmax(0,1fr)_272px]">
          <Sidebar active={scene.nav} />
          {/* key: a cena remonta e as entradas com atraso recomeçam do zero. */}
          <div key={scene.id} className="min-h-[468px] p-4 sm:p-6">
            {scene.id === "print" ? <PrintScene /> : scene.id === "tip" ? <TipScene /> : <ResultScene />}
          </div>
          <Log key={`log-${scene.id}`} scene={scene.id} />
        </div>

        <div className="flex items-center gap-3 border-t border-foreground/[0.07] px-4 py-3 sm:px-6">
          <div className="grid flex-1 grid-cols-3 gap-3" role="group" aria-label="Cenas da demonstração">
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={i === index}
                onClick={() => setIndex(i)}
                // O pseudo-elemento estende o toque até 44px de altura sem mudar o visual.
                className={cn(
                  "group relative flex flex-col gap-2 text-left text-[13px] transition-colors after:absolute after:inset-x-0 after:-inset-y-2",
                  i === index ? "text-foreground" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <span className="relative h-[3px] overflow-hidden rounded-full bg-foreground/10">
                  {i < index && <span className="absolute inset-0 bg-foreground/30" />}
                  {i === index && (
                    <span
                      key={`${s.id}-${index}`}
                      className="ws-progress absolute inset-0 origin-left bg-accent-text"
                      style={{ "--dur": `${s.ms}ms` } as CSSProperties}
                      onAnimationEnd={() => setIndex((current) => (current + 1) % SCENES.length)}
                    />
                  )}
                </span>
                <span className="truncate">
                  <span className="sm:hidden">{s.short}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Continuar demonstração" : "Pausar demonstração"}
            className="relative flex h-8 w-8 flex-none items-center justify-center rounded-full border border-foreground/10 text-zinc-300 transition-colors after:absolute after:-inset-2 hover:bg-foreground/[0.07] hover:text-foreground"
          >
            {paused ? <Play size={14} weight="fill" /> : <Pause size={14} weight="fill" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ active }: { active: string }) {
  return (
    <aside className="hidden border-r border-foreground/[0.07] p-3 lg:block" aria-hidden>
      <div className="mb-5 flex items-center gap-2 px-1.5 pt-1">
        <LogoIcon className="h-6 w-6" />
        <span className="text-[13px] font-semibold">Trackton</span>
      </div>
      <ul className="space-y-0.5">
        {NAV.map(({ label, icon: IconComponent, badge }) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-300",
              label === active ? "bg-accent/[0.12] text-accent-text" : "text-zinc-400"
            )}
          >
            <IconComponent size={16} />
            <span className="flex-1">{label}</span>
            {badge && <span className="rounded-full bg-foreground/[0.08] px-1.5 text-[11px] tabular-nums text-zinc-300">{badge}</span>}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function Log({ scene }: { scene: SceneId }) {
  const lines = LOG[scene];
  return (
    <div className="hidden border-l border-foreground/[0.07] p-5 lg:block" aria-hidden>
      <p className="mb-4 text-[13px] font-medium text-zinc-400">O que aconteceu</p>
      <ol className="space-y-3.5">
        {lines.map((line, i) => (
          <li key={line.text} className="ws-in flex gap-2.5 text-[13px] leading-snug" style={at(line.at)}>
            <span
              className={cn(
                "mt-[3px] flex h-3.5 w-3.5 flex-none items-center justify-center rounded-full",
                i === lines.length - 1 ? "bg-success/20 text-success" : "bg-foreground/[0.08] text-zinc-400"
              )}
            >
              <Check size={9} weight="bold" />
            </span>
            <span className={i === lines.length - 1 ? "text-foreground" : "text-zinc-400"}>{line.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ——— peças com a cara do app ——— */

function Field({ label, value, delay, ai = true, className }: { label: string; value: string; delay: number; ai?: boolean; className?: string }) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <span className="flex items-center gap-1.5 text-[12px] text-zinc-400">
        {label}
        {ai && (
          <span className="ws-in rounded bg-accent/15 px-1 text-[11px] font-semibold text-accent-text" style={at(delay)}>
            IA
          </span>
        )}
      </span>
      <span className="flex h-9 items-center overflow-hidden rounded-lg border border-foreground/10 bg-background/60 px-3 text-[13px]">
        <span className="ws-fill truncate" style={at(delay)}>
          {value}
        </span>
      </span>
    </div>
  );
}

/**
 * A tela do app dentro da cena. Sem caixa própria: a moldura já é o card, e
 * card dentro de card só soma borda. Uma linha separa da peça ao lado (em
 * cima no celular, à esquerda a partir de 640px).
 */
function Panel({ title, right, children, className }: { title: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("border-t border-foreground/[0.07] pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0", className)}>
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <p className="text-[14px] font-semibold">{title}</p>
        {right}
      </div>
      {children}
    </div>
  );
}

/** Linhas de lista separadas por divisória, sem caixa em volta de cada uma. */
const LIST = "divide-y divide-foreground/[0.07] [&>*]:py-3 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0";

/** Linha secundária, apagada: o que já estava na tela antes da cena. */
function QuietRow({ title, detail, right, status, tone = "success" }: { title: string; detail: string; right: string; status: string; tone?: "success" | "danger" }) {
  return (
    <div className="flex items-center justify-between gap-3 opacity-60">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium">{title}</p>
        <p className="truncate text-[12px] text-zinc-400">{detail}</p>
      </div>
      <div className="flex flex-none flex-col items-end gap-1">
        <span className="whitespace-nowrap text-[12px] tabular-nums text-zinc-300">{right}</span>
        <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", tone === "success" ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>{status}</span>
      </div>
    </div>
  );
}

function PrintScene() {
  return (
    <div className="grid gap-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-5">
      {/* O print: um bilhete genérico, sem imitar a tela de nenhuma casa. Só um
          tom acima da moldura, sem borda: a peça não é um card dentro do card. */}
      <div className="ws-in relative overflow-hidden rounded-xl bg-[rgb(var(--rgb-surface-2))] p-4 text-[12px]">
        <div className="flex items-center justify-between text-zinc-400">
          <span>Bilhete</span>
          <span>Betano</span>
        </div>
        <p className="mt-3 text-[14px] font-semibold">Flamengo x Palmeiras</p>
        <p className="text-zinc-400">Brasileirão, hoje 21:30</p>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-foreground/[0.05] px-2.5 py-2">
          <span>
            <span className="block text-zinc-400">Resultado final</span>
            <span className="font-medium">Flamengo</span>
          </span>
          <span className="text-[15px] font-semibold tabular-nums">2.10</span>
        </div>
        <dl className="mt-3 space-y-1.5 tabular-nums">
          <div className="flex justify-between">
            <dt className="text-zinc-400">Valor</dt>
            <dd>R$ 50,00</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-400">Retorno potencial</dt>
            <dd>R$ 105,00</dd>
          </div>
        </dl>
        <span
          className="ws-scan pointer-events-none absolute inset-x-0 top-[8%] h-px bg-accent-text shadow-[0_0_14px_3px_rgb(var(--rgb-accent-text)/0.6)]"
          style={at(300)}
        />
      </div>

      <Panel
        title="Nova aposta"
        right={
          <span className="ws-in inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success" style={at(1700)}>
            <Sparkle size={11} /> Lido pela IA
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
          <Field label="Evento" value="Flamengo x Palmeiras" delay={1900} className="col-span-2" />
          <Field label="Mercado" value="Resultado final: Flamengo" delay={2100} className="col-span-2" />
          <Field label="Casa" value="Betano" delay={1700} />
          <Field label="Odd" value="2,10" delay={2300} />
          <Field label="Valor" value="R$ 50,00" delay={2400} />
          <Field label="Esporte" value="Futebol" delay={2200} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="ws-in flex items-center gap-1.5 text-[12px] text-success" style={at(4700)}>
            <Check size={13} weight="bold" /> Registrada
          </span>
          <span className="ws-press inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-white" style={at(4300)}>
            <Check size={13} weight="bold" /> Registrar aposta
          </span>
        </div>
      </Panel>
    </div>
  );
}

function TipScene() {
  return (
    <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-5">
      <div className="ws-in self-start rounded-xl bg-[rgb(var(--rgb-surface-2))] p-3.5 text-[13px]" style={at(150)}>
        <div className="mb-2.5 flex items-center gap-2 text-zinc-400">
          <TelegramLogo size={16} className="text-accent-text" weight="fill" />
          Canal de tips
        </div>
        <div className="rounded-lg rounded-tl-sm bg-foreground/[0.06] px-3 py-2.5 leading-relaxed">
          <p className="font-semibold">Corinthians x São Paulo</p>
          <p>Mais de 2.5 gols</p>
          <p className="text-zinc-400">Odd 1.85, 1 unidade</p>
        </div>
        <p className="mt-1.5 text-right text-[11px] text-zinc-400">19:02</p>
      </div>

      <Panel title="Tips" right={<span className="text-[12px] text-zinc-400">pendentes</span>}>
        <div className={LIST}>
          <div className="ws-in" style={at(1400)}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">Corinthians x São Paulo</p>
                <p className="truncate text-[12px] text-zinc-400">Mais de 2.5 gols</p>
              </div>
              <span className="text-[14px] font-semibold tabular-nums">1,85</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-[12px]">
              <span className="ws-in whitespace-nowrap tabular-nums text-zinc-300" style={at(2200)}>
                R$ 50,00 <span className="text-zinc-400">1% da banca</span>
              </span>
              <span className="relative inline-flex h-6 items-center">
                <span className="ws-out rounded-md bg-pending/15 px-2 py-0.5 font-medium text-pending" style={at(3400)}>
                  Pendente
                </span>
                <span className="ws-in absolute right-0 whitespace-nowrap rounded-md bg-success/15 px-2 py-0.5 font-medium text-success" style={at(3500)}>
                  Planilhada
                </span>
              </span>
            </div>
            <div className="mt-3 flex justify-end">
              <span className="ws-press inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-white" style={at(3000)}>
                Planilhar
              </span>
            </div>
          </div>
          {/* Uma tip de antes, já resolvida: a fila não começa vazia. */}
          <QuietRow title="Bahia x Grêmio" detail="Bahia vence" right="1,72" status="Planilhada" />
        </div>
      </Panel>
    </div>
  );
}

function ResultScene() {
  return (
    <div className="grid gap-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-5">
      <div className="ws-in self-start rounded-xl bg-[rgb(var(--rgb-surface-2))] p-4" style={at(150)}>
        <div className="flex items-center justify-between text-[12px] text-zinc-400">
          <span>Brasileirão</span>
          <span className="rounded bg-foreground/[0.07] px-1.5 py-0.5">Encerrado</span>
        </div>
        <div className="mt-4 space-y-2 text-[13px]">
          <p className="flex items-center justify-between">
            Flamengo <span className="landing-display text-[22px] tabular-nums">2</span>
          </p>
          <p className="flex items-center justify-between text-zinc-400">
            Palmeiras <span className="landing-display text-[22px] tabular-nums">1</span>
          </p>
        </div>
      </div>

      <Panel title="Conferência" right={<span className="text-[12px] text-zinc-400">2 propostas</span>}>
        <div className={LIST}>
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">Flamengo x Palmeiras</p>
                <p className="truncate text-[12px] text-zinc-400">Resultado final: Flamengo, Betano</p>
              </div>
              <span className="whitespace-nowrap text-[12px] tabular-nums text-zinc-300">R$ 50,00 a 2,10</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="ws-in inline-flex items-center gap-1.5 rounded-md bg-success/15 px-2 py-0.5 text-[12px] font-medium text-success" style={at(1300)}>
                Ganha <span className="tabular-nums">+R$ 55,00</span>
              </span>
              <span className="ws-press inline-flex rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-white" style={at(2700)}>
                Confirmar
              </span>
            </div>
          </div>
          <QuietRow title="Corinthians x São Paulo" detail="Mais de 2.5 gols, Bet365" right="R$ 50,00 a 1,85" status="Perdida" tone="danger" />
          {/* O efeito da confirmação: o saldo da casa muda na hora. */}
          <div className="ws-in flex items-center justify-between" style={at(3300)}>
            <span className="text-[13px] text-zinc-300">Saldo da Betano</span>
            <span className="flex items-baseline gap-2 tabular-nums">
              <span className="text-[12px] text-zinc-400 line-through">R$ 480,00</span>
              <span className="text-[15px] font-semibold">R$ 535,00</span>
            </span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
