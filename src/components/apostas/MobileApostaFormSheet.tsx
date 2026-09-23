import { useEffect, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { SheetSelectField } from "./SheetSelectField";
import { CasaSheet } from "./CasaSheet";
import { SportSheet } from "./SportSheet";
import { SportIcon } from "./SportIcon";
import { useSports, findSport } from "@/hooks/queries/use-sports";
import { DataHoraSheet, formatDataHora } from "./DataHoraSheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useApostaForm } from "@/hooks/apostas/use-aposta-form";
import { type BetItem } from "@/api/routes/get-bets";
import { useBetSlipScan } from "@/hooks/apostas/use-bet-slip-scan";
import { BetSlipUpload } from "./BetSlipUpload";
import { AiFieldLabel } from "./AiFieldLabel";
import { aiFieldRing } from "@/lib/ai-field";
import { OddBoostHint } from "./OddBoostHint";
import { MatchedTipsCard } from "./MatchedTipsCard";

const fieldLabel = "text-xs font-medium uppercase tracking-wider text-zinc-400";

interface MobileApostaFormSheetProps {
  open: boolean;
  onClose: () => void;
  onApostaAdded: (aposta: BetItem) => void;
  initialData?: BetItem;
  isEditing?: boolean;
  /** Prints colados na lista de Apostas: já entram lendo, sem passar pelo vazio. */
  pendingImage?: File | File[] | null;
  onPendingImageConsumed?: () => void;
}

export function MobileApostaFormSheet({ open, onClose, onApostaAdded, initialData, isEditing = false, pendingImage, onPendingImageConsumed }: MobileApostaFormSheetProps) {
  const [casaOpen, setCasaOpen] = useState(false);
  const [sportOpen, setSportOpen] = useState(false);
  const sports = useSports();
  const [dataHoraOpen, setDataHoraOpen] = useState(false);
  const scan = useBetSlipScan();

  // Lote: com bilhete sobrando na fila, salvar não fecha a sheet — limpa os
  // campos e já começa a ler o próximo print.
  function handleSaved(aposta: BetItem) {
    if (scan.remaining === 0) {
      onApostaAdded(aposta);
      onClose();
      return;
    }
    resetForm();
    // Só a legenda digitada segue pro próximo: a casa do bilhete anterior não
    // vale pro seguinte, e sem hint a IA lê a logo do próprio print.
    void scan.next(caption.trim() || undefined).then((p) => p && applyAiFields(p));
  }

  const { formData, setFormData, setField, houses, submitting, potentialReturn, handleSubmit, aiMarks, originalOdd, tipId, setTipId, applyAiFields, resetForm } = useApostaForm({
    onApostaAdded: handleSaved,
    initialData,
    isEditing,
  });
  // Legenda da casa, como no Telegram: digitar "kto" antes de escolher a
  // imagem evita que a IA tenha que adivinhar a casa pela logo.
  const [caption, setCaption] = useState("");
  const houseName = houses.find((h) => h.id === formData.houseId)?.name;
  // A legenda digitada vence o select: é o gesto mais recente do usuário.
  const hint = caption.trim() || houseName;

  const read = async (files: File | Blob | File[]) => {
    const parsed = await scan.scan(files, hint);
    if (parsed) applyAiFields(parsed);
  };

  /** Mais uma imagem do MESMO bilhete: relê tudo junto e reescreve os campos. */
  const addPart = async (file: File) => {
    const parsed = await scan.addPart(file, hint);
    if (parsed) applyAiFields(parsed);
  };

  useEffect(() => {
    if (!pendingImage || (Array.isArray(pendingImage) && !pendingImage.length)) return;
    void read(pendingImage);
    onPendingImageConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingImage]);

  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={isEditing ? "Editar aposta" : "Nova aposta"}
      footer={
        <Button type="submit" form="mobile-aposta-form" disabled={submitting} className="w-full min-h-[44px]">
          {submitting
            ? "Salvando…"
            : isEditing
              ? "Atualizar aposta"
              : scan.remaining > 0
                ? `Registrar e ler o próximo (${scan.remaining})`
                : tipId
                  ? "Registrar e vincular"
                  : "Registrar aposta"}
        </Button>
      }
    >
      <form id="mobile-aposta-form" onSubmit={handleSubmit} className="flex flex-col gap-4 pb-4">
        {/* Edição de aposta já registrada não lê print — só o cadastro novo. */}
        {!isEditing && (
          <BetSlipUpload
            variant="mobile"
            status={scan.status}
            preview={scan.preview}
            error={scan.error}
            houseName={houseName}
            caption={caption}
            onCaptionChange={setCaption}
            onFiles={(files) => void read(files)}
            onAddPart={(file) => void addPart(file)}
            missing={scan.result?.missing}
            oddFromSelections={scan.result?.oddFromSelections}
            batch={{ index: scan.index, total: scan.total }}
            onRetry={() => void scan.retry(hint).then((p) => p && applyAiFields(p))}
            onReset={() => {
              scan.reset();
              resetForm();
              setCaption("");
            }}
          />
        )}

        <div className="space-y-1.5">
          <AiFieldLabel htmlFor="bet-game" mark={aiMarks.game} className={fieldLabel}>Evento *</AiFieldLabel>
          <Input
            placeholder="Ex: Palmeiras x Flamengo"
            id="bet-game"
            className={aiFieldRing(aiMarks.game)}
            value={formData.game}
            onChange={(e) => setField("game", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <AiFieldLabel htmlFor="bet-market" mark={aiMarks.market} className={fieldLabel}>Mercado *</AiFieldLabel>
          <Input
            placeholder="Ex: Mais de 2.5 gols"
            id="bet-market"
            className={aiFieldRing(aiMarks.market)}
            value={formData.market}
            onChange={(e) => setField("market", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <AiFieldLabel mark={aiMarks.houseId} className={fieldLabel}>Casa *</AiFieldLabel>
            <SheetSelectField
              summary={formData.houseId ? (houses.find((h) => h.id === formData.houseId)?.name ?? "Selecionar") : "Selecionar"}
              onOpen={() => setCasaOpen(true)}
              className="min-h-[44px] sm:min-h-[36px]"
            />
          </div>
          <div className="space-y-1.5">
            <AiFieldLabel htmlFor="bet-odd" mark={aiMarks.odd} className={fieldLabel}>Odd *</AiFieldLabel>
            {/* type="text", não "number": com locale pt-BR o input numérico
                trata a vírgula como caractere inválido e zera o valor sem
                avisar — justamente o separador que o placeholder pede. */}
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 1,92"
                id="bet-odd"
                className={cn(aiFieldRing(aiMarks.odd), originalOdd !== null && "pr-24")}
                value={formData.odd}
                onChange={(e) => setField("odd", e.target.value)}
              />
              <OddBoostHint originalOdd={originalOdd} />
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="space-y-1.5">
            <span className={fieldLabel}>Data e hora *</span>
            <SheetSelectField
              summary={formatDataHora(formData.betTime)}
              onOpen={() => setDataHoraOpen(true)}
              className="min-h-[44px] sm:min-h-[36px]"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <AiFieldLabel mark={aiMarks.sport} className={fieldLabel}>Esporte</AiFieldLabel>
            <SheetSelectField
              summary={findSport(sports, formData.sport)?.name ?? (formData.sport || "Selecionar")}
              onOpen={() => setSportOpen(true)}
              leading={formData.sport && <SportIcon name={findSport(sports, formData.sport)?.name} className="text-zinc-400 shrink-0" />}
              className={cn("min-h-[44px] sm:min-h-[36px]", aiFieldRing(aiMarks.sport))}
            />
          </div>
          <div className="space-y-1.5">
            <AiFieldLabel htmlFor="bet-stake" mark={aiMarks.stake} className={fieldLabel}>Stake (R$) *</AiFieldLabel>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Ex: 100,00"
              id="bet-stake"
              className={aiFieldRing(aiMarks.stake)}
              value={formData.stake}
              onChange={(e) => setField("stake", e.target.value)}
            />
          </div>
        </div>

        {scan.result && (
          <MatchedTipsCard tips={scan.result.matchedTips} selected={tipId} onSelect={setTipId} />
        )}

        {potentialReturn && (
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-positive/20 bg-positive/[0.07] p-3">
            <div>
              <p className={fieldLabel}>Possível ganho</p>
              <p className="text-xl font-semibold tabular-nums text-positive">{formatCurrency(potentialReturn.total)}</p>
            </div>
            <div>
              <p className={fieldLabel}>Lucro se ganhar</p>
              <p className="text-xl font-semibold tabular-nums text-foreground">+{formatCurrency(potentialReturn.profit)}</p>
            </div>
          </div>
        )}
      </form>

      <DataHoraSheet
        open={dataHoraOpen}
        onOpenChange={setDataHoraOpen}
        value={formData.betTime}
        onApply={(betTime) => setFormData({ ...formData, betTime })}
      />

      <SportSheet
        multiple={false}
        open={sportOpen}
        onOpenChange={setSportOpen}
        sports={sports}
        selected={[findSport(sports, formData.sport)?.id ?? 0]}
        onChange={(ids) => setField("sport", sports.find((s) => s.id === ids[0])?.name ?? formData.sport)}
      />

      <CasaSheet
        multiple={false}
        open={casaOpen}
        onOpenChange={setCasaOpen}
        houses={houses}
        houseIds={formData.houseId ? [formData.houseId] : []}
        onChange={(ids) => setFormData({ ...formData, houseId: ids[0] })}
      />
    </BottomSheet>
  );
}
