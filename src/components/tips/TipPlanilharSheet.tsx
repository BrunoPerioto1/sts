import { useState } from "react";
import { Check, PencilSimple, XCircle } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, parsePtBrNumber } from "@/lib/format";
import { useHouses } from "@/hooks/queries/use-houses";
import type { PlanilharTipDto, TipItem } from "@/api/routes/get-tips";

const toInput = (value: number | null) => value?.toFixed(2).replace(".", ",") ?? "";

const chipClass =
  "h-11 shrink-0 rounded-lg border border-border px-3 text-sm text-zinc-300 transition-colors hover:bg-foreground/[0.07]";

// Você volta da casa e responde uma pergunta só: apostou quanto? A stake já
// vem preenchida com a recomendada, então o caminho comum é abrir e confirmar
// — odd e casa ficam atrás do "Editar" porque quase nunca mudam.
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
  const [stake, setStake] = useState(toInput(tip.recommendedStake));
  const [odd, setOdd] = useState(toInput(tip.odd));
  const [houseId, setHouseId] = useState("");
  const [editing, setEditing] = useState(false);

  const stakeValue = parsePtBrNumber(stake);
  const oddValue = parsePtBrNumber(odd);
  const valid = stakeValue > 0 && oddValue > 1;
  const retorno = stakeValue * oddValue;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Conseguiu apostar?"
      // O contexto vai no subHeader, não no titleExtra: lá ele dividiria a
      // linha com o título, que é curto mas não pode ser cortado.
      subHeader={
        <p className="text-sm text-zinc-500">
          {[tip.market, tip.house, tip.odd !== null && `odd ${tip.odd.toFixed(2)}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      }
      footer={
        <div className="space-y-2">
          <Button
            size="lg"
            className="h-12 w-full border-transparent bg-accent text-white hover:bg-accent-700"
            disabled={!valid || busy}
            onClick={() =>
              onConfirm({
                stake: stakeValue,
                odd: oddValue,
                ...(houseId ? { houseId: Number(houseId) } : {}),
              })
            }
          >
            <Check size={16} weight="bold" />
            {busy ? "Planilhando…" : "Planilhar e sair da fila"}
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" disabled={busy} onClick={onDismiss}>
              <XCircle size={15} weight="bold" /> Caiu
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setEditing((v) => !v)}>
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
        <Label htmlFor="tip-stake" className="text-xs uppercase tracking-wide text-zinc-500">
          Stake apostada
        </Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
              R$
            </span>
            <Input
              id="tip-stake"
              inputMode="decimal"
              autoFocus
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className="h-12 pl-10 text-lg font-semibold tabular-nums"
              placeholder="0,00"
            />
          </div>
          {tip.recommendedStake !== null && (
            <button type="button" className={chipClass} onClick={() => setStake(toInput(tip.recommendedStake))}>
              Sugerida
            </button>
          )}
          {tip.limit !== null && (
            <button type="button" className={chipClass} onClick={() => setStake(toInput(tip.limit))}>
              Limite
            </button>
          )}
        </div>

        {valid && (
          <p className="text-sm text-zinc-400 tabular-nums">
            Retorno {formatCurrency(retorno)} · lucro{" "}
            <span className="text-green-400">{formatCurrency(retorno - stakeValue)}</span>
          </p>
        )}

        {editing && (
          <div className="space-y-3 border-t border-border pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="tip-odd">Odd</Label>
              <Input
                id="tip-odd"
                inputMode="decimal"
                value={odd}
                onChange={(e) => setOdd(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Casa</Label>
              <Select value={houseId} onValueChange={setHouseId}>
                <SelectTrigger>
                  <SelectValue placeholder={tip.house ?? "Escolher casa"} />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((h) => (
                    <SelectItem key={h.id} value={String(h.id)}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
