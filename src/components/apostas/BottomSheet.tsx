import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Sheets empilhados (aberto de dentro de outro sheet) usam Drawer.NestedRoot
  // do vaul — preserva o sheet pai aberto por baixo, sem perder o rascunho.
  nested?: boolean;
  title: React.ReactNode;
  titleExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  nested = false,
  title,
  titleExtra,
  footer,
  children,
  contentClassName,
}: BottomSheetProps) {
  const Root = nested ? DrawerPrimitive.NestedRoot : DrawerPrimitive.Root;

  return (
    // handleOnly: sem isso o vaul trata o conteúdo inteiro como área de
    // arrastar-pra-fechar, e no touch isso "come" o tap do botão de fechar
    // (e de qualquer outro controle perto do topo). Com handleOnly, só o
    // <Drawer.Handle> abaixo dispara o gesto de arrastar.
    <Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={!nested} handleOnly>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-2xl border-t border-white/10 bg-background outline-none",
            contentClassName
          )}
        >
          <DrawerPrimitive.Handle className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-white/15" />

          <div className="flex items-center justify-between gap-2 pl-4 pr-2 pb-3 pt-3">
            <div className="flex items-center gap-2 min-w-0">
              <DrawerPrimitive.Title className="text-[17px] font-semibold truncate">
                {title}
              </DrawerPrimitive.Title>
              {titleExtra}
            </div>
            <DrawerPrimitive.Close
              onClick={() => onOpenChange(false)}
              aria-label="Fechar"
              className="h-11 w-11 -mr-1 flex items-center justify-center text-zinc-400 hover:text-white shrink-0"
            >
              <X size={18} />
            </DrawerPrimitive.Close>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4">{children}</div>

          {footer && (
            <div
              className="shrink-0 border-t border-white/10 px-4 pt-3 bg-background"
              style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
            >
              {footer}
            </div>
          )}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </Root>
  );
}
