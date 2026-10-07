import type { ReactNode } from "react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "Nova casa" ao criar; "Editar casa" ao editar — o nome do item vai no
   *  corpo, não no título. */
  title: string;
  /** Envia o formulário. Com `formId`, o botão vira submit desse <form>. */
  onSubmit?: () => void;
  formId?: string;
  submitLabel?: string;
  submitting?: boolean;
  /** Texto do botão enquanto salva (padrão "Salvando…"). */
  submittingLabel?: string;
  submitDisabled?: boolean;
  /** Sheet aberto de dentro de outro sheet. */
  nested?: boolean;
  /** Algo além do Salvar no rodapé (ex.: um link discreto). Fica abaixo. */
  footerExtra?: ReactNode;
  children: ReactNode;
}

/**
 * Formulário em bottom sheet. Fechar é pelo X do cabeçalho (ou arrastando) —
 * sem "Cancelar" no rodapé, que só repetia o X. O rodapé é fixo, com Salvar
 * azul de largura total, e sobe junto com o teclado (o BottomSheet acompanha
 * o teclado), então nunca fica escondido atrás dele.
 */
export function FormSheet({
  open,
  onOpenChange,
  title,
  onSubmit,
  formId,
  submitLabel = "Salvar",
  submitting,
  submittingLabel = "Salvando…",
  submitDisabled,
  nested,
  footerExtra,
  children,
}: FormSheetProps) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      nested={nested}
      title={title}
      footer={
        <div className="space-y-1">
          <Button
            type={formId ? "submit" : "button"}
            form={formId}
            size="lg"
            className="w-full"
            disabled={submitting || submitDisabled}
            onClick={formId ? undefined : onSubmit}
          >
            {submitting ? submittingLabel : submitLabel}
          </Button>
          {footerExtra}
        </div>
      }
    >
      <div className="space-y-4 pb-4">{children}</div>
    </BottomSheet>
  );
}

/**
 * Campo com rótulo em cima e ajuda embaixo. O rótulo segue o SectionLabel
 * (caixa alta pequena); ajuda e erro em text-xs.
 */
export function FormField({
  label,
  help,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  help?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs leading-snug text-danger">{error}</p>
      ) : (
        help && <p className="text-xs leading-snug text-muted">{help}</p>
      )}
    </div>
  );
}
