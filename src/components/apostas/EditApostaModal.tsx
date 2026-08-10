import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApostaForm } from "./ApostaForm";
import { type BetItem } from "@/api/routes/get-bets";

interface EditApostaModalProps {
  aposta: BetItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApostaUpdated: (aposta: BetItem) => void;
}

export function EditApostaModal({ aposta, isOpen, onClose, onApostaUpdated }: EditApostaModalProps) {
  const handleApostaUpdated = (updatedAposta: BetItem) => {
    onApostaUpdated(updatedAposta);
    onClose();
  };

  if (!aposta) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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