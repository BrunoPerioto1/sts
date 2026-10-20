import { useState, type AnimationEvent, type CSSProperties } from "react";
import { ChartLineUp } from "@phosphor-icons/react";
import { formatMoney, signColor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { at, reducedMotion } from "./motion";
import { useInView } from "./use-in-view";
import { useTween } from "./use-tween";

/**
 * O mockup do topo, em cascata: o chat com o bot do Telegram em cima e o
 * resumo do mês embaixo, deslocado pro canto livre do chat. O fluxo é o do bot
 * de verdade (bet-preview.util.ts no backend): o print chega, ele lê, responde
 * "Aposta identificada!" com o cartão e só grava depois do toque em Planilhar.
 * Aí a linha da casa acende e o saldo disponível cai a stake, que fica em
 * aberto, como o app calcula. Dados de exemplo.
 */

// Uma volta (~6 s), já com a pausa do fim. Os tempos abaixo são o roteiro.
const LOOP_MS = 6000;
const T = { typing: 650, reply: 1650, lines: 1800, press: 3000, saved: 3250 };

const BET = { house: "Betano", game: "Flamengo x Palmeiras", market: "Ambas marcam", odd: "1.85", stake: 50 };

// Lucro no mês misturado (ganho e perda) e em tamanho normal: o resumo não vende número grande.
const HOUSES = [
  { name: "Betano", balance: 812, month: 96.4 },
  { name: "Bet365", balance: 540.2, month: -38.1 },
  { name: "Superbet", balance: 210, month: 22.5 },
];

// O mês de agora, pra o card nunca ficar com cara de antigo ("OUTUBRO").
const MONTH = new Date().toLocaleDateString("pt-BR", { month: "long", timeZone: "America/Sao_Paulo" }).toUpperCase();

/** O bilhete desenhado, dentro da bolha de quem mandou. Genérico: não imita a tela de nenhuma casa. */
function Ticket() {
  return (
    <div className="rounded-xl bg-background/80 p-2.5 text-[11px] leading-tight">
      <div className="flex items-center justify-between text-zinc-400">
        <span>Bilhete</span>
        <span className="font-semibold text-zinc-200">{BET.house}</span>
      </div>
      <p className="mt-1.5 text-[12px] font-semibold">{BET.game}</p>
      <div className="mt-1.5 flex items-center justify-between rounded-md bg-foreground/[0.06] px-2 py-1">
        <span className="text-zinc-300">{BET.market}</span>
        <span className="font-semibold tabular-nums">{BET.odd}</span>
      </div>
      <div className="mt-1.5 flex justify-between tabular-nums">
        <span className="text-zinc-400">Valor</span>
        <span>{formatMoney(BET.stake)}</span>
      </div>
    </div>
  );
}

export function HeroMockup() {
  const [reduced] = useState(reducedMotion);
  const [ref, inView] = useInView<HTMLDivElement>({ initial: true });
  const [cycle, setCycle] = useState(0);
  // A aposta já foi planilhada nesta volta. Sem movimento, a cena nasce no fim.
  const [saved, setSaved] = useState(reduced);

  // Descer até o saldo novo conta; voltar ao começo do loop é na hora.
  const betano = useTween(saved ? HOUSES[0].balance - BET.stake : HOUSES[0].balance, reduced || !saved, 700);

  const onPressEnd = (e: AnimationEvent<HTMLSpanElement>) => {
    if (e.target === e.currentTarget) setSaved(true);
  };

  return (
    <div
      ref={ref}
      data-paused={!inView || undefined}
      role="img"
      aria-label="Exemplo: um print de bilhete mandado pro bot do Telegram vira aposta planilhada, e o saldo da casa atualiza."
      className="relative isolate mx-auto w-full max-w-[360px] sm:w-[488px] sm:max-w-none sm:pb-[120px]"
    >
      {/* Brilho azul bem difuso atrás dos cards: só profundidade, sem neon (DESIGN.md). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 bg-[radial-gradient(closest-side,rgb(var(--rgb-accent)/0.2),transparent)] sm:-inset-24"
      />
      {!reduced && (
        <span
          key={`clock-${cycle}`}
          aria-hidden
          className="lp-clock pointer-events-none absolute h-0 w-0"
          style={{ "--dur": `${LOOP_MS}ms` } as CSSProperties}
          onAnimationEnd={() => {
            setSaved(false);
            setCycle((c) => c + 1);
          }}
        />
      )}

      <div className="rounded-2xl border border-foreground/10 bg-[rgb(var(--rgb-surface))] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)] sm:w-[320px]">
        <div className="flex items-center gap-2.5 border-b border-foreground/[0.07] px-3.5 py-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-accent bg-accent/[0.12]">
            <ChartLineUp size={14} className="text-accent-text" />
          </span>
          <span className="text-[13px] font-semibold">SportsBet Bot</span>
          <span className="ml-auto rounded bg-foreground/[0.08] px-1.5 text-[11px] text-zinc-400">bot</span>
        </div>

        {/* key: a volta remonta e as entradas com atraso recomeçam do zero. */}
        <div key={cycle} className="space-y-2 p-3">
          <div className="lp-slide ml-auto w-[188px] rounded-2xl rounded-br-sm bg-accent/[0.16] p-1.5">
            <Ticket />
            <p className="mt-1 pr-1 text-right text-[10px] text-zinc-400">21:04 ✓✓</p>
          </div>

          <div className="relative">
            <div
              className="lp-typing absolute left-0 top-0 inline-flex items-center gap-2 rounded-2xl rounded-bl-sm bg-foreground/[0.06] px-3 py-2 text-[12px] text-zinc-400"
              style={{ ...at(T.typing), "--len": `${T.reply - T.typing}ms` } as CSSProperties}
            >
              lendo bilhete
              <span className="flex gap-0.5">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="lp-dot h-1 w-1 rounded-full bg-zinc-400" style={at(d)} />
                ))}
              </span>
            </div>
            <div className="ws-in w-[222px]" style={at(T.reply)}>
              <div className="rounded-2xl rounded-bl-sm bg-foreground/[0.06] px-3 py-2 text-[12px] leading-snug">
                <p className="font-medium">✅ Aposta identificada!</p>
                <div className="mt-1 text-zinc-300">
                  {[
                    `🏠 ${BET.house}`,
                    `🆚 ${BET.game}`,
                    `📌 ${BET.market} · 🏷 ${BET.odd}`,
                    `💰 Stake: ${formatMoney(BET.stake)}`,
                  ].map((line, i) => (
                    <p key={line} className="ws-fill truncate" style={at(T.lines + 120 * i)}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
              {/* O botão do bot: o toque é que grava a aposta. */}
              <span
                className="ws-press relative mt-1.5 flex h-8 items-center justify-center rounded-lg bg-foreground/[0.08] text-[12px] font-medium"
                style={at(T.press)}
                onAnimationEnd={onPressEnd}
              >
                <span className="ws-out" style={at(T.saved)}>
                  📊 Planilhar
                </span>
                <span className="ws-in absolute inset-0 flex items-center justify-center text-success" style={at(T.saved + 50)}>
                  ✅ Aposta salva
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo: embaixo do chat no celular; do sm pra cima, encostado no canto inferior direito dele.
          Começa em 236px, logo depois da resposta do bot (222px + respiro): não cobre o botão. */}
      <div className="mt-3 rounded-2xl border border-foreground/10 bg-[rgb(var(--rgb-surface-2))] p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] sm:absolute sm:bottom-0 sm:left-[236px] sm:mt-0 sm:w-[252px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">{MONTH}</span>
          <span className="rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-400">dados de exemplo</span>
        </div>
        <p className="mt-1 text-[14px] font-semibold">Saldo por casa</p>
        <ul className="mt-2 divide-y divide-foreground/[0.07]">
          {HOUSES.map((house, i) => {
            const isBet = house.name === BET.house;
            return (
              <li key={house.name} className="relative flex items-start justify-between gap-3 py-2">
                {isBet && saved && !reduced && (
                  <span key={cycle} aria-hidden className="lp-flash absolute -inset-x-2 inset-y-0 rounded-md" />
                )}
                <span className="relative min-w-0">
                  <span className="block truncate text-[13px] font-medium">{house.name}</span>
                  <span className={cn("block text-[11px] tabular-nums", signColor(house.month))}>
                    {formatMoney(house.month, { signed: true })} no mês
                  </span>
                </span>
                <span className="relative text-right">
                  <span className="block text-[13px] tabular-nums">{formatMoney(i === 0 ? Math.round(betano * 100) / 100 : house.balance)}</span>
                  {isBet && saved && (
                    <span key={cycle} className="ws-in block text-[11px] tabular-nums text-zinc-400">
                      {formatMoney(BET.stake)} em aberto
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
