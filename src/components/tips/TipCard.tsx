import { useState, type ReactNode } from "react";
import {
  ArrowSquareOut,
  ArrowCounterClockwise,
  Calculator,
  Check,
  Clock,
  MagnifyingGlass,
  Warning,
  XCircle,
} from "@phosphor-icons/react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { Button } from "@/components/ui/button";
import { formatMoney, formatKickoff, formatTime, formatOdd, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TIP_TIMING_TONE_CLASS, tipTiming } from "@/lib/tip-schedule";
import type { TipItem } from "@/api/routes/get-tips";
import { TipKickoffBadge } from "./TipKickoffBadge";

// % da banca sugerido, nao retorno: sem sinal e sem verde, que liam como EV.
function bankrollShare(value: number) {
  return `${formatPercent(value / 100, { decimals: 2 })} da banca`;
}

const squareButtonClass =
  "press flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-zinc-300 transition-colors hover:bg-foreground/[0.07] disabled:opacity-40";

const dangerButtonClass =
  "press flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-danger text-danger transition-colors hover:bg-danger/10";

// Uma linha da fila. Densa de propósito: o que decide a aposta (odd, EV,
// jogo, mercado) tem que caber sem rolar, e a ação principal é um alvo só.
export function TipCard({
  tip,
  onDismiss,
  onUndismiss,
  onPlanilhar,
  leading,
}: {
  tip: TipItem;
  onDismiss: () => void;
  onUndismiss: () => void;
  onPlanilhar: () => void;
  /** Antes da linha "Recebida" — o checkbox, no modo de seleção. */
  leading?: ReactNode;
}) {
  const [showMessage, setShowMessage] = useState(false);

  return (
    <article className="border-b border-border px-4 py-3.5 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs text-zinc-500">
            {leading}
            <span className="min-w-0 truncate">
              Recebida {formatTime(tip.createdAt)}
              {tip.house && ` · ${tip.house}`}
            </span>
          </p>
          <h3 className="mt-1 text-[17px] font-semibold leading-tight text-foreground">
            {tip.game ?? "Jogo não identificado"}
          </h3>
          {tip.market && <p className="mt-0.5 text-sm text-zinc-400">{tip.market}</p>}
          {/* Hora do jogo, não da tip: é ela que diz se ainda dá tempo de
              entrar. Só aparece quando o confronto casou com o cache de
              eventos — data chutada aqui seria pior que nenhuma. */}
          {/* O horário do jogo é o destaque (branco, semibold); na fila
              pendente o relativo (quanto falta / há quanto começou) vem ao
              lado, na cor de urgência — nunca número solto. */}
          {tip.eventStartAt ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
              <TipKickoffBadge label={formatKickoff(tip.eventStartAt)} />
              {tip.status === "pending" && (
                <span className={cn("min-w-0 truncate font-medium", tipTiming(tip.eventStartAt).tone === "upcoming" ? "text-zinc-400" : TIP_TIMING_TONE_CLASS[tipTiming(tip.eventStartAt).tone])}>
                  {tipTiming(tip.eventStartAt).headline}
                </span>
              )}
            </p>
          ) : (
            tip.status === "pending" && (
              <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                <Clock size={13} weight="bold" className="shrink-0" />
                <span className={cn("font-medium", TIP_TIMING_TONE_CLASS.unknown)}>Sem horário identificado</span>
              </p>
            )
          )}
        </div>

        <div className="shrink-0 text-right">
          {tip.odd !== null && (
            <div className="flex items-center justify-end gap-1.5">
              {/* A odd da tip envelhece: quando muda na casa, esse link do
                  canal recalcula quanto a aposta ainda vale. Fica colado na
                  odd, e não na linha de ações — lá o quarto botão quadrado
                  não cabia com o "Apostar R$ 1.000,00" no mobile. */}
              {tip.calcLink && (
                <a
                  href={tip.calcLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-foreground/[0.07] hover:text-zinc-300"
                  aria-label="Calcular quanto vale com a odd nova"
                  title="Odd mudou? Calcule quanto vale"
                >
                  <Calculator size={16} weight="bold" />
                </a>
              )}
              <p className="text-2xl font-semibold leading-none tabular-nums">{formatOdd(tip.odd)}</p>
            </div>
          )}
          {tip.percent !== null && (
            <p className="mt-1 text-xs font-medium tabular-nums text-zinc-400">
              {bankrollShare(tip.percent)}
            </p>
          )}
        </div>
      </div>

      {tip.isAviso && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-pending">
          <Warning size={14} weight="fill" /> SOBRECARGA — confira a odd na casa antes de apostar
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button
          asChild={!!tip.link}
          size="lg"
          disabled={!tip.link}
          // min-w-0: sem isso o rótulo longo ("Apostar R$ 1.000,00") impede o
          // botão de encolher e empurra o "..." pra fora da tela no mobile.
          className="h-11 min-w-0 flex-1 truncate border-transparent bg-accent text-white hover:bg-accent/90"
        >
          {tip.link ? (
            // noreferrer junto do _blank: sem ele a aba da casa recebe
            // window.opener e pode navegar esta de volta.
            <a href={tip.link} target="_blank" rel="noopener noreferrer">
              <ArrowSquareOut size={16} weight="bold" />
              {tip.recommendedStake !== null
                ? `Apostar  ${formatMoney(tip.recommendedStake)}`
                : "Abrir na casa"}
            </a>
          ) : (
            <span>Sem link da casa</span>
          )}
        </Button>

        {tip.status === "caiu" ? (
          <button type="button" onClick={onUndismiss} className={squareButtonClass} aria-label="Devolver para a fila">
            <ArrowCounterClockwise size={18} weight="bold" />
          </button>
        ) : (
          tip.status === "pending" && (
            <>
              <button type="button" onClick={onPlanilhar} className={squareButtonClass} aria-label="Planilhar">
                <Check size={18} weight="bold" />
              </button>
              {/* Caiu é um dos dois desfechos de toda tip, não uma ação
                  secundária — escondê-lo num menu custava dois toques na
                  metade dos casos. */}
              <button type="button" onClick={onDismiss} className={dangerButtonClass} aria-label="Marcar como caiu">
                <XCircle size={18} weight="bold" />
              </button>
            </>
          )
        )}


        {/* A mensagem crua do canal é consulta, não ação: um menu de um item
            só custava dois toques. A lupa abre direto o sheet com o texto. */}
        <button
          type="button"
          onClick={() => setShowMessage(true)}
          className={squareButtonClass}
          aria-label="Ver mensagem do canal"
        >
          <MagnifyingGlass size={18} weight="bold" />
        </button>
      </div>

      {/* Sheet em vez de expandir o card inline: o texto do canal é longo e
          empurrava as tips seguintes pra fora da tela no mobile. */}
      <BottomSheet open={showMessage} onOpenChange={setShowMessage} title="Mensagem do canal">
        <pre className="whitespace-pre-wrap break-words pb-4 text-sm leading-relaxed text-zinc-300">
          {tip.text}
        </pre>
      </BottomSheet>

      {tip.status !== "pending" && (
        <p className={cn("mt-2 text-xs", tip.status === "planilhada" ? "text-success" : "text-zinc-500")}>
          {tip.status === "planilhada" ? "Planilhada" : "Marcada como caiu"}
        </p>
      )}
    </article>
  );
}
