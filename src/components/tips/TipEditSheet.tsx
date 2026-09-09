import { useState } from "react";
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

// O "Editar" do bot reenvia a tip pro usuário corrigir por mensagem. Na tela
// o equivalente direto é abrir os três campos que mudam na prática entre a
// tip e o que foi realmente apostado: valor, odd que a casa deu na hora, e a
// casa quando o nome do canal não bate com nenhuma cadastrada.
export function TipEditSheet({
  tip,
  open,
  onOpenChange,
  onConfirm,
  busy,
}: {
  tip: TipItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (overrides: PlanilharTipDto) => void;
  busy: boolean;
}) {
  const houses = useHouses();
  const [stake, setStake] = useState(tip.recommendedStake?.toFixed(2).replace(".", ",") ?? "");
  const [odd, setOdd] = useState(tip.odd?.toFixed(2).replace(".", ",") ?? "");
  const [houseId, setHouseId] = useState<string>("");

  const stakeValue = parsePtBrNumber(stake);
  const oddValue = parsePtBrNumber(odd);
  const valid = stakeValue > 0 && oddValue > 1;
  const profit = valid ? stakeValue * oddValue - stakeValue : 0;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Planilhar aposta"
      titleExtra={<span className="text-sm text-zinc-500">{tip.game}</span>}
      footer={
        <Button
          className="w-full"
          disabled={!valid || busy}
          onClick={() =>
            onConfirm({
              stake: stakeValue,
              odd: oddValue,
              ...(houseId ? { houseId: Number(houseId) } : {}),
            })
          }
        >
          {busy ? "Planilhando…" : "Planilhar"}
        </Button>
      }
    >
      <div className="space-y-4 px-4 pb-2">
        <div className="space-y-1.5">
          <Label htmlFor="tip-stake">Valor apostado</Label>
          <Input
            id="tip-stake"
            inputMode="decimal"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            placeholder="0,00"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tip-odd">Odd</Label>
          <Input
            id="tip-odd"
            inputMode="decimal"
            value={odd}
            onChange={(e) => setOdd(e.target.value)}
            placeholder="0,00"
          />
          {tip.odd !== null && oddValue > 1 && Math.abs(oddValue - tip.odd) > 0.001 && (
            <p className="text-xs text-amber-400">
              A tip veio com {tip.odd.toFixed(2)} — vai planilhar com a odd que você digitou.
            </p>
          )}
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
          <p className="text-xs text-zinc-500">
            Vazio usa a casa da tip{tip.house ? ` (${tip.house})` : ""}.
          </p>
        </div>

        {valid && (
          <p className="text-sm text-zinc-400 tabular-nums">
            Retorno {formatCurrency(stakeValue * oddValue)} · lucro{" "}
            <span className="text-green-400">{formatCurrency(profit)}</span>
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
