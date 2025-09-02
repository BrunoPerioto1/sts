import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ApostaForm } from "./ApostaForm";
import { Plus } from "lucide-react";

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

interface ApostaFormModalProps {
  onApostaAdded: (aposta: Aposta) => void;
}

export function ApostaFormModal({ onApostaAdded }: ApostaFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleApostaAdded = (aposta: Aposta) => {
    onApostaAdded(aposta);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Nova Aposta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nova Aposta</DialogTitle>
        </DialogHeader>
        <ApostaForm onApostaAdded={handleApostaAdded} />
      </DialogContent>
    </Dialog>
  );
}