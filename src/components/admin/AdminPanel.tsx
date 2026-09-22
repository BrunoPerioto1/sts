import { cn } from "@/lib/utils";

/**
 * Moldura das telas de admin: cabeçalho (rótulo, título, explicação, ações),
 * filtros e o corpo. Casas, usuários e pipeline usam a mesma — só muda o miolo.
 */
export function AdminPanel({
  eyebrow,
  title,
  description,
  actions,
  filters,
  footer,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.12em] opacity-45">{eyebrow}</p>
            <h2 className="text-2xl font-semibold tracking-tight mt-1">{title}</h2>
            {description && <div className="text-sm opacity-55 mt-2 leading-relaxed">{description}</div>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
        {filters && <div className="flex flex-wrap gap-2">{filters}</div>}
      </div>

      <div className="border-t border-border">{children}</div>

      {footer && (
        <div className="px-4 sm:px-6 py-3.5 border-t border-border flex items-center justify-between gap-3 text-sm">
          {footer}
        </div>
      )}
    </section>
  );
}

export function FilterChip({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-accent/60 bg-accent/10 text-foreground"
          : "border-border opacity-70 hover:opacity-100",
      )}
    >
      {children}
      {count !== undefined && <span className="text-xs tabular-nums opacity-55">{count}</span>}
    </button>
  );
}

/** Cabeçalho de coluna no padrão das tabelas do admin. */
export const COLUMN_HEAD = "text-[11px] uppercase tracking-[0.1em] opacity-40";
