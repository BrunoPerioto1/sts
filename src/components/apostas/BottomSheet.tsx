import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useKeyboardInset } from "@/hooks/use-keyboard-inset";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Sheets empilhados (aberto de dentro de outro sheet) usam Drawer.NestedRoot
  // do vaul — preserva o sheet pai aberto por baixo, sem perder o rascunho.
  nested?: boolean;
  title: React.ReactNode;
  titleExtra?: React.ReactNode;
  // Faixa fixa logo abaixo do titulo, FORA da area rolavel — pra busca/filtro
  // que precisa ficar parado enquanto a lista rola por baixo.
  subHeader?: React.ReactNode;
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
  subHeader,
  footer,
  children,
  contentClassName,
}: BottomSheetProps) {
  const Root = nested ? DrawerPrimitive.NestedRoot : DrawerPrimitive.Root;
  // Levanta a sheet acima do teclado. Sem isso ela fica ancorada no fundo do
  // layout viewport, que no iOS nao encolhe — o teclado cobria o campo em foco
  // e o resultado da busca. Nao usa `transform` de proposito: o vaul controla o
  // transform do Content pro gesto de arrastar, e mexer nele brigaria com ele.
  const keyboardInset = useKeyboardInset();

  return (
    // handleOnly: sem isso o vaul trata o conteúdo inteiro como área de
    // arrastar-pra-fechar, e no touch isso "come" o tap do botão de fechar
    // (e de qualquer outro controle perto do topo). Com handleOnly, só o
    // <Drawer.Handle> abaixo dispara o gesto de arrastar.
    // repositionInputs desligado: o vaul tenta reposicionar o drawer via JS
    // (bottom/height inline) quando um input recebe foco, mas isso conflita
    // com o max-h-[88dvh] abaixo — o resultado era o teclado abrindo e o
    // sheet "rasgando" do rodapé, com uma área preta enorme no meio. Como o
    // corpo do sheet já é rolável (overflow-y-auto), o scroll nativo do
    // browser já resolve o input saindo de trás do teclado sem essa lógica.
    <Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={!nested} handleOnly repositionInputs={false}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-2xl border-t border-white/10 bg-background outline-none",
            contentClassName
          )}
          style={
            keyboardInset
              ? {
                  bottom: keyboardInset,
                  // Com a sheet levantada, o teto de 88dvh deixaria de caber:
                  // limita pelo espaco que sobrou acima do teclado.
                  maxHeight: `calc((100dvh - ${keyboardInset}px) * 0.92)`,
                }
              : undefined
          }
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

          {subHeader && <div className="shrink-0 px-4 pb-2">{subHeader}</div>}

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-pb-16 px-4">{children}</div>

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
