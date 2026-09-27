import { useState } from "react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { CasaSheet } from "@/components/apostas/CasaSheet";
import { SheetSelectField } from "@/components/apostas/SheetSelectField";
import { Label } from "@/components/ui/label";
import { useHouses } from "@/hooks/queries/use-houses";
import {
  TipContextLine,
  TipOddField,
  TipPlanilharActions,
  TipStakeFields,
  type TipPlanilharProps,
} from "./tip-planilhar-form";
import { useTipPlanilhar } from "./use-tip-planilhar";

// Você volta da casa e responde uma pergunta só: apostou quanto? A stake já
// vem preenchida com a recomendada, então o caminho comum é abrir e confirmar
// — odd e casa ficam atrás do "Editar" porque quase nunca mudam.
// Versão mobile; o desktop usa TipPlanilharDialog com os mesmos campos.
export function TipPlanilharSheet({
  tip,
  open,
  onOpenChange,
  onConfirm,
  onDismiss,
  busy,
}: TipPlanilharProps) {
  const houses = useHouses();
  const form = useTipPlanilhar(tip);
  const [casaOpen, setCasaOpen] = useState(false);

  const casaLabel =
    houses.find((h) => h.id === form.houseIds[0])?.name ?? tip.house ?? "Escolher casa";

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Conseguiu apostar?"
      // Sem X: sair daqui é escolher um dos desfechos do rodapé, ou arrastar o
      // handle pra baixo.
      hideClose
      // O contexto vai no subHeader, não no titleExtra: lá ele dividiria a
      // linha com o título, que é curto mas não pode ser cortado.
      subHeader={<TipContextLine tip={tip} />}
      footer={
        <TipPlanilharActions
          form={form}
          busy={busy}
          onConfirm={onConfirm}
          onDismiss={onDismiss}
          onOpenChange={onOpenChange}
          variant="sheet"
        />
      }
    >
      <div className="space-y-3 pb-2">
        <TipStakeFields tip={tip} form={form} />

        {form.editing && (
          <div className="space-y-3 border-t border-border pt-3">
            <TipOddField form={form} />
            <div className="space-y-1.5">
              <Label>Casa</Label>
              {/* Mesmo seletor dos filtros de Apostas: com ~200 casas
                  cadastradas, o dropdown nativo vira uma lista infinita sem
                  busca. O sheet tem busca e as usadas recentemente no topo. */}
              <SheetSelectField summary={casaLabel} onOpen={() => setCasaOpen(true)} />
            </div>
          </div>
        )}
      </div>

      <CasaSheet
        open={casaOpen}
        onOpenChange={setCasaOpen}
        houses={houses}
        houseIds={form.houseIds}
        onChange={form.setHouseIds}
        multiple={false}
      />
    </BottomSheet>
  );
}
