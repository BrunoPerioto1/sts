import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApostaForm } from "./ApostaForm";
import { type Bet } from "@/lib/api";

interface EditApostaModalProps {
  aposta: Bet | null;
  isOpen: boolean;
  onClose: () => void;
  onApostaUpdated: (aposta: Bet) => void;
}

export function EditApostaModal({ aposta, isOpen, onClose, onApostaUpdated }: EditApostaModalProps) {
  const handleApostaUpdated = (updatedAposta: Bet) => {
    onApostaUpdated(updatedAposta);
    onClose();
  };

  if (!aposta) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Aposta</DialogTitle>
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