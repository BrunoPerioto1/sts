import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApostaForm } from "./ApostaForm";
import { MobileApostaFormSheet } from "./MobileApostaFormSheet";
import { type BetItem } from "@/api/routes/get-bets";
import { useIsMobile } from "@/hooks/use-mobile";

interface ApostaFormModalProps {
  onApostaAdded: (aposta: BetItem) => void;
  open: boolean;
  onClose: () => void;
  /** Print colado na lista de Apostas, antes do modal existir. */
  pendingImage?: File | null;
  onPendingImageConsumed?: () => void;
}

export function ApostaFormModal({ onApostaAdded, open, onClose, pendingImage, onPendingImageConsumed }: ApostaFormModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileApostaFormSheet
        open={open}
        onClose={onClose}
        onApostaAdded={onApostaAdded}
        pendingImage={pendingImage}
        onPendingImageConsumed={onPendingImageConsumed}
      />
    );
  }

  const handleApostaAdded = (aposta: BetItem) => {
    onApostaAdded(aposta);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="mb-1">
          <DialogTitle className="text-xl">Nova aposta</DialogTitle>
        </DialogHeader>
        <ApostaForm
          onApostaAdded={handleApostaAdded}
          pendingImage={pendingImage}
          onPendingImageConsumed={onPendingImageConsumed}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
