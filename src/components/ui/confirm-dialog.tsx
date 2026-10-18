import type { ReactNode } from "react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** Não fecha sozinho: quem chama fecha (na hora ou quando a ação termina). */
  onConfirm: () => void;
  /** Apaga ou corta acesso: botão vermelho. */
  destructive?: boolean;
  /** Ação rodando: trava os botões e o fechar. */
  pending?: boolean;
  /** Confirmar ainda não vale (falta a senha, por exemplo). */
  confirmDisabled?: boolean;
  /** Saída mais branda que confirmar ("Desmarcar Coleta" em vez de excluir). */
  alternative?: { label: string; onClick: () => void };
  /** Campo extra embaixo do texto, como a senha de excluir a conta. */
  children?: ReactNode;
}

/**
 * Confirmação de ação séria, igual em todo o app: no celular sobe de baixo,
 * na altura do polegar, com os botões empilhados; no desktop é o diálogo
 * central. Antes cada tela escolhia um, e o celular tinha os dois.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive,
  pending,
  confirmDisabled,
  alternative,
  children,
}: ConfirmDialogProps) {
  const isMobile = useIsMobile();
  const change = (next: boolean) => !pending && onOpenChange(next);
  const blocked = pending || confirmDisabled;

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={change}
        title={title}
        footer={
          <div className="flex flex-col gap-2">
            <Button
              variant={destructive ? "destructive" : "primary"}
              className="w-full min-h-[48px] text-base"
              disabled={blocked}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
            {alternative && (
              <Button variant="secondary" className="w-full min-h-[44px]" disabled={pending} onClick={alternative.onClick}>
                {alternative.label}
              </Button>
            )}
            <Button variant="ghost" className="w-full min-h-[44px]" disabled={pending} onClick={() => change(false)}>
              Cancelar
            </Button>
          </div>
        }
      >
        <div className="pb-4 flex flex-col gap-3">
          <p className="text-sm text-zinc-400">{description}</p>
          {children}
        </div>
      </BottomSheet>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={change}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          {alternative && (
            <Button variant="secondary" className="sm:mr-auto" disabled={pending} onClick={alternative.onClick}>
              {alternative.label}
            </Button>
          )}
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          {/* Button e não AlertDialogAction: a Action fecha no clique, e a
              ação assíncrona precisa do diálogo aberto até terminar. */}
          <Button
            disabled={blocked}
            onClick={onConfirm}
            className={cn(destructive && "bg-danger text-white hover:bg-danger/90")}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
