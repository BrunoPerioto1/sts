import type { ReactNode } from "react";
import {
  ArrowSquareOut,
  ArrowCounterClockwise,
  Calculator,
  Info,
  Check,
  Clock,
  Warning,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { formatMoney, formatKickoff, formatTime, formatOdd, formatPercent, houseDisplayName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TIP_TIMING_TONE_CLASS, tipTiming } from "@/lib/tip-schedule";
import type { TipItem } from "@/api/routes/get-tips";

// % da banca sugerido, nao retorno: sem sinal e sem verde, que liam como EV.
function bankrollShare(value: number) {
  return `${formatPercent(value / 100, { decimals: 2 })} da banca`;
}

// Apostei / Caiu / Mensagem: três iguais, com rótulo — ícone solto (a lupa)
// não dizia o que fazia.
const actionClass =
  "press flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-border text-[13px] font-medium text-zinc-200 transition-colors hover:bg-foreground/[0.06]";

// Um card por tip, com fôlego: o que decide a aposta (odd, jogo, mercado,
// horário) em cima, "Apostar" ocupando a linha toda, e os desfechos embaixo.
export function TipCard({
  tip,
  onDismiss,
  onUndismiss,
  onPlanilhar,
  onOpenMessage,
  onOpenCalc,
  leading,
  selecting = false,
}: {
  tip: TipItem;
  onDismiss: () => void;
  onUndismiss: () => void;
  onPlanilhar: () => void;
  onOpenMessage: () => void;
  /** Abre o "Odd mudou?" do app; ausente quando o link não traz a odd justa. */
  onOpenCalc?: () => void;
  /** Antes da linha "Recebida" — o checkbox, no modo de seleção. */
  leading?: ReactNode;
  /** Modo de seleção: as ações do card somem — competiam com as do lote, e o
   *  card inteiro vira o alvo do toque. */
  selecting?: boolean;
}) {
  const pending = tip.status === "pending";
  const timing = pending ? tipTiming(tip.eventStartAt) : null;

  // Sem odd justa no link não dá pra fazer a conta aqui: cai pra calculadora
  // externa do canal, como antes.
  const calcButton =
    pending && (onOpenCalc || tip.calcLink) ? (
      onOpenCalc ? (
        <button type="button" onClick={onOpenCalc} className={calcPillClass}>
          <Calculator size={14} weight="bold" /> Odd mudou?
        </button>
      ) : (
        <a href={tip.calcLink!} target="_blank" rel="noopener noreferrer" className={calcPillClass}>
          <Calculator size={14} weight="bold" /> Odd mudou?
        </a>
      )
    ) : null;

  return (
    <article className="space-y-4 p-4">
      <div className="flex items-start gap-3.5">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="flex items-center gap-2 text-xs text-zinc-500">
            {leading}
            <span className="min-w-0 truncate">
              {tip.house && `${houseDisplayName(tip.house)} · `}recebida {formatTime(tip.createdAt)}
            </span>
          </p>
          <h3 className="text-[17px] font-semibold leading-tight text-foreground">
            {tip.game ?? "Jogo não identificado"}
          </h3>
          {tip.market && <p className="text-sm leading-snug text-zinc-400">{tip.market}</p>}
        </div>

        {(tip.odd !== null || tip.percent !== null) && (
          <div className="shrink-0 text-right">
            {tip.odd !== null && (
              <p className="text-[28px] font-semibold leading-none tabular-nums">{formatOdd(tip.odd, { decimals: 2 })}</p>
            )}
            {tip.percent !== null && (
              <p className="mt-1.5 text-xs tabular-nums text-zinc-500">{bankrollShare(tip.percent)}</p>
            )}
          </div>
        )}
      </div>

      {/* Hora do jogo, não da tip: é ela que diz se ainda dá tempo de entrar.
          Só aparece quando o confronto casou com o cache de eventos — data
          chutada aqui seria pior que nenhuma. Na fila pendente, o relativo
          (quanto falta / há quanto começou) vem ao lado, na cor de urgência. */}
      {(tip.eventStartAt || pending) && (
        <div className="flex items-center gap-2">
          {tip.eventStartAt ? (
            <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-foreground/[0.06] px-2.5 text-xs font-medium tabular-nums text-zinc-200">
              <Clock size={13} weight="bold" className="text-zinc-400" />
              {formatKickoff(tip.eventStartAt)}
            </span>
          ) : (
            <span className={cn("inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-foreground/[0.04] px-2.5 text-xs", TIP_TIMING_TONE_CLASS.unknown)}>
              <Clock size={13} weight="bold" />
              Sem horário
            </span>
          )}
          {timing && tip.eventStartAt && (
            <span
              className={cn(
                "min-w-0 truncate text-xs font-medium tabular-nums",
                timing.tone === "upcoming" ? "text-zinc-400" : TIP_TIMING_TONE_CLASS[timing.tone],
              )}
            >
              {timing.headline.replace(/^Começa /, "").replace(/^Começou /, "")}
            </span>
          )}
          {calcButton && !selecting && <div className="ml-auto shrink-0">{calcButton}</div>}
        </div>
      )}

      {tip.isAviso && (
        <p className="flex items-center gap-1.5 text-xs text-warning">
          <Warning size={14} weight="fill" /> SOBRECARGA — confira a odd na casa antes de apostar
        </p>
      )}

      {!selecting && (
      <div className="space-y-2">
        <Button
          asChild={!!tip.link}
          disabled={!tip.link}
          size="lg"
          // min-w-0: sem isso o rótulo longo ("Apostar R$ 1.000,00") impede o
          // botão de encolher e estoura a largura do card no mobile.
          className="h-12 w-full min-w-0 truncate"
        >
          {tip.link ? (
            // noreferrer junto do _blank: sem ele a aba da casa recebe
            // window.opener e pode navegar esta de volta.
            <a href={tip.link} target="_blank" rel="noopener noreferrer">
              <ArrowSquareOut size={17} weight="bold" />
              {tip.recommendedStake !== null ? `Apostar ${formatMoney(tip.recommendedStake)}` : "Abrir na casa"}
            </a>
          ) : (
            <span>Sem link da casa</span>
          )}
        </Button>

        <div className={cn("grid gap-2", tip.status === "planilhada" ? "grid-cols-1" : tip.status === "caiu" ? "grid-cols-2" : "grid-cols-3")}>
          {pending && (
            <>
              <button type="button" onClick={onPlanilhar} className={actionClass}>
                <Check size={15} weight="bold" /> Apostei
              </button>
              {/* Caiu é um dos dois desfechos de toda tip, não uma ação
                  secundária — escondê-lo num menu custava dois toques na
                  metade dos casos. */}
              <button type="button" onClick={onDismiss} className={cn(actionClass, "text-danger hover:bg-danger/10")}>
                <X size={15} weight="bold" /> Caiu
              </button>
            </>
          )}
          {tip.status === "caiu" && (
            <button type="button" onClick={onUndismiss} className={actionClass}>
              <ArrowCounterClockwise size={15} weight="bold" /> Devolver
            </button>
          )}
          <button type="button" onClick={onOpenMessage} className={actionClass}>
            <Info size={15} weight="bold" /> Info
          </button>
        </div>
      </div>
      )}

      {tip.status !== "pending" && (
        <p className={cn("text-xs", tip.status === "planilhada" ? "text-success" : "text-zinc-500")}>
          {tip.status === "planilhada" ? "Planilhada" : "Marcada como caiu"}
        </p>
      )}

    </article>
  );
}

const calcPillClass =
  "press inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-[12.5px] font-medium text-zinc-300 transition-colors hover:bg-foreground/[0.06]";
