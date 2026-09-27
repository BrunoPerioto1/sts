import { useEffect, useState } from "react";
import type { BetItem } from "@/api/routes/get-bets";
import type { BetSlipUploadProps } from "@/components/apostas/BetSlipUpload";
import { useApostaForm } from "./use-aposta-form";
import { useBetSlipScan } from "./use-bet-slip-scan";

interface UseApostaFormScanArgs {
  /** Chamado quando a última aposta do lote é salva. */
  onDone: (aposta: BetItem) => void;
  initialData?: BetItem;
  isEditing?: boolean;
  /** Prints colados na lista de Apostas: já entram lendo, sem passar pelo vazio. */
  pendingImage?: File | File[] | null;
  onPendingImageConsumed?: () => void;
}

// useApostaForm + leitura de print (IA), comum ao form desktop e ao sheet
// mobile: legenda da casa, lote de bilhetes e print vindo da lista.
export function useApostaFormScan({
  onDone,
  initialData,
  isEditing = false,
  pendingImage,
  onPendingImageConsumed,
}: UseApostaFormScanArgs) {
  const scan = useBetSlipScan();

  // Lote: enquanto sobrar bilhete na fila, salvar não fecha a tela — limpa o
  // formulário e já começa a ler o próximo.
  function handleSaved(aposta: BetItem) {
    if (scan.remaining === 0) {
      onDone(aposta);
      return;
    }
    form.resetForm();
    // Só a legenda digitada segue pro próximo: a casa do bilhete anterior não
    // vale pro seguinte, e sem hint a IA lê a logo do próprio print.
    void scan.next(caption.trim() || undefined).then((p) => p && form.applyAiFields(p));
  }

  const form = useApostaForm({ onApostaAdded: handleSaved, initialData, isEditing });

  // Legenda da casa, como no Telegram: digitar "kto" antes de mandar o print
  // evita que a IA tenha que adivinhar a casa pela logo.
  const [caption, setCaption] = useState("");
  const houseName = form.houses.find((h) => h.id === form.formData.houseId)?.name;
  // A legenda digitada vence o select: é o gesto mais recente do usuário.
  const hint = caption.trim() || houseName;

  const read = async (files: File | Blob | File[]) => {
    const parsed = await scan.scan(files, hint);
    if (parsed) form.applyAiFields(parsed);
  };

  /** Mais uma imagem do MESMO bilhete: relê tudo junto e reescreve os campos. */
  const addPart = async (file: File) => {
    const parsed = await scan.addPart(file, hint);
    if (parsed) form.applyAiFields(parsed);
  };

  // Print colado na tela de Apostas antes do form existir: o arquivo viaja
  // como prop e a leitura começa assim que o form monta.
  useEffect(() => {
    if (!pendingImage || (Array.isArray(pendingImage) && !pendingImage.length)) return;
    void read(pendingImage);
    onPendingImageConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingImage]);

  const uploadProps: Omit<BetSlipUploadProps, "variant"> = {
    status: scan.status,
    preview: scan.preview,
    error: scan.error,
    houseName,
    caption,
    onCaptionChange: setCaption,
    onFiles: (files) => void read(files),
    onAddPart: (file) => void addPart(file),
    missing: scan.result?.missing,
    oddFromSelections: scan.result?.oddFromSelections,
    batch: { index: scan.index, total: scan.total },
    onRetry: () => void scan.retry(hint).then((p) => p && form.applyAiFields(p)),
    onReset: () => {
      scan.reset();
      form.resetForm();
      setCaption("");
    },
  };

  return { ...form, scan, hint, read, uploadProps };
}
