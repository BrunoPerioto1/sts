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
  TipPlanilharActions,
  TipStakeFields,
  type TipPlanilharProps,
} from "./tip-planilhar-form";
import { useTipPlanilhar } from "./use-tip-planilhar";

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
}: TipPlanilharProps) {
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

        <TipPlanilharActions
          form={form}
          busy={busy}
          onConfirm={onConfirm}
          onDismiss={onDismiss}
          onOpenChange={onOpenChange}
          variant="dialog"
        />
      </DialogContent>
    </Dialog>
  );
}
