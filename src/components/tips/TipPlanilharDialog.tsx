import { Check, PencilSimple, XCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHouses } from "@/hooks/queries/use-houses";
import {
  TipContextLine,
  TipOddField,
  TipStakeFields,
} from "./tip-planilhar-form";
import { useTipPlanilhar } from "./use-tip-planilhar";
import type { PlanilharTipDto, TipItem } from "@/api/routes/get-tips";

// Versão desktop do "Conseguiu apostar?": diálogo centrado e estreito. O
// bottom sheet aqui esticava os botões de ponta a ponta do monitor e jogava a
// pergunta pro rodapé — a decisão é curta e cabe numa caixa.
export function TipPlanilharDialog({
  tip,
  open,
  onOpenChange,
  onConfirm,
  onDismiss,
  busy,
}: {
  tip: TipItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (overrides: PlanilharTipDto) => void;
  onDismiss: () => void;
  busy: boolean;
}) {
  const houses = useHouses();
  const form = useTipPlanilhar(tip);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Conseguiu apostar?</DialogTitle>
          <TipContextLine tip={tip} />
        </DialogHeader>

        <div className="space-y-3">
          <TipStakeFields tip={tip} form={form} />

          {form.editing && (
            <div className="space-y-3 border-t border-border pt-3">
              <TipOddField form={form} />
              <div className="space-y-1.5">
                <Label>Casa</Label>
                {/* Select nativo do app, como no formulário de aposta do
                    desktop — o CasaSheet é a resposta pro toque, não pro
                    mouse. */}
                <Select
                  value={form.houseIds[0]?.toString() ?? ""}
                  onValueChange={(v) => form.setHouseIds([Number(v)])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tip.house ?? "Selecione"} />
                  </SelectTrigger>
                  <SelectContent>
                    {houses.map((h) => (
                      <SelectItem key={h.id} value={h.id.toString()}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button
            className="h-11 w-full border-transparent bg-[#12a05c] text-white hover:bg-[#0e8a4e]"
            disabled={!form.valid || busy}
            onClick={() => onConfirm(form.overrides())}
          >
            <Check size={16} weight="bold" />
            {busy ? "Planilhando…" : "Planilhar e sair da fila"}
          </Button>

          <div className="flex gap-2">
            <Button
              className="flex-1 border-transparent bg-[#c0272e] text-white hover:bg-[#a71f26] hover:text-white"
              disabled={busy}
              onClick={onDismiss}
            >
              <XCircle size={15} weight="bold" /> Caiu
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => form.setEditing((v) => !v)}
            >
              <PencilSimple size={15} weight="bold" /> Editar
            </Button>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full py-1 text-center text-xs text-zinc-500 hover:text-zinc-300"
          >
            Ainda não apostei — manter na fila
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
