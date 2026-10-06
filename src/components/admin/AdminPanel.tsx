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
      {/* Compacto: a tabela é o conteúdo, o topo só orienta. */}
      <div className="px-4 py-3.5 sm:px-6 sm:py-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.12em] opacity-45">{eyebrow}</p>
            <h2 className="text-xl font-semibold tracking-tight mt-0.5">{title}</h2>
            {/* Cor e não opacity: filho com cor própria (alerta, Tudo OK) não apaga junto. */}
            {description && <div className="text-sm text-foreground/55 mt-1 leading-relaxed">{description}</div>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
        {filters && <div className="flex flex-wrap items-center gap-1.5">{filters}</div>}
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
      // Filtro de navegação, não botão: só o selecionado tem fundo.
      className={cn(
        "flex items-center gap-1.5 h-8 rounded-md px-2.5 text-sm transition-colors",
        active
          ? "bg-foreground/[0.09] text-foreground font-medium"
          : "opacity-60 hover:opacity-100 hover:bg-foreground/[0.04]",
      )}
    >
      {children}
      {count !== undefined && <span className="text-xs tabular-nums opacity-50">{count}</span>}
    </button>
  );
}

/** Cabeçalho de coluna no padrão das tabelas do admin. */
export const COLUMN_HEAD = "text-[11px] uppercase tracking-[0.1em] opacity-40";
