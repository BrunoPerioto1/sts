import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApostaForm } from "./ApostaForm";

interface Aposta {
  id: number;
  evento: string;
  mercado: string;
  odd: number;
  valor: number;
  status: string;
  data: string;
  hora: string;
  casa: string;
  observacoes?: string;
}

interface EditApostaModalProps {
  aposta: Aposta | null;
  isOpen: boolean;
  onClose: () => void;
  onApostaUpdated: (aposta: Aposta) => void;
}

export function EditApostaModal({ aposta, isOpen, onClose, onApostaUpdated }: EditApostaModalProps) {
  const handleApostaUpdated = (updatedAposta: Aposta) => {
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