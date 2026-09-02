import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ApostaForm } from "./ApostaForm";
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

  const handleApostaUpdated = (updatedAposta: BetItem) => {
    onApostaUpdated(updatedAposta);
    onClose();
  };

  if (!aposta) return null;

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent side="right" className="w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar aposta</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <ApostaForm
              onApostaAdded={handleApostaUpdated}
              initialData={aposta}
              isEditing={true}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

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