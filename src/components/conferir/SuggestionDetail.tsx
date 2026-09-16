import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SettlementSuggestion } from "@/api/routes/get-settlement";
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

function Conteudo({ suggestion: s, checked, busy, onToggle, onDismiss, onClose }: Props & { suggestion: SettlementSuggestion }) {
  const placar =
    s.homeScore != null && s.awayScore != null ? `${s.homeScore}x${s.awayScore}` : "—";
  return (
    <div className="space-y-4 pb-4">
      <p className="text-sm text-zinc-500">
        {s.eventStartAt && `${formatDate(s.eventStartAt)} · ${formatTime(s.eventStartAt)} · `}
        {formatCurrency(s.stake)} @ {s.odd.toFixed(2)}
      </p>

      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Placar</p>
        <p className="text-2xl font-semibold tabular-nums">{placar}</p>
      </div>

      <div>
        <p className="mb-1.5 text-xs uppercase tracking-wide text-zinc-500">Seleções</p>
        <ul className="space-y-1.5">
          {itens(s.market, " / ").map((m, i) => (
            <li key={i} className="rounded-md bg-white/[0.04] px-2.5 py-2 text-sm text-zinc-200">
              {m}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-1.5 text-xs uppercase tracking-wide text-zinc-500">Como o bot decidiu</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-400">
          {itens(s.explanation, ";").map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button variant="outline" disabled={busy} onClick={() => { onDismiss(); onClose(); }}>
          Descartar
        </Button>
        <Button className="bg-accent text-white" onClick={() => { onToggle(); onClose(); }}>
          {checked ? "Desmarcar" : "Marcar"}
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
