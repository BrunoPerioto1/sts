import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type BetItem } from "@/api/routes/get-bets";
import { useApostaForm } from "@/hooks/apostas/use-aposta-form";
import { useBetSlipScan, pickImage } from "@/hooks/apostas/use-bet-slip-scan";
import { BetSlipUpload } from "./BetSlipUpload";
import { AiFieldLabel } from "./AiFieldLabel";
import { aiFieldRing } from "@/lib/ai-field";
import { OddBoostHint } from "./OddBoostHint";
import { MatchedTipsCard } from "./MatchedTipsCard";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface ApostaFormProps {
  onApostaAdded: (aposta: BetItem) => void;
  initialData?: BetItem;
  isEditing?: boolean;
  /** Print colado na lista de Apostas: já entra lendo, sem passar pelo vazio. */
  pendingImage?: File | null;
  onPendingImageConsumed?: () => void;
  onCancel?: () => void;
}

export function ApostaForm({
  onApostaAdded,
  initialData,
  isEditing = false,
  pendingImage,
  onPendingImageConsumed,
  onCancel,
}: ApostaFormProps) {
  const {
    formData,
    setField,
    houses,
    submitting,
    potentialReturn,
    handleSubmit,
    aiMarks,
    originalOdd,
    tipId,
    setTipId,
    applyAiFields,
    resetForm,
  } = useApostaForm({ onApostaAdded, initialData, isEditing });

  const scan = useBetSlipScan();
  // Legenda da casa, como no Telegram: digitar "kto" antes de colar o print
  // evita que a IA tenha que adivinhar a casa pela logo.
  const [caption, setCaption] = useState("");
  const houseName = houses.find((h) => h.id === formData.houseId)?.name;
  // A legenda digitada vence o select: é o gesto mais recente do usuário.
  const hint = caption.trim() || houseName;

  const read = async (file: File | Blob) => {
    const parsed = await scan.scan(file, hint);
    if (parsed) applyAiFields(parsed);
  };

  // Print colado na tela de Apostas antes do modal existir: o arquivo viaja
  // como prop e a leitura começa assim que o form monta.
  useEffect(() => {
    if (!pendingImage) return;
    void read(pendingImage);
    onPendingImageConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingImage]);

  // Ctrl+V funciona a qualquer momento com o modal aberto, sem precisar focar
  // a faixa de upload.
  useEffect(() => {
    if (isEditing) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = pickImage(e.clipboardData);
      if (!file) return;
      e.preventDefault();
      void read(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, hint]);

  const checking = Object.values(aiMarks).some((m) => m?.check);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
      {/* Edição de aposta já registrada não lê print — só o cadastro novo. */}
      {!isEditing && (
        <BetSlipUpload
          status={scan.status}
          preview={scan.preview}
          error={scan.error}
          houseName={houseName}
          caption={caption}
          onCaptionChange={setCaption}
          onFile={(file) => void read(file)}
          onRetry={() => void scan.retry(hint).then((p) => p && applyAiFields(p))}
          onReset={() => {
            scan.reset();
            resetForm();
            setCaption("");
          }}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <AiFieldLabel htmlFor="evento" mark={aiMarks.game}>Evento *</AiFieldLabel>
          <Input id="evento" placeholder="Ex: Palmeiras vs Flamengo" className={aiFieldRing(aiMarks.game)} value={formData.game} onChange={(e) => setField("game", e.target.value)} />
        </div>

        <div className="col-span-2 space-y-1.5">
          <AiFieldLabel htmlFor="mercado" mark={aiMarks.market}>Mercado / Aposta *</AiFieldLabel>
          <Input id="mercado" placeholder="Ex: Resultado Final - Vitória do Palmeiras" className={aiFieldRing(aiMarks.market)} value={formData.market} onChange={(e) => setField("market", e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <AiFieldLabel mark={aiMarks.houseId}>Casa *</AiFieldLabel>
          <Select value={formData.houseId?.toString()} onValueChange={(value) => setField("houseId", Number(value))}>
            <SelectTrigger className={aiFieldRing(aiMarks.houseId)}><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {houses.map((h) => (
                <SelectItem key={h.id} value={h.id.toString()}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isEditing && (
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="bet-time" className="text-xs">Data e hora *</Label>
            <Input id="bet-time" type="datetime-local" value={formData.betTime} onChange={(e) => setField("betTime", e.target.value)} />
          </div>
        )}

        <div className="space-y-1.5">
          <AiFieldLabel htmlFor="esporte" mark={aiMarks.sport}>Esporte</AiFieldLabel>
          <Input id="esporte" placeholder="Ex: futebol" className={aiFieldRing(aiMarks.sport)} value={formData.sport} onChange={(e) => setField("sport", e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <AiFieldLabel htmlFor="odd" mark={aiMarks.odd}>Odd *</AiFieldLabel>
          <div className="relative">
            <Input id="odd" type="number" step="0.01" placeholder="Ex: 2.50" className={cn(aiFieldRing(aiMarks.odd), originalOdd !== null && "pr-24")} value={formData.odd} onChange={(e) => setField("odd", e.target.value)} />
            <OddBoostHint originalOdd={originalOdd} />
          </div>
        </div>

        <div className="space-y-1.5">
          <AiFieldLabel htmlFor="stake" mark={aiMarks.stake}>Stake (R$) *</AiFieldLabel>
          <Input id="stake" type="number" step="0.01" placeholder="Ex: 100.00" className={aiFieldRing(aiMarks.stake)} value={formData.stake} onChange={(e) => setField("stake", e.target.value)} />
        </div>
      </div>

      {scan.result && (
        <MatchedTipsCard tips={scan.result.matchedTips} selected={tipId} onSelect={setTipId} />
      )}

      {potentialReturn && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-positive/20 bg-positive/[0.07] px-4 py-3">
          <span className="text-xs text-zinc-300">Possível ganho</span>
          <span className="flex items-baseline gap-2">
            <strong className="text-lg font-semibold tabular-nums text-positive">
              {formatCurrency(potentialReturn.total)}
            </strong>
            <span className="text-[11px] tabular-nums text-zinc-400">
              lucro {formatCurrency(potentialReturn.profit)}
            </span>
          </span>
        </div>
      )}

      <div className="-mx-6 -mb-6 mt-1 flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
        <p className={cn("text-[11px] leading-snug text-amber-400", !checking && "invisible")}>
          Confira os campos marcados em amarelo antes de registrar
        </p>
        <div className="flex flex-none items-center gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={submitting} className="gap-1.5">
            {!submitting && <Check className="h-4 w-4" />}
            {submitting
              ? "Salvando…"
              : isEditing
                ? "Atualizar aposta"
                : tipId
                  ? "Registrar e vincular"
                  : "Registrar aposta"}
          </Button>
        </div>
      </div>
    </form>
  );
}
