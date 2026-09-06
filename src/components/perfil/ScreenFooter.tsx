import { Button } from "@/components/ui/button";

interface ScreenFooterProps {
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
  disabled?: boolean;
  saveLabel?: string;
}

/**
 * Rodapé das telas de ajuste: fica na borda inferior, não flutuando por cima do
 * conteúdo. Salvar em azul cheio e Descartar como texto — desfazer é o caminho
 * secundário e não precisa do mesmo peso visual.
 */
export function ScreenFooter({ onSave, onDiscard, saving, disabled, saveLabel = "Salvar alterações" }: ScreenFooterProps) {
  return (
    <div
      className="sticky bottom-0 -mx-4 mt-6 px-4 pt-3 bg-background flex items-center gap-3"
      style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
    >
      <Button
        className="flex-1 min-h-[48px] bg-blue-600 text-white font-semibold hover:bg-blue-600/90"
        onClick={onSave}
        disabled={disabled || saving}
      >
        {saving ? "Salvando…" : saveLabel}
      </Button>
      <button type="button" onClick={onDiscard} className="px-4 py-3 text-sm text-zinc-400 hover:text-white">
        Descartar
      </button>
    </div>
  );
}
