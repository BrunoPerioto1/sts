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
            <p className="text-xs font-medium uppercase tracking-wider text-muted">{eyebrow}</p>
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

/** Cabeçalho de coluna no padrão das tabelas do admin. */
export const COLUMN_HEAD = "text-[11px] font-medium uppercase tracking-wider text-muted";
