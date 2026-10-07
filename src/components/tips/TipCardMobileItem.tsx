import { useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { tapHaptic } from "@/lib/haptics";
import { useLongPress } from "@/hooks/apostas/use-long-press";
import type { TipItem } from "@/api/routes/get-tips";
import { TipCard } from "./TipCard";

// Mesmo gesto da tela de Apostas (BetCardMobile): toque longo entra no modo de
// seleção já com esta tip marcada; dentro do modo, toque simples marca/desmarca.
// Fora dele não há checkbox — o "Selecionar" fixo em cada card era ruído na fila.
export function TipCardMobileItem({
  tip,
  canSelect,
  selectionMode,
  checked,
  onToggle,
  onPlanilhar,
  onDismiss,
  onUndismiss,
}: {
  tip: TipItem;
  canSelect: boolean;
  selectionMode: boolean;
  checked: boolean;
  onToggle: () => void;
  onPlanilhar: () => void;
  onDismiss: () => void;
  onUndismiss: () => void;
}) {
  // O click que o navegador solta ao fim do toque longo desmarcaria na hora a
  // tip que acabou de ser marcada.
  const ignoreNextClick = useRef(false);
  const longPress = useLongPress(() => {
    if (!canSelect || selectionMode) return;
    tapHaptic();
    ignoreNextClick.current = true;
    onToggle();
  });

  return (
    <div
      className={cn(
        "relative border-b border-border transition-colors last:border-b-0",
        // Mesmo tom da seleção no desktop.
        checked && "bg-accent/[0.1]",
        selectionMode && "press-sm cursor-pointer select-none",
      )}
      onClickCapture={(event) => {
        if (ignoreNextClick.current) {
          ignoreNextClick.current = false;
          event.stopPropagation();
          event.preventDefault();
          return;
        }
        // No modo de seleção o card inteiro é o alvo: os botões dele (Apostar,
        // Caiu) não disparam, o toque só marca/desmarca.
        if (selectionMode) {
          event.stopPropagation();
          event.preventDefault();
          onToggle();
        }
      }}
      {...(canSelect ? longPress : {})}
      // Nem todo navegador solta aquele click: um toque novo zera a trava,
      // senão o próximo toque de verdade seria engolido.
      onTouchStart={() => {
        ignoreNextClick.current = false;
        if (canSelect) longPress.onTouchStart();
      }}
    >
      <TipCard
        tip={tip}
        onPlanilhar={onPlanilhar}
        onDismiss={onDismiss}
        onUndismiss={onUndismiss}
        leading={
          selectionMode && (
            <Checkbox
              checked={checked}
              tabIndex={-1}
              aria-label={`Selecionar ${tip.game ?? "tip"} (${tip.id})`}
            />
          )
        }
      />
    </div>
  );
}
