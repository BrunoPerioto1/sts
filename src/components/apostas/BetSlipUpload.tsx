import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { pickImage, type ScanPreview, type ScanStatus } from "@/hooks/apostas/use-bet-slip-scan";

interface BetSlipUploadProps {
  status: ScanStatus;
  preview: ScanPreview | null;
  error: string | null;
  houseName?: string;
  /** Legenda da casa, como no Telegram. Texto livre — o backend resolve. */
  caption: string;
  onCaptionChange: (value: string) => void;
  onFile: (file: File) => void;
  onRetry: () => void;
  /** Limpa print E campos. "Trocar" e "Remover" passam por aqui. */
  onReset: () => void;
  /** Mobile troca a faixa por dois botões: Galeria e Câmera. */
  variant?: "band" | "mobile";
}

const kb = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const chip =
  "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-colors";

export function BetSlipUpload({
  status,
  preview,
  error,
  houseName,
  caption,
  onCaptionChange,
  onFile,
  onRetry,
  onReset,
  variant = "band",
}: BetSlipUploadProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [zoom, setZoom] = useState(false);
  // dragenter/dragleave disparam para cada filho; o contador evita a borda
  // piscando enquanto o cursor atravessa o conteúdo da área.
  const dragDepth = useRef(0);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  const take = (file: File | null) => {
    if (file) onFile(file);
  };

  // Trocar de bilhete é começar do zero: zera os campos antes de abrir o
  // seletor, senão o evento/odd do print anterior fica parado na tela até a
  // nova leitura terminar (ou para sempre, se ela falhar).
  const replace = () => {
    onReset();
    fileInput.current?.click();
  };

  const dropZone = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current++;
      setDragging(true);
    },
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      if (--dragDepth.current <= 0) {
        dragDepth.current = 0;
        setDragging(false);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      take(pickImage(e.dataTransfer));
    },
  };

  const inputs = (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          take(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          take(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </>
  );

  const captionInput = (
    <input
      type="text"
      value={caption}
      onChange={(e) => onCaptionChange(e.target.value)}
      placeholder="casa (ex: kto)"
      aria-label="Casa de apostas do bilhete"
      className="w-[108px] flex-none rounded-lg border border-white/10 bg-[var(--color-surface-2)] px-2.5 py-2 text-[11px] outline-none transition-colors placeholder:text-zinc-600 focus:border-accent"
    />
  );

  const thumb = preview && (
    <button
      type="button"
      onClick={() => setZoom(true)}
      className="h-[58px] w-[58px] flex-none overflow-hidden rounded-lg border border-white/10 transition-colors hover:border-white/25"
      aria-label="Ampliar print"
    >
      <img src={preview.url} alt="Print do bilhete" className="h-full w-full object-cover" />
    </button>
  );

  const fileLine = (
    <p className="truncate text-[11px] text-zinc-500">
      {[houseName, preview?.name, preview ? kb(preview.size) : null]
        .filter(Boolean)
        .join(" · ")}
    </p>
  );

  const body = () => {
    if (status === "reading")
      return (
        <div className="flex items-center gap-3">
          {thumb}
          <div className="min-w-0 flex-1 space-y-1">
            <span className={cn(chip, "bg-accent/15 text-accent-text")}>
              <Loader2 className="h-3 w-3 animate-spin" />
              Lendo bilhete…
            </span>
            {fileLine}
          </div>
        </div>
      );

    if (status === "error")
      return (
        <div className="flex items-start gap-3">
          {thumb}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-medium text-amber-400">
              {error ?? "Não consegui ler esse print"}
            </p>
            <p className="text-[11px] leading-snug text-zinc-500">
              Tente um print da aposta confirmada, com evento, odd e valor visíveis — ou
              registre manualmente abaixo.
            </p>
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <button
                type="button"
                onClick={onRetry}
                className={cn(chip, "text-accent-text hover:bg-accent/15")}
              >
                <RotateCcw className="h-3 w-3" />
                Tentar de novo
              </button>
              <button
                type="button"
                onClick={replace}
                className={cn(chip, "text-zinc-400 hover:bg-white/5 hover:text-white")}
              >
                <RefreshCw className="h-3 w-3" />
                Escolher outra
              </button>
            </div>
          </div>
        </div>
      );

    if (status === "done")
      return (
        <div className="flex items-start gap-3">
          {thumb}
          <div className="min-w-0 flex-1 space-y-1">
            <span className={cn(chip, "bg-positive/15 font-medium text-positive")}>
              <Sparkles className="h-3 w-3" />
              Lido pela IA
            </span>
            {fileLine}
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <button
                type="button"
                onClick={() => setZoom(true)}
                className={cn(chip, "text-zinc-400 hover:bg-white/5 hover:text-white")}
              >
                <ZoomIn className="h-3 w-3" />
                Ampliar
              </button>
              <button
                type="button"
                onClick={replace}
                className={cn(chip, "text-zinc-400 hover:bg-white/5 hover:text-white")}
              >
                <RefreshCw className="h-3 w-3" />
                Trocar
              </button>
              <button
                type="button"
                onClick={onReset}
                className={cn(chip, "text-negative hover:bg-negative/10")}
              >
                <Trash2 className="h-3 w-3" />
                Remover
              </button>
            </div>
          </div>
        </div>
      );

    // vazio
    if (variant === "mobile")
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="casa (ex: kto) — opcional"
            aria-label="Casa de apostas do bilhete"
            className="w-full rounded-lg border border-white/10 bg-[var(--color-surface-2)] px-3 py-2.5 text-xs outline-none transition-colors placeholder:text-zinc-600 focus:border-accent"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-[var(--color-surface-2)] text-xs font-medium transition-colors hover:border-accent/50"
            >
              <ImageIcon className="h-4 w-4 text-accent-text" />
              Galeria
            </button>
            <button
              type="button"
              onClick={() => cameraInput.current?.click()}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-[var(--color-surface-2)] text-xs font-medium transition-colors hover:border-accent/50"
            >
              <Camera className="h-4 w-4 text-accent-text" />
              Câmera
            </button>
          </div>
          <p className="text-center text-[11px] text-zinc-500">
            a IA lê o bilhete e preenche — ou digite abaixo
          </p>
        </div>
      );

    return (
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-[58px] w-[58px] flex-none items-center justify-center rounded-lg border border-dashed transition-colors",
            dragging ? "border-accent bg-accent/10" : "border-white/15",
          )}
        >
          <Upload className={cn("h-4 w-4", dragging ? "text-accent-text" : "text-zinc-600")} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium">
            {dragging
              ? "Solte para ler o bilhete"
              : "Cole o print (Ctrl+V), arraste ou escolha uma imagem"}
          </p>
          <p className="text-[11px] text-zinc-500">
            {dragging
              ? "PNG, JPG ou WebP — uma imagem por vez"
              : "informe a casa ao lado (opcional) — a IA preenche o resto"}
          </p>
        </div>
        {captionInput}
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="flex-none rounded-lg border border-white/10 bg-[var(--color-surface-2)] px-3 py-2 text-[11px] font-medium transition-colors hover:border-accent/50"
        >
          Escolher imagem
        </button>
      </div>
    );
  };

  return (
    <>
      <div
        {...dropZone}
        className={cn(
          "rounded-xl border p-3 transition-colors",
          dragging
            ? "border-accent bg-accent/10"
            : "border-white/10 bg-[var(--color-surface)]",
          status === "error" && !dragging && "border-amber-400/40",
        )}
      >
        {body()}
        {inputs}
      </div>

      {zoom && preview && (
        <div
          role="dialog"
          aria-label="Print do bilhete"
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-6"
        >
          <img
            src={preview.url}
            alt="Print do bilhete"
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </>
  );
}
