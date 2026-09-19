import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, CheckCircle, MinusCircle, X, XCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SettlementSuggestion } from "@/api/routes/get-settlement";
import { ResultIdEnum } from "@/api/routes/result-id";
import { lucroSugerido } from "@/lib/settlement-view";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";

interface Props {
  suggestion: SettlementSuggestion | null;
  checked: boolean;
  busy: boolean;
  onClose: () => void;
  onToggle: () => void;
  onDismiss: () => void;
}

// Múltipla chega como "sel A / sel B" e a explicação como "parte 1; parte 2" —
// quebrar em itens é o que a linha truncada não consegue mostrar.
const itens = (texto: string, sep: string) =>
  texto.split(sep).map((t) => t.trim()).filter(Boolean);

const VISUAL = {
  [ResultIdEnum.WON]: { rotulo: "Ganhou", acao: "Marcar ganhou", cor: "text-emerald-400", caixa: "border-emerald-500/25 bg-emerald-500/[0.07]", Icone: CheckCircle },
  [ResultIdEnum.LOST]: { rotulo: "Perdeu", acao: "Marcar perdeu", cor: "text-red-400", caixa: "border-red-500/25 bg-red-500/[0.07]", Icone: XCircle },
} as const;
const ANULADA = { rotulo: "Anulada", acao: "Marcar anulada", cor: "text-zinc-300", caixa: "border-white/10 bg-white/[0.04]", Icone: MinusCircle };

function Conteudo({ suggestion: s, checked, busy, onToggle, onDismiss, onClose }: Props & { suggestion: SettlementSuggestion }) {
  const v = VISUAL[s.suggestedResultId as keyof typeof VISUAL] ?? ANULADA;
  const lucro = lucroSugerido(s);
  const [casa, fora] = s.game.split(/\s+x\s+/i);
  const temPlacar = s.homeScore != null && s.awayScore != null;
  return (
    <div className="space-y-5 pb-4">
      <p className="text-sm text-zinc-500">
        {s.eventStartAt && `${formatDate(s.eventStartAt)} · ${formatTime(s.eventStartAt)} · `}
        {formatCurrency(s.stake)} @ {s.odd.toFixed(2)}
      </p>

      <div className={`flex items-end justify-between rounded-xl border px-4 py-3.5 ${v.caixa}`}>
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-wider text-zinc-500">Proposta do bot</p>
          <p className={`text-2xl font-medium ${v.cor}`}>{v.rotulo}</p>
        </div>
        <div className="text-right">
          <p className="mb-1 text-[11px] uppercase tracking-wider text-zinc-500">Lucro</p>
          <p className={`text-xl tabular-nums ${v.cor}`}>
            {lucro > 0 ? "+" : ""}{formatCurrency(lucro)}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] uppercase tracking-wider text-zinc-500">Placar final</p>
        <p className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold tabular-nums text-white">
            {temPlacar ? `${s.homeScore}×${s.awayScore}` : "—"}
          </span>
          {casa && fora && <span className="text-sm text-zinc-500">{casa} · {fora}</span>}
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] uppercase tracking-wider text-zinc-500">Seleção</p>
        <ul className="space-y-1.5">
          {itens(s.market, " / ").map((m, i) => (
            <li key={i} className="rounded-lg bg-white/[0.04] px-3 py-2.5 text-sm text-zinc-200">
              {m}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">Como o bot decidiu</p>
        <ul className="space-y-2 text-sm text-zinc-300">
          {itens(s.explanation, ";").map((e, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <v.Icone weight="fill" size={18} className={`mt-px shrink-0 ${v.cor}`} />
              {e}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-2 pt-1">
        <Button variant="outline" className="h-12 px-6" disabled={busy} onClick={() => { onDismiss(); onClose(); }}>
          Descartar
        </Button>
        <Button className="h-12 bg-blue-600 text-white hover:bg-blue-500" onClick={() => { onToggle(); onClose(); }}>
          {!checked && <Check size={18} />}
          {checked ? "Desmarcar" : v.acao}
        </Button>
      </div>
    </div>
  );
}

export function SuggestionDetail(props: Props) {
  const isMobile = useIsMobile();
  const { suggestion, onClose } = props;
  if (!suggestion) return null;
  const onOpenChange = (o: boolean) => !o && onClose();

  if (isMobile) {
    return (
      <BottomSheet
        open
        onOpenChange={onOpenChange}
        title={<span className="block max-w-[240px] truncate">{suggestion.game}</span>}
      >
        <Conteudo {...props} suggestion={suggestion} />
      </BottomSheet>
    );
  }

  return (
    <DialogPrimitive.Root open onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-white/10 bg-zinc-950 p-6 animate-in slide-in-from-right duration-200">
          <div className="mb-3 flex items-start justify-between gap-3">
            <DialogPrimitive.Title className="text-lg font-semibold text-white">
              {suggestion.game}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200">
              <X size={18} />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">Detalhe da proposta</DialogPrimitive.Description>
          <Conteudo {...props} suggestion={suggestion} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
