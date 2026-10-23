import type { ReactNode } from "react";
import { Check, CheckCircle, MinusCircle, XCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { DetailOverlay, DetailPanel, type FrameProps } from "./detail-frame";
import { Selecoes } from "./Selecoes";
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

// A explicação chega como "parte 1; parte 2": quebrar em itens é o que a linha
// truncada não consegue mostrar.
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
      <Selecoes market={s.market} />
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

export const proposalFrame = (p: DetailProps, tabIndex?: number): FrameProps => ({
  rotulo: "Proposta",
  posicao: p.posicao,
  total: p.total,
  titulo: p.suggestion.game,
  subtitulo: quandoDe(p.suggestion),
  onPrev: p.onPrev,
  onNext: p.onNext,
  corpo: <Corpo s={p.suggestion} />,
  acoes: <Acoes {...p} tabIndex={tabIndex} />,
  nota: "Ao confirmar, abre a próxima proposta.",
});

/** Proposta no painel do desktop. `preview`: a amostra inerte do convite do Pro. */
export function ProposalPanel({ preview = false, className, ...props }: DetailProps & { preview?: boolean; className?: string }) {
  return <DetailPanel {...proposalFrame(props, preview ? -1 : undefined)} preview={preview} className={className} />;
}

/** Proposta por cima da lista: sheet no celular, gaveta lateral no resto. */
export function SuggestionDetail({ onClose, ...props }: DetailProps & { onClose: () => void }) {
  return <DetailOverlay {...proposalFrame(props)} onClose={onClose} />;
}
