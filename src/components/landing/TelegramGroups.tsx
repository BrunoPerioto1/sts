import { useState, type CSSProperties, type ReactNode } from "react";
import { Check, Cursor } from "@phosphor-icons/react";
import { LogoIcon } from "@/components/brand/LogoIcon";
import { houseColor, houseInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { at } from "./motion";
import { useInView } from "./use-in-view";

/**
 * Peças da seção Grupos do Telegram: a demo do caminho de uma tip (grupo →
 * bot no privado → planilha) e a lista "Seus grupos". Nomes de grupo são
 * inventados; jogos são reais, como na área de trabalho do topo.
 */

// Uma volta da demo, já com a pausa do fim. Os tempos abaixo são o roteiro.
const LOOP_MS = 11000;
const T = {
  typing: 300,
  message: 1200,
  marks: { sport: 2000, market: 2400, odd: 2800, stake: 3200 },
  bot: 4000,
  botLines: 4200,
  button: 5050,
  cursor: 5400,
  press: 6300,
  done: 6550,
  row: 7100,
};

// O formato que o bot já usa pra mostrar aposta (bet-preview.util.ts no backend).
const BOT_LINES = ["🆚 Corinthians x São Paulo", "⚽️ Futebol", "📌 Mais de 2.5 gols", "🏷 1.85", "💰 Stake: R$ 50,00"];

/** Avatar redondo de grupo, com as iniciais e a cor por nome que o app usa nas casas. */
function GroupAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("flex flex-none items-center justify-center rounded-full font-semibold text-white", className)}
      style={{ background: houseColor(name) }}
    >
      {houseInitials(name)}
    </span>
  );
}

/** Uma etapa da demo. Linha separa da vizinha: em cima no celular, à esquerda no desktop. */
function Pane({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border-t border-foreground/[0.07] p-4 first:border-t-0 sm:p-5 lg:border-l lg:border-t-0 lg:first:border-l-0">
      <p className="mb-3.5 flex items-center gap-2 text-[12px] font-medium text-zinc-400">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/[0.08] text-[11px] tabular-nums text-zinc-300">
          {step}
        </span>
        {title}
      </p>
      {children}
    </div>
  );
}

/** Trecho que o sistema reconheceu: ganha fundo e um rótulo em cima, na vez dele. */
function Mark({ tag, delay, children }: { tag: string; delay: number; children: ReactNode }) {
  return (
    <span className="relative inline-block">
      <span className="lp-mark px-0.5" style={at(delay)}>
        {children}
      </span>
      <span
        className="ws-in absolute bottom-full left-0 mb-1 whitespace-nowrap rounded bg-accent px-1 text-[10px] font-semibold leading-[14px] text-white"
        style={at(delay)}
      >
        {tag}
      </span>
    </span>
  );
}

const STATUS = {
  pending: "bg-pending/15 text-pending",
  won: "bg-success/15 text-success",
  lost: "bg-danger/15 text-danger",
};

// Coluna de stake no sm/md (etapas empilhadas, largura de sobra) e do xl pra
// cima. No celular e no lg, em que cada etapa é estreita, ela sai pra o nome do
// jogo caber inteiro; a stake continua no card do bot, ao lado.
const SHEET_GRID =
  "grid grid-cols-[minmax(0,1fr)_32px_66px] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_36px_64px_70px] lg:grid-cols-[minmax(0,1fr)_36px_70px] xl:grid-cols-[minmax(0,1fr)_36px_64px_70px]";
const STAKE_CELL = "hidden text-right tabular-nums sm:block lg:hidden xl:block";

function SheetRow({ game, detail, odd, stake, status, label }: { game: string; detail: string; odd: string; stake: string; status: keyof typeof STATUS; label: string }) {
  return (
    <>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">{game}</span>
        <span className="block truncate text-[11px] text-zinc-400">{detail}</span>
      </span>
      <span className="text-right tabular-nums">{odd}</span>
      <span className={STAKE_CELL}>{stake}</span>
      <span className={cn("justify-self-end rounded-md px-1.5 py-0.5 text-[11px] font-medium", STATUS[status])}>{label}</span>
    </>
  );
}

/**
 * A tip do grupo virando aposta, em loop: a mensagem chega, o sistema marca
 * esporte, mercado, odd e stake, o bot manda organizada no privado, o cursor
 * clica em Planilhar e a linha entra na planilha. O relógio (.lp-clock) é que
 * recomeça a volta; fora da tela, tudo para onde está.
 */
export function GroupsDemo() {
  const [cycle, setCycle] = useState(0);
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: "0px 0px -15% 0px" });

  return (
    <div
      ref={ref}
      data-paused={!inView || undefined}
      role="img"
      aria-label="Demonstração: uma tip chega no grupo, o bot manda organizada no privado e um clique em Planilhar põe a aposta na planilha."
      className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-[rgb(var(--rgb-surface))] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.7)]"
    >
      <span
        key={`clock-${cycle}`}
        aria-hidden
        className="lp-clock pointer-events-none absolute h-0 w-0"
        style={{ "--dur": `${LOOP_MS}ms` } as CSSProperties}
        onAnimationEnd={() => setCycle((c) => c + 1)}
      />
      {/* key: a volta remonta e as entradas com atraso recomeçam do zero. */}
      {/* A planilha leva uma fatia maior: é a etapa com mais colunas. */}
      <div key={cycle} className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)]">
        <Pane step={1} title="No grupo">
          <div className="rounded-xl bg-[rgb(var(--rgb-surface-2))] p-3.5">
            <div className="flex items-center gap-2.5">
              <GroupAvatar name="Rodada de Tips" className="h-8 w-8 text-[11px]" />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">Rodada de Tips</span>
                <span className="block text-[11px] text-zinc-400">grupo de tips</span>
              </span>
            </div>
            <div className="relative mt-3">
              <div
                className="lp-typing absolute left-0 top-0 inline-flex items-center gap-2 rounded-2xl rounded-tl-sm bg-foreground/[0.06] px-3 py-2 text-[12px] text-zinc-400"
                style={{ ...at(T.typing), "--len": `${T.message - T.typing}ms` } as CSSProperties}
              >
                Admin está digitando
                <span className="flex gap-0.5">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="lp-dot h-1 w-1 rounded-full bg-zinc-400" style={at(d)} />
                  ))}
                </span>
              </div>
              <div className="ws-in rounded-2xl rounded-tl-sm bg-foreground/[0.06] px-3 pb-2 pt-2 text-[13px] leading-snug" style={at(T.message)}>
                <p className="text-[12px] font-semibold" style={{ color: "#f0a35e" }}>
                  Admin
                </p>
                {/* Respiro de 18px entre as linhas: é onde os rótulos aparecem. */}
                <div className="space-y-[18px] pt-[18px]">
                  <p>
                    <Mark tag="esporte" delay={T.marks.sport}>
                      ⚽ Futebol
                    </Mark>{" "}
                    <span className="text-zinc-400">· Brasileirão</span>
                  </p>
                  <p className="font-semibold">Corinthians x São Paulo</p>
                  <p>
                    <Mark tag="mercado" delay={T.marks.market}>
                      Mais de 2.5 gols
                    </Mark>{" "}
                    @{" "}
                    <Mark tag="odd" delay={T.marks.odd}>
                      1.85
                    </Mark>
                  </p>
                  <p>
                    Stake:{" "}
                    <Mark tag="stake" delay={T.marks.stake}>
                      1 unidade
                    </Mark>
                  </p>
                </div>
                <p className="mt-1.5 text-right text-[11px] text-zinc-400">19:02</p>
              </div>
            </div>
          </div>
        </Pane>

        <Pane step={2} title="No seu privado">
          <div className="ws-in rounded-xl bg-[rgb(var(--rgb-surface-2))] p-3.5" style={at(T.bot)}>
            <div className="flex items-center gap-2.5">
              <LogoIcon shape="circle" className="h-8 w-8" />
              <span className="text-[13px] font-semibold">Trackton</span>
              <span className="rounded bg-foreground/[0.08] px-1.5 text-[11px] text-zinc-400">bot</span>
            </div>
            <div className="mt-3 rounded-2xl rounded-tl-sm bg-foreground/[0.06] px-3 py-2.5 text-[13px] leading-relaxed">
              <p className="ws-fill text-[12px] text-zinc-400" style={at(T.botLines)}>
                Tip nova em Rodada de Tips
              </p>
              {BOT_LINES.map((line, i) => (
                <p key={line} className="ws-fill truncate" style={at(T.botLines + 150 * (i + 1))}>
                  {line}
                </p>
              ))}
            </div>
            <div className="ws-in relative mt-2" style={at(T.button)}>
              <span
                className="ws-press relative flex h-9 items-center justify-center rounded-lg bg-foreground/[0.09] text-[13px] font-medium"
                style={at(T.press)}
              >
                <span className="ws-out" style={at(T.done)}>
                  Planilhar
                </span>
                <span className="ws-in absolute inset-0 flex items-center justify-center gap-1.5 text-success" style={at(T.done + 50)}>
                  <Check size={14} weight="bold" /> Planilhada
                </span>
              </span>
              <Cursor
                size={22}
                weight="fill"
                className="lp-cursor pointer-events-none absolute left-[54%] top-[42%] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
                style={at(T.cursor)}
              />
            </div>
          </div>
        </Pane>

        <Pane step={3} title="Na planilha">
          <div className="text-[12px]">
            <div className={cn(SHEET_GRID, "border-b border-foreground/[0.07] pb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400")}>
              <span>Jogo</span>
              <span className="text-right">Odd</span>
              <span className={STAKE_CELL}>Stake</span>
              <span className="text-right">Status</span>
            </div>
            <div className="divide-y divide-foreground/[0.07]">
              <div className="ws-in relative" style={at(T.row)}>
                <span aria-hidden className="lp-flash absolute -inset-x-2 inset-y-0 rounded-md" style={at(T.row)} />
                <div className={cn(SHEET_GRID, "relative py-2.5")}>
                  <SheetRow game="Corinthians x São Paulo" detail="Mais de 2.5 gols · Rodada de Tips" odd="1,85" stake="R$ 50,00" status="pending" label="Pendente" />
                </div>
              </div>
              <div className={cn(SHEET_GRID, "py-2.5 opacity-70")}>
                <SheetRow game="Bahia x Grêmio" detail="Bahia vence · Canal das Odds" odd="1,72" stake="R$ 50,00" status="won" label="Ganha" />
              </div>
              <div className={cn(SHEET_GRID, "py-2.5 opacity-70")}>
                <SheetRow game="Sinner x Alcaraz" detail="Sinner vence · Tênis Diário" odd="2,05" stake="R$ 25,00" status="lost" label="Perdida" />
              </div>
            </div>
          </div>
        </Pane>
      </div>
    </div>
  );
}

// `checkAt`: quando a caixa é marcada, em ms. Sem ele, o grupo fica de fora.
const GROUPS: { name: string; detail: string; checkAt?: number }[] = [
  { name: "Rodada de Tips", detail: "Futebol", checkAt: 500 },
  { name: "Canal das Odds", detail: "Vários esportes", checkAt: 950 },
  { name: "Grupo do Futebol", detail: "Futebol" },
  { name: "Tênis Diário", detail: "Tênis", checkAt: 1400 },
];

/** A escolha dos grupos: as caixas vão sendo marcadas uma vez, quando a lista aparece. */
export function GroupPicker() {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: "0px 0px -15% 0px", once: true });
  const chosen = GROUPS.filter((g) => g.checkAt != null).length;

  return (
    <div
      ref={ref}
      data-paused={!inView || undefined}
      role="img"
      aria-label={`Lista de grupos do Telegram com ${chosen} grupos escolhidos.`}
      className="rounded-2xl border border-foreground/10 bg-[rgb(var(--rgb-surface))] p-5"
    >
      <p className="text-[15px] font-semibold">Seus grupos</p>
      <p className="mt-1 text-[13px] text-zinc-400">Escolha de quais grupos as tips vêm.</p>
      <ul className="mt-3 divide-y divide-foreground/[0.07]">
        {GROUPS.map(({ name, detail, checkAt }) => (
          <li key={name} className="flex items-center gap-3 py-3">
            <GroupAvatar name={name} className="h-8 w-8 text-[11px]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium">{name}</span>
              <span className="block text-[12px] text-zinc-400">{detail}</span>
            </span>
            <span className="relative h-[18px] w-[18px] flex-none rounded-[5px] border border-foreground/25">
              {checkAt != null && (
                <span className="lp-check absolute -inset-px flex items-center justify-center rounded-[5px] bg-success text-white" style={at(checkAt)}>
                  <Check size={12} weight="bold" />
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="ws-in mt-2 flex items-center gap-2 text-[13px] text-zinc-400" style={at(1900)}>
        <Check size={15} weight="bold" className="flex-none text-accent-text" />
        {chosen} grupos escolhidos. Só esses são lidos.
      </p>
    </div>
  );
}
