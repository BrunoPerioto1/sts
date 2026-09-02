import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ApostaForm } from "./ApostaForm";
import { type BetItem } from "@/api/routes/get-bets";
import { useIsMobile } from "@/hooks/use-mobile";

interface ApostaFormModalProps {
  onApostaAdded: (aposta: BetItem) => void;
  open: boolean;
  onClose: () => void;
}

export function ApostaFormModal({ onApostaAdded, open, onClose }: ApostaFormModalProps) {
  const isMobile = useIsMobile();

  const handleApostaAdded = (aposta: BetItem) => {
    onApostaAdded(aposta);
    onClose();
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <SheetContent side="right" className="w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nova aposta</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <ApostaForm onApostaAdded={handleApostaAdded} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova aposta</DialogTitle>
        </DialogHeader>
        <ApostaForm onApostaAdded={handleApostaAdded} />
      </DialogContent>
    </Dialog>
  );
}