import { useCallback, useEffect, useRef, useState } from "react";
import { parseBetImage, type ParsedBetSlip } from "@/api/routes/post-parse-image";
import { compressImage } from "@/lib/compress-image";

export type ScanStatus = "idle" | "reading" | "done" | "error";

export interface ScanPreview {
  url: string;
  name: string;
  size: number;
  /** Quantas imagens compõem ESTE bilhete (print grande dividido em partes). */
  parts: number;
}

/**
 * Leitura do print: comprime, envia e guarda o resultado. Não escreve no
 * formulário nem salva nada — quem consome decide o que fazer com os campos.
 *
 * Duas dimensões, que são coisas diferentes e não podem se misturar:
 * - PARTES: várias imagens do MESMO bilhete, lidas juntas numa chamada só.
 * - FILA: vários bilhetes escolhidos de uma vez, lidos e registrados um a um.
 */
export function useBetSlipScan() {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [preview, setPreview] = useState<ScanPreview | null>(null);
  const [result, setResult] = useState<ParsedBetSlip | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bilhetes ainda não lidos do lote e posição do atual — só pra tela dizer
  // "bilhete 2 de 5"; o registro continua um de cada vez.
  const [queue, setQueue] = useState<Blob[]>([]);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  // Print trocado no meio de uma leitura: a resposta antiga não pode chegar
  // por cima da nova.
  const runId = useRef(0);
  // Partes do bilhete atual, na ordem — "adicionar parte" relê todas juntas.
  const parts = useRef<Blob[]>([]);

  const revoke = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (revoke.current) URL.revokeObjectURL(revoke.current);
    },
    [],
  );

  const run = useCallback(async (files: Blob[], houseHint?: string) => {
    const run = ++runId.current;
    parts.current = files;

    const first = files[0];
    if (revoke.current) URL.revokeObjectURL(revoke.current);
    const url = URL.createObjectURL(first);
    revoke.current = url;

    setPreview({
      url,
      name: first instanceof File ? first.name : "print colado",
      size: files.reduce((sum, f) => sum + f.size, 0),
      parts: files.length,
    });
    setResult(null);
    setError(null);
    setStatus("reading");

    try {
      const compressed = await Promise.all(files.map(compressImage));
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

  /**
   * Começa um lote: cada arquivo é um bilhete diferente. O primeiro é lido
   * agora, o resto espera na fila até o usuário registrar o da vez.
   */
  const scan = useCallback(
    (input: File | Blob | Array<File | Blob>, houseHint?: string) => {
      const files: Blob[] = Array.isArray(input) ? input : [input];
      if (!files.length) return Promise.resolve(null);
      setQueue(files.slice(1));
      setTotal(files.length);
      setIndex(1);
      return run([files[0]], houseHint);
    },
    [run],
  );

  /** Mais uma imagem DO MESMO bilhete — o print não cabia numa tela só. */
  const addPart = useCallback(
    (file: File | Blob, houseHint?: string) =>
      run([...parts.current, file], houseHint),
    [run],
  );

  /** Próximo bilhete da fila. Devolve null quando o lote acabou. */
  const next = useCallback(
    (houseHint?: string) => {
      const [file, ...rest] = queue;
      if (!file) return Promise.resolve(null);
      setQueue(rest);
      setIndex((i) => i + 1);
      return run([file], houseHint);
    },
    [queue, run],
  );

  const retry = useCallback(
    (houseHint?: string) =>
      parts.current.length ? run(parts.current, houseHint) : Promise.resolve(null),
    [run],
  );

  /** Limpa o bilhete atual E o lote: é o botão "remover/trocar". */
  const reset = useCallback(() => {
    runId.current++;
    parts.current = [];
    if (revoke.current) URL.revokeObjectURL(revoke.current);
    revoke.current = null;
    setPreview(null);
    setResult(null);
    setError(null);
    setStatus("idle");
    setQueue([]);
    setIndex(0);
    setTotal(0);
  }, []);

  return {
    status,
    preview,
    result,
    error,
    scan,
    addPart,
    next,
    retry,
    reset,
    /** Bilhetes do lote ainda não lidos. */
    remaining: queue.length,
    index,
    total,
  };
}

/** Imagens de um ClipboardEvent/DataTransfer, na ordem. */
export function pickImages(data: DataTransfer | null): File[] {
  if (!data) return [];
  const fromItems = Array.from(data.items ?? [])
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => !!file);
  if (fromItems.length) return fromItems;
  return Array.from(data.files ?? []).filter((f) => f.type.startsWith("image/"));
}
