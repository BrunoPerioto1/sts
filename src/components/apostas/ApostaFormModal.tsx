import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ApostaForm } from "./ApostaForm";
import { Plus } from "lucide-react";
import { type BetItem } from "@/api/routes/get-bets";

interface ApostaFormModalProps {
  onApostaAdded: (aposta: BetItem) => void;
  open: boolean;
  onClose: () => void;
}

export function ApostaFormModal({ onApostaAdded, open, onClose }: ApostaFormModalProps) {
  const handleApostaAdded = (aposta: BetItem) => {
    onApostaAdded(aposta);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nova Aposta</DialogTitle>
        </DialogHeader>
        <ApostaForm onApostaAdded={handleApostaAdded} />
      </DialogContent>
    </Dialog>
  );
}