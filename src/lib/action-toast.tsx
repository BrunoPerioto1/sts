import type { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";
import { Check, CheckCircle, ArrowCounterClockwise, Trash, Copy, Warning, X, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export { Check, CheckCircle, ArrowCounterClockwise, Trash, Copy };

type ActionToastIcon = PhosphorIcon;

interface ActionToastAction {
  label: string;
  onClick: () => void;
}

interface ActionToastSuccessOptions {
  title: ReactNode;
  description?: ReactNode;
  action?: ActionToastAction;
  icon?: ActionToastIcon;
  /** Texto longo precisa de mais tempo que o padrão de 1.5s. */
  duration?: number;
}

interface ActionToastErrorOptions {
  description: ReactNode;
  title?: ReactNode;
}

const SUCCESS_DURATION = 1500;
const SUCCESS_WITH_ACTION_DURATION = 3000;
const ERROR_DURATION = 2400;

function ActionToastCard({
  variant,
  icon: Icon,
  title,
  description,
  action,
  onClose,
}: {
  variant: "success" | "error";
  icon: ActionToastIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ActionToastAction;
  onClose: () => void;
}) {
  const isError = variant === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "relative flex w-full items-start gap-2.5 overflow-hidden rounded-[14px] border py-3 pl-4 pr-3 sm:w-[380px] sm:rounded-xl",
        isError ? "bg-card border-negative/30" : "bg-card border-foreground/15"
      )}
      style={{ boxShadow: "var(--shadow-lg)" }}
    >
      <span
        className={cn("absolute left-0 top-3.5 bottom-3.5 w-0.5 rounded-full", isError ? "bg-negative" : "bg-foreground")}
      />
      <span
        className={cn(
          "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] sm:h-7 sm:w-7 sm:rounded-lg",
          isError ? "bg-negative/15" : "bg-foreground/[0.09]"
        )}
      >
        <Icon size={16} weight="bold" className={cn("sm:!w-[15px] sm:!h-[15px]", isError ? "text-negative" : "text-foreground")} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={cn("text-sm font-medium leading-tight sm:text-sm", isError ? "text-negative" : "text-foreground")}>
          {title}
        </p>
        {description && (
          <p
            className={cn(
              "mt-0.5 text-sm leading-snug sm:text-sm",
              isError ? "text-foreground/60" : "text-foreground/50"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && (
        <button
          type="button"
          onClick={() => {
            onClose();
            action.onClick();
          }}
          className="h-9 shrink-0 self-center rounded-lg border border-foreground/20 bg-transparent px-3 text-sm font-medium text-foreground/90 transition-colors hover:bg-foreground/[0.06] sm:h-7"
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="mt-0.5 shrink-0 self-start p-1 text-foreground/40 transition-colors hover:text-foreground/70"
      >
        <X size={16} className="sm:!w-3.5 sm:!h-3.5" />
      </button>
    </div>
  );
}

export const actionToast = {
  success({ title, description, action, icon = CheckCircle, duration }: ActionToastSuccessOptions) {
    return sonnerToast.custom(
      (id) => (
        <ActionToastCard
          variant="success"
          icon={icon}
          title={title}
          description={description}
          action={action}
          onClose={() => sonnerToast.dismiss(id)}
        />
      ),
      { duration: duration ?? (action ? SUCCESS_WITH_ACTION_DURATION : SUCCESS_DURATION) }
    );
  },
  error({ title = "Erro", description }: ActionToastErrorOptions) {
    return sonnerToast.custom(
      (id) => (
        <ActionToastCard variant="error" icon={Warning} title={title} description={description} onClose={() => sonnerToast.dismiss(id)} />
      ),
      { duration: ERROR_DURATION }
    );
  },
};
