import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CaretDown, CaretLeft, CaretRight, CaretUp, Check, CheckCircle, MinusCircle, XCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SettlementSuggestion } from "@/api/routes/get-settlement";
import { ResultIdEnum } from "@/api/routes/result-id";
import { lucroSugerido } from "@/lib/settlement-view";
import { formatMoney, formatDate, formatTime, formatOdd } from "@/lib/format";
import { tintStyle, usePerformanceColor } from "@/hooks/use-performance-color";
import { cn } from "@/lib/utils";

export interface DetailProps {
  suggestion: SettlementSuggestion;
  /** Posição na lista filtrada (1-based) e o total dela: "Proposta 3 de 24". */
  posicao: number;
  total: number;
  onPrev?: () => void;
  onNext?: () => void;
  busy: boolean;
  /** Grava o resultado proposto (tem "Desfazer" no toast). */
  onConfirm: () => void;
  /** Recusa a proposta: a aposta segue pendente. */
  onReject: () => void;
}

// Múltipla chega como "sel A / sel B" e a explicação como "parte 1; parte 2" —
// quebrar em itens é o que a linha truncada não consegue mostrar.
const itens = (texto: string, sep: string) =>
  texto.split(sep).map((t) => t.trim()).filter(Boolean);

// sign escolhe a cor de ganho/perda de Preferências; anulada fica neutra.
const VISUAL = {
  [ResultIdEnum.WON]: { rotulo: "Ganhou", valor: "Lucro", sign: 1, Icone: CheckCircle },
  [ResultIdEnum.LOST]: { rotulo: "Perdeu", valor: "Prejuízo", sign: -1, Icone: XCircle },
} as const;
const ANULADA = { rotulo: "Anulada", valor: "Devolvido", sign: 0, Icone: MinusCircle };
const visualDe = (s: SettlementSuggestion) => VISUAL[s.suggestedResultId as keyof typeof VISUAL] ?? ANULADA;

const quandoDe = (s: SettlementSuggestion) =>
  s.eventStartAt ? `${formatDate(s.eventStartAt)} · ${formatTime(s.eventStartAt)}` : null;

const rotuloCls = "text-[11px] font-medium uppercase tracking-wider";

/** Placar grande, com o lado que perdeu apagado. Sem "A x B" no jogo, só o placar. */
function Placar({ s }: { s: SettlementSuggestion }) {
  const [casa, fora] = s.game.split(/\s+x\s+/i);
  const temPlacar = s.homeScore != null && s.awayScore != null;
  const tom = (meu: number | null, outro: number | null) =>
    meu != null && outro != null && meu < outro ? "text-zinc-400" : "text-foreground";
  return (
    <div className="rounded-xl border border-foreground/10 px-4 py-4">
      <p className={cn(rotuloCls, "mb-2.5 text-zinc-500")}>Placar final</p>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <span className={cn("line-clamp-2 break-words text-[15px] font-semibold leading-tight", tom(s.homeScore, s.awayScore))}>{fora ? casa : ""}</span>
        <span className="flex items-baseline gap-2 text-3xl font-semibold tabular-nums">
          {temPlacar ? (
            <>
              <span className={tom(s.homeScore, s.awayScore)}>{s.homeScore}</span>
              <span className="text-base text-zinc-600">×</span>
              <span className={tom(s.awayScore, s.homeScore)}>{s.awayScore}</span>
            </>
          ) : (
            <span className="text-zinc-500">—</span>
          )}
        </span>
        <span className={cn("line-clamp-2 break-words text-right text-[15px] leading-tight", tom(s.awayScore, s.homeScore))}>{fora ?? ""}</span>
      </div>
    </div>
  );
}

function Ficha({ s }: { s: SettlementSuggestion }) {
  const linhas: [string, ReactNode][] = [
    ["Seleção", itens(s.market, " / ").map((m, i) => <span key={i} className="block">{m}</span>)],
    ["Stake", formatMoney(s.stake)],
    ["Odd", formatOdd(s.odd)],
  ];
  return (
    <dl className="divide-y divide-foreground/[0.07] overflow-hidden rounded-xl border border-foreground/10 text-[13.5px]">
      {linhas.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-4 px-4 py-2.5">
          <dt className="shrink-0 text-zinc-500">{k}</dt>
          <dd className="min-w-0 text-right tabular-nums text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** "O bot propõe: Ganhou · Lucro +R$ 55,00", com o porquê embaixo. */
function Veredito({ s }: { s: SettlementSuggestion }) {
  const v = visualDe(s);
  const color = usePerformanceColor();
  const cor = v.sign ? color(v.sign) : "var(--color-text)";
  const lucro = lucroSugerido(s);
  return (
    <div
      className={cn("rounded-xl border px-4 py-3.5", !v.sign && "border-foreground/10 bg-foreground/[0.04]")}
      style={v.sign ? tintStyle(cor, 8, 30) : undefined}
    >
      <div className={cn(rotuloCls, "flex justify-between opacity-80")} style={{ color: v.sign ? cor : undefined }}>
        <span>O bot propõe</span>
        <span>{v.valor}</span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-3 text-2xl font-semibold tabular-nums" style={{ color: cor }}>
        <span>{v.rotulo}</span>
        <span>{v.sign ? `${lucro > 0 ? "+" : ""}${formatMoney(lucro)}` : formatMoney(s.stake)}</span>
      </div>
      {s.explanation && (
        <ul className="mt-3 space-y-1.5 border-t pt-3 text-[13.5px] text-zinc-200" style={{ borderColor: "inherit" }}>
          {itens(s.explanation, ";").map((e, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <v.Icone size={17} className="mt-px shrink-0" style={{ color: cor }} />
              {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Corpo({ s }: { s: SettlementSuggestion }) {
  return (
    <div className="space-y-4">
      <Placar s={s} />
      <Ficha s={s} />
      <Veredito s={s} />
    </div>
  );
}

function Acoes({ suggestion: s, busy, onConfirm, onReject, tabIndex }: DetailProps & { tabIndex?: number }) {
  return (
    <div className="grid grid-cols-[0.75fr_1.6fr] gap-2.5">
      <Button variant="secondary" className="h-12 rounded-xl" disabled={busy} onClick={onReject} tabIndex={tabIndex}>
        Recusar
      </Button>
      <Button className="h-12 rounded-xl font-semibold" disabled={busy} onClick={onConfirm} tabIndex={tabIndex}>
        <Check size={16} weight="bold" />
        Confirmar {visualDe(s).rotulo.toLowerCase()}
      </Button>
    </div>
  );
}

const navBtn = "press grid h-8 w-9 place-items-center text-zinc-400 transition-colors hover:text-foreground disabled:opacity-35";

/** Anterior/próxima. No desktop a lista é vertical (↑ ↓); no celular, ‹ ›. */
function Navegacao({ onPrev, onNext, vertical, tabIndex }: Pick<DetailProps, "onPrev" | "onNext"> & { vertical?: boolean; tabIndex?: number }) {
  const [Prev, Next] = vertical ? [CaretUp, CaretDown] : [CaretLeft, CaretRight];
  return (
    <div className="flex divide-x divide-foreground/10 overflow-hidden rounded-lg border border-foreground/10">
      <button type="button" className={navBtn} disabled={!onPrev} onClick={onPrev} aria-label="Proposta anterior" tabIndex={tabIndex}>
        <Prev size={14} />
      </button>
      <button type="button" className={navBtn} disabled={!onNext} onClick={onNext} aria-label="Próxima proposta" tabIndex={tabIndex}>
        <Next size={14} />
      </button>
    </div>
  );
}

/**
 * Painel do detalhe no desktop: fica ao lado da lista (xl) ou dentro da gaveta
 * lateral (md). `preview` é a amostra do convite do Pro — inteira, mas inerte.
 */
export function ProposalPanel({ preview = false, className, ...props }: DetailProps & { preview?: boolean; className?: string }) {
  const { suggestion: s, posicao, total } = props;
  const quando = quandoDe(s);
  const tabIndex = preview ? -1 : undefined;
  return (
    <div className={cn("flex flex-col rounded-2xl border border-foreground/10 bg-card shadow-card", className)} aria-hidden={preview || undefined}>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] tabular-nums text-zinc-500">Proposta {posicao} de {total}</p>
            <Navegacao vertical onPrev={props.onPrev} onNext={props.onNext} tabIndex={tabIndex} />
          </div>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">{s.game}</h2>
          {quando && <p className="mt-1 text-[13px] tabular-nums text-zinc-500">{quando}</p>}
        </div>
        <Corpo s={s} />
      </div>
      <div className="shrink-0 space-y-3 border-t border-foreground/[0.07] p-6 pt-5">
        <Acoes {...props} tabIndex={tabIndex} />
        {!preview && <p className="text-center text-xs text-zinc-500">Ao confirmar, abre a próxima proposta.</p>}
      </div>
    </div>
  );
}

/** Sem o painel ao lado (abaixo de xl): sheet no celular, gaveta lateral no resto. */
export function SuggestionDetail({ onClose, ...props }: DetailProps & { onClose: () => void }) {
  const isMobile = useIsMobile();
  const { suggestion: s, posicao, total } = props;
  const onOpenChange = (o: boolean) => !o && onClose();

  if (isMobile) {
    const quando = quandoDe(s);
    return (
      <BottomSheet
        open
        onOpenChange={onOpenChange}
        title={<span className="text-sm font-normal tabular-nums text-zinc-500">{posicao} de {total}</span>}
        action={<div className="mr-1"><Navegacao onPrev={props.onPrev} onNext={props.onNext} /></div>}
        footer={<Acoes {...props} />}
      >
        <div className="space-y-5 pb-4">
          <div>
            <p className="text-xl font-semibold tracking-tight text-foreground">{s.game}</p>
            {quando && <p className="mt-1 text-[13px] tabular-nums text-zinc-500">{quando}</p>}
          </div>
          <Corpo s={s} />
        </div>
      </BottomSheet>
    );
  }

  return (
    <DialogPrimitive.Root open onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-zinc-950 p-3 animate-in slide-in-from-right duration-200">
          <DialogPrimitive.Title className="sr-only">{s.game}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Detalhe da proposta</DialogPrimitive.Description>
          <ProposalPanel {...props} className="h-full" />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
