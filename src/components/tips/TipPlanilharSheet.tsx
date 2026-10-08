import { useState } from "react";
import { CaretDown, CaretUp, Check, PencilSimple } from "@phosphor-icons/react";
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
import { formatMoney, houseDisplayName } from "@/lib/format";
import type { PlanilharTipDto, TipItem } from "@/api/routes/get-tips";
import type { TipPlanilharInitial } from "./TipCardMobileItem";

// Você volta da casa e responde uma pergunta só: apostou quanto? A stake já
// vem preenchida com a recomendada, então o caminho comum é abrir e confirmar
// — odd e casa ficam atrás do "Odd ou casa diferente?" porque quase nunca mudam.
// Versão mobile; o desktop usa TipPlanilharDialog com os mesmos campos.
export function TipPlanilharSheet({
  tip,
  initial,
  open,
  onOpenChange,
  onConfirm,
  onDismiss,
  busy,
}: {
  tip: TipItem;
  /** Stake e odd vindas do "Odd mudou?". */
  initial?: TipPlanilharInitial;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (overrides: PlanilharTipDto) => void;
  onDismiss: () => void;
  busy: boolean;
}) {
  const houses = useHouses();
  const form = useTipPlanilhar(tip, initial);
  const [casaOpen, setCasaOpen] = useState(false);

  const casaLabel =
    houseDisplayName(houses.find((h) => h.id === form.houseIds[0])?.name ?? tip.house ?? "Escolher casa");

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
        <div className="space-y-1">
          <Button
            size="lg"
            className="h-12 w-full border-transparent bg-success-solid text-base text-white hover:bg-success-solid/90"
            disabled={!form.valid || busy}
            onClick={() => onConfirm(form.overrides())}
          >
            <Check size={16} weight="bold" />
            {busy ? "Planilhando…" : `Planilhar ${form.valid ? formatMoney(form.stakeValue) : ""}`}
          </Button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="secondary" className="h-11" onClick={() => onOpenChange(false)}>
              Ainda não apostei
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={onDismiss}
              className="h-11 border-danger/30 text-danger hover:bg-danger/10"
            >
              Não deu · caiu
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pb-2">
        <TipStakeFields tip={tip} form={form} />

        <div className="border-t border-border">
          <button
            type="button"
            onClick={() => form.setEditing((v) => !v)}
            className="flex w-full items-center gap-2 py-3 text-sm text-zinc-300"
          >
            <PencilSimple size={15} />
            <span className="flex-1 text-left">Odd ou casa diferente?</span>
            {form.editing ? <CaretUp size={14} /> : <CaretDown size={14} />}
          </button>
          {form.editing && (
            <div className="grid grid-cols-[2fr_3fr] gap-3 pb-1">
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
