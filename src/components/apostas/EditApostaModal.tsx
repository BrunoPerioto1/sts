import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApostaForm } from "./ApostaForm";
import { MobileApostaFormSheet } from "./MobileApostaFormSheet";
import { type BetItem } from "@/api/routes/get-bets";
import { useIsMobile } from "@/hooks/use-mobile";

interface EditApostaModalProps {
  aposta: BetItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApostaUpdated: (aposta: BetItem) => void;
}

export function EditApostaModal({ aposta, isOpen, onClose, onApostaUpdated }: EditApostaModalProps) {
  const isMobile = useIsMobile();

  if (!aposta) return null;

  if (isMobile) {
    return (
      <MobileApostaFormSheet
        open={isOpen}
        onClose={onClose}
        onApostaAdded={onApostaUpdated}
        initialData={aposta}
        isEditing
      />
    );
  }

  const handleApostaUpdated = (updatedAposta: BetItem) => {
    onApostaUpdated(updatedAposta);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar aposta</DialogTitle>
        </DialogHeader>
        <ApostaForm
          onApostaAdded={handleApostaUpdated}
          initialData={aposta}
          isEditing={true}
        />
      </DialogContent>
    </Dialog>
  );
}
