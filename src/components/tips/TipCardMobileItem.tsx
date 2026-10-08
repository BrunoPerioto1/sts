import { useRef, useState } from "react";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { tapHaptic } from "@/lib/haptics";
import { parseFairOdd } from "@/lib/odd-calc";
import { useLongPress } from "@/hooks/apostas/use-long-press";
import type { TipItem } from "@/api/routes/get-tips";
import { TipCard } from "./TipCard";
import { TipMessageSheet } from "./TipMessageSheet";
import { TipOddCalcSheet } from "./TipOddCalcSheet";

/** Valores que o "Odd mudou?" leva pro planilhar (stake e odd de agora). */
export type TipPlanilharInitial = { stake: number | null; odd: number };

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
  onPlanilhar: (initial?: TipPlanilharInitial) => void;
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

  const [sheet, setSheet] = useState<"message" | "calc" | null>(null);
  const fair = parseFairOdd(tip.calcLink);
  const canCalc = tip.status === "pending" && fair !== null;

  return (
    <>
      <div
        className={cn(
          "relative rounded-2xl border border-border bg-card transition-colors",
          // Accent, não verde: verde na tela já quer dizer lucro.
          checked && "border-accent bg-accent/[0.08]",
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
          onPlanilhar={() => onPlanilhar()}
          onDismiss={onDismiss}
          onUndismiss={onUndismiss}
          onOpenMessage={() => setSheet("message")}
          onOpenCalc={canCalc ? () => setSheet("calc") : undefined}
          selecting={selectionMode}
          leading={
            selectionMode && (
              <span
                role="checkbox"
                aria-checked={checked}
                aria-label={`Selecionar ${tip.game ?? "tip"} (${tip.id})`}
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  checked ? "border-accent bg-accent text-white" : "border-foreground/25",
                )}
              >
                {checked && <Check size={12} weight="bold" />}
              </span>
            )
          }
        />
      </div>

      {/* Fora do invólucro de propósito: evento de dentro de um portal sobe
          pela árvore do React, e um toque longo num campo do sheet entraria no
          modo de seleção (que depois engoliria os cliques). */}
      <TipMessageSheet
        tip={tip}
        fair={fair}
        open={sheet === "message"}
        onOpenChange={(o) => !o && setSheet(null)}
        onOpenCalc={canCalc ? () => setSheet("calc") : undefined}
      />
      {/* Monta só aberto: o campo de odd nasce da tip a cada abertura. */}
      {canCalc && sheet === "calc" && (
        <TipOddCalcSheet
          tip={tip}
          fair={fair!}
          open
          onOpenChange={(o) => !o && setSheet(null)}
          onApostei={(initial) => {
            setSheet(null);
            onPlanilhar(initial);
          }}
          onDismiss={() => {
            setSheet(null);
            onDismiss();
          }}
        />
      )}
    </>
  );
}
