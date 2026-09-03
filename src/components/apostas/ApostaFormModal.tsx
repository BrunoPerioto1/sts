import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApostaForm } from "./ApostaForm";
import { MobileApostaFormSheet } from "./MobileApostaFormSheet";
import { type BetItem } from "@/api/routes/get-bets";
import { useIsMobile } from "@/hooks/use-mobile";

interface ApostaFormModalProps {
  onApostaAdded: (aposta: BetItem) => void;
  open: boolean;
  onClose: () => void;
}

export function ApostaFormModal({ onApostaAdded, open, onClose }: ApostaFormModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileApostaFormSheet open={open} onClose={onClose} onApostaAdded={onApostaAdded} />;
  }

  const handleApostaAdded = (aposta: BetItem) => {
    onApostaAdded(aposta);
    onClose();
  };

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
