import { useCallback, useEffect, useRef, useState } from "react";
import { parseBetImage, type ParsedBetSlip } from "@/api/routes/post-parse-image";
import { compressImage } from "@/lib/compress-image";

export type ScanStatus = "idle" | "reading" | "done" | "error";

export interface ScanPreview {
  url: string;
  name: string;
  size: number;
}

/**
 * Leitura do print: comprime, envia e guarda o resultado. Não escreve no
 * formulário nem salva nada — quem consome decide o que fazer com os campos.
 */
export function useBetSlipScan() {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [preview, setPreview] = useState<ScanPreview | null>(null);
  const [result, setResult] = useState<ParsedBetSlip | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Print trocado no meio de uma leitura: a resposta antiga não pode chegar
  // por cima da nova.
  const runId = useRef(0);
  const lastFile = useRef<Blob | null>(null);

  const revoke = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (revoke.current) URL.revokeObjectURL(revoke.current);
    },
    [],
  );

  const scan = useCallback(async (file: File | Blob, houseHint?: string) => {
    const run = ++runId.current;
    lastFile.current = file;

    if (revoke.current) URL.revokeObjectURL(revoke.current);
    const url = URL.createObjectURL(file);
    revoke.current = url;

    setPreview({
      url,
      name: file instanceof File ? file.name : "print colado",
      size: file.size,
    });
    setResult(null);
    setError(null);
    setStatus("reading");

    try {
      const compressed = await compressImage(file);
      const parsed = await parseBetImage(compressed, houseHint);
      if (run !== runId.current) return null;
      setResult(parsed);
      setStatus("done");
      return parsed;
    } catch (e) {
      if (run !== runId.current) return null;
      setError(e instanceof Error ? e.message : "Falha ao ler o print");
      setStatus("error");
      return null;
    }
  }, []);

  const retry = useCallback(
    (houseHint?: string) =>
      lastFile.current ? scan(lastFile.current, houseHint) : Promise.resolve(null),
    [scan],
  );

  const reset = useCallback(() => {
    runId.current++;
    lastFile.current = null;
    if (revoke.current) URL.revokeObjectURL(revoke.current);
    revoke.current = null;
    setPreview(null);
    setResult(null);
    setError(null);
    setStatus("idle");
  }, []);

  return { status, preview, result, error, scan, retry, reset };
}

/** Primeira imagem de um ClipboardEvent/DataTransfer, ou null. */
export function pickImage(data: DataTransfer | null): File | null {
  if (!data) return null;
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  return Array.from(data.files ?? []).find((f) => f.type.startsWith("image/")) ?? null;
}
