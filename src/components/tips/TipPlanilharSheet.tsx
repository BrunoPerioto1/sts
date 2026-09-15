import { useState } from "react";
import { Check, PencilSimple, XCircle } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { Button } from "@/components/ui/button";
import { CasaSheet } from "@/components/apostas/CasaSheet";
import { SheetSelectField } from "@/components/apostas/SheetSelectField";
import { Label } from "@/components/ui/label";
import { useHouses } from "@/hooks/queries/use-houses";
import {
  TipContextLine,
  TipOddField,
  TipStakeFields,
} from "./tip-planilhar-form";
import { useTipPlanilhar } from "./use-tip-planilhar";
import type { PlanilharTipDto, TipItem } from "@/api/routes/get-tips";

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
        <div className="space-y-2">
          <Button
            size="lg"
            className="h-12 w-full border-transparent bg-[#12a05c] text-white hover:bg-[#0e8a4e]"
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
            <Button variant="outline" className="flex-1" onClick={() => form.setEditing((v) => !v)}>
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
