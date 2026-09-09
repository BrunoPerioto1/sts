import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";

interface HouseDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  houseName: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// Shell dos diálogos de casa (nova movimentação, histórico): 420px, título com
// o nome da casa ao lado e X no canto. Os dois usavam o Dialog genérico, cada
// um com um header diferente.
export function HouseDialog({ open, onClose, title, houseName, children, footer }: HouseDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card flex flex-col max-h-[calc(100dvh-4rem)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <div className="flex items-baseline gap-2 px-5 py-4 border-b border-border">
            <DialogPrimitive.Title className="text-base font-semibold">{title}</DialogPrimitive.Title>
            <span className="text-xs uppercase tracking-wide opacity-45 truncate">{houseName}</span>
            <DialogPrimitive.Close className="ml-auto opacity-50 hover:opacity-100 transition-opacity self-start" aria-label="Fechar">
              <X size={16} />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

          {footer && <div className="px-5 py-4 border-t border-border">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
