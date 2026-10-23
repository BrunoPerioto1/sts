import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CaretDown, CaretLeft, CaretRight, CaretUp } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// Moldura do detalhe das duas abas da Conferência (a proposta do bot e a
// aposta pra liquidar na mão): contador com anterior/próxima, título, corpo
// rolável e as ações presas embaixo.

export interface FrameProps {
  /** "Proposta 3 de 24"; no sheet do celular vai só "3 de 24". */
  rotulo: string;
  posicao: number;
  total: number;
  titulo: string;
  subtitulo?: string | null;
  onPrev?: () => void;
  onNext?: () => void;
  corpo: ReactNode;
  acoes: ReactNode;
  /** Linha miúda embaixo das ações, só no desktop. */
  nota?: string;
}

const navBtn = "press grid h-8 w-9 place-items-center text-zinc-400 transition-colors hover:text-foreground disabled:opacity-35";

/** Anterior/próxima. No desktop a lista é vertical (↑ ↓); no celular, ‹ ›. */
function Navegacao({ onPrev, onNext, vertical, tabIndex }: Pick<FrameProps, "onPrev" | "onNext"> & { vertical?: boolean; tabIndex?: number }) {
  const [Prev, Next] = vertical ? [CaretUp, CaretDown] : [CaretLeft, CaretRight];
  return (
    <div className="flex divide-x divide-foreground/10 overflow-hidden rounded-lg border border-foreground/10">
      <button type="button" className={navBtn} disabled={!onPrev} onClick={onPrev} aria-label="Anterior" tabIndex={tabIndex}>
        <Prev size={14} />
      </button>
      <button type="button" className={navBtn} disabled={!onNext} onClick={onNext} aria-label="Próxima" tabIndex={tabIndex}>
        <Next size={14} />
      </button>
    </div>
  );
}

function Titulo({ titulo, subtitulo }: Pick<FrameProps, "titulo" | "subtitulo">) {
  return (
    <>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{titulo}</h2>
      {subtitulo && <p className="mt-1 text-[13px] tabular-nums text-zinc-500">{subtitulo}</p>}
    </>
  );
}

/**
 * Card do detalhe no desktop: ao lado da lista (xl) ou dentro da gaveta
 * lateral (md). `preview` é a amostra do convite do Pro — inteira, mas inerte.
 */
export function DetailPanel({ preview = false, className, ...p }: FrameProps & { preview?: boolean; className?: string }) {
  const tabIndex = preview ? -1 : undefined;
  return (
    <div className={cn("flex flex-col rounded-2xl border border-foreground/10 bg-card shadow-card", className)} aria-hidden={preview || undefined}>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <p className="text-[13px] tabular-nums text-zinc-500">{p.rotulo} {p.posicao} de {p.total}</p>
            <Navegacao vertical onPrev={p.onPrev} onNext={p.onNext} tabIndex={tabIndex} />
          </div>
          <Titulo titulo={p.titulo} subtitulo={p.subtitulo} />
        </div>
        {p.corpo}
      </div>
      <div className="shrink-0 space-y-3 border-t border-foreground/[0.07] p-6 pt-5">
        {p.acoes}
        {p.nota && !preview && <p className="text-center text-xs text-zinc-500">{p.nota}</p>}
      </div>
    </div>
  );
}

/** Sem o painel ao lado (abaixo de xl): sheet no celular, gaveta lateral no resto. */
export function DetailOverlay({ onClose, ...p }: FrameProps & { onClose: () => void }) {
  const isMobile = useIsMobile();
  const onOpenChange = (o: boolean) => !o && onClose();

  if (isMobile) {
    return (
      <BottomSheet
        open
        onOpenChange={onOpenChange}
        title={<span className="text-sm font-normal tabular-nums text-zinc-500">{p.posicao} de {p.total}</span>}
        action={<div className="mr-1"><Navegacao onPrev={p.onPrev} onNext={p.onNext} /></div>}
        footer={p.acoes}
      >
        <div className="space-y-5 pb-4">
          <div>
            <Titulo titulo={p.titulo} subtitulo={p.subtitulo} />
          </div>
          {p.corpo}
        </div>
      </BottomSheet>
    );
  }

  return (
    <DialogPrimitive.Root open onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-zinc-950 p-3 animate-in slide-in-from-right duration-200">
          <DialogPrimitive.Title className="sr-only">{p.titulo}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{p.rotulo} {p.posicao} de {p.total}</DialogPrimitive.Description>
          <DetailPanel {...p} className="h-full" />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
