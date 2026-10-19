import type { ComponentType, CSSProperties, ReactNode } from "react";
import { Check, Eye, Image as ImageIcon, Microphone, Sparkle, TelegramLogo, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { useInView } from "./use-in-view";

/**
 * Os três passos de toda aposta, um card cada: em cima, uma tela do app sobre
 * um fundo noturno; embaixo, rótulo, título e o que acontece. A tela de cada
 * card toca a cena uma vez quando ele aparece (as classes .ws-* da área de
 * trabalho, que ficam paradas enquanto o card está fora da tela).
 */

const at = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function Art({ variant, children }: { variant: 1 | 2 | 3; children: ReactNode }) {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: "0px 0px -20% 0px", once: true });
  return (
    <div
      ref={ref}
      data-paused={!inView || undefined}
      className={cn(
        "step-art relative flex aspect-[37/40] items-center overflow-hidden rounded-[22px] border border-foreground/[0.07] p-5 transition-transform duration-300 motion-safe:group-hover:-translate-y-1 sm:p-6",
        `step-bg-${variant}`,
      )}
    >
      <div className="relative w-full">{children}</div>
    </div>
  );
}

/** Painel escuro por cima da arte: a tela do app. */
function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-foreground/10 bg-background/90 p-4 text-[12px] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-sm", className)}>
      {children}
    </div>
  );
}

function PrintArt() {
  return (
    <Art variant={1}>
      <Screen className="relative overflow-hidden">
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
        <div className="mt-3 flex justify-between tabular-nums">
          <span className="text-zinc-400">Valor</span>
          <span>R$ 50,00</span>
        </div>
        <span
          className="ws-scan pointer-events-none absolute inset-x-0 top-[8%] h-px bg-accent-text shadow-[0_0_14px_3px_rgb(var(--rgb-accent-text)/0.6)]"
          style={at(400)}
        />
      </Screen>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[
          { icon: ImageIcon, label: "Print" },
          { icon: TelegramLogo, label: "Mensagem" },
          { icon: Microphone, label: "Áudio" },
        ].map(({ icon: IconComponent, label }, i) => (
          <span
            key={label}
            className="ws-in inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-background/80 px-2.5 py-1 text-[11px] text-zinc-300"
            style={at(1800 + i * 160)}
          >
            <IconComponent size={12} className="text-accent-text" /> {label}
          </span>
        ))}
      </div>
    </Art>
  );
}

function Field({ label, value, delay, doubt }: { label: string; value: string; delay: number; doubt?: boolean }) {
  return (
    <div className="space-y-1">
      <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
        {label}
        <span
          className={cn(
            "ws-in rounded px-1 text-[10px] font-semibold",
            doubt ? "bg-warning/15 text-warning" : "bg-accent/15 text-accent-text",
          )}
          style={at(delay)}
        >
          {doubt ? "Confira" : "IA"}
        </span>
      </span>
      <span
        className={cn(
          "flex h-8 items-center rounded-lg border bg-background/60 px-2.5 text-[12px]",
          doubt ? "border-warning/50" : "border-foreground/10",
        )}
      >
        <span className="ws-fill truncate" style={at(delay)}>
          {value}
        </span>
      </span>
    </div>
  );
}

function CheckArt() {
  return (
    <Art variant={2}>
      <Screen>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-semibold">Nova aposta</p>
          <span className="ws-in inline-flex items-center gap-1 rounded-md bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success" style={at(300)}>
            <Sparkle size={10} /> Lido pela IA
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-2.5">
          <div className="col-span-2">
            <Field label="Evento" value="Flamengo x Palmeiras" delay={500} />
          </div>
          <Field label="Odd" value="2,10" delay={800} doubt />
          <Field label="Valor" value="R$ 50,00" delay={1000} />
        </div>
        <p className="ws-in mt-3 text-[11px] leading-snug text-warning" style={at(1500)}>
          A odd ficou meio cortada no print: confira antes de salvar.
        </p>
      </Screen>
    </Art>
  );
}

function TimelineRow({ title, detail, time, delay, last }: { title: string; detail?: ReactNode; time: string; delay: number; last?: boolean }) {
  return (
    <div className="ws-in" style={at(delay)}>
      <Screen className={cn("p-3", last && "border-accent/30")}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-medium">{title}</p>
          <span className="rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] tabular-nums text-zinc-400">{time}</span>
        </div>
        {detail}
      </Screen>
    </div>
  );
}

function RegisterArt() {
  return (
    <Art variant={3}>
      <div className="space-y-0">
        <TimelineRow title="Aposta registrada" time="21:30" delay={200} />
        <span className="mx-auto block h-4 w-px border-l border-dashed border-foreground/25" />
        <TimelineRow title="Jogo encerrado: 2 × 1" time="23:24" delay={900} />
        <span className="mx-auto block h-4 w-px border-l border-dashed border-foreground/25" />
        <TimelineRow
          title="Resultado proposto"
          time="23:25"
          delay={1600}
          last
          detail={
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                Ganha <span className="tabular-nums">+R$ 55,00</span>
              </span>
              <span className="ws-press inline-flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-[11px] font-medium text-white" style={at(2400)}>
                <Check size={11} weight="bold" /> Confirmar
              </span>
            </div>
          }
        />
      </div>
    </Art>
  );
}

const STEPS: { icon: Icon; label: string; title: string; text: string; art: ComponentType }[] = [
  {
    icon: ImageIcon,
    label: "Passo 1",
    title: "Mande a aposta do seu jeito",
    text: "Print, mensagem ou áudio no Telegram, ou digitando. A IA lê evento, mercado, odd, valor e casa.",
    art: PrintArt,
  },
  {
    icon: Eye,
    label: "Passo 2",
    title: "Você confere o que a IA leu",
    text: "Cada campo lido vem marcado, e o que ela leu com dúvida aparece em destaque pra você corrigir.",
    art: CheckArt,
  },
  {
    icon: Check,
    label: "Passo 3",
    title: "O app registra e acompanha",
    text: "A aposta só é salva com o seu clique. Quando o jogo acaba, o placar propõe o resultado e você confirma.",
    art: RegisterArt,
  },
];

export function StepCards() {
  return (
    <div className="grid gap-10 md:grid-cols-3 md:gap-6">
      {STEPS.map(({ icon: IconComponent, label, title, text, art: ArtComponent }, i) => (
        <Reveal key={title} delay={i * 120}>
          <article className="group">
            <ArtComponent />
            <p className="mt-5 flex items-center gap-2 text-[13px] text-zinc-400">
              <IconComponent size={15} className="text-accent-text" />
              {label}
            </p>
            <h3 className="mt-2 text-[18px] font-semibold tracking-tight">{title}</h3>
            <p className="mt-2 max-w-[40ch] text-[15px] leading-relaxed text-zinc-400">{text}</p>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
