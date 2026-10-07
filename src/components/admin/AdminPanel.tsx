import { Link } from "react-router-dom";
import { ArrowLeft, MagnifyingGlass } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
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

/** Mobile: voltar pro Perfil (é de lá que o admin entra), título e uma linha de contexto. */
export function AdminMobileHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 -ml-2 min-h-9">
      <Link to="/profile" aria-label="Voltar" className="press w-9 h-9 shrink-0 flex items-center justify-center">
        <ArrowLeft size={18} />
      </Link>
      <div className="min-w-0">
        <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-[11.5px] text-zinc-500 truncate">{subtitle}</p>}
      </div>
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}

/** Mobile: busca grande, no padrão das listas do app. */
export function MobileSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl pl-9"
      />
    </div>
  );
}

/** Mobile: filtros numa faixa só, que rola de lado em vez de quebrar em 2–3 linhas. */
export function MobileChips({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] -mx-4 px-4">{children}</div>;
}

export function MobileChip({
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
        "shrink-0 h-[34px] px-3 rounded-full border flex items-center gap-1.5 text-[13px] whitespace-nowrap transition-colors",
        active ? "border-accent bg-accent/15 text-foreground" : "border-border text-zinc-400",
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn("text-[11.5px] tabular-nums", active ? "text-accent-text" : "text-zinc-500")}>{count}</span>
      )}
    </button>
  );
}

/** Cabeçalho de coluna no padrão das tabelas do admin. */
export const COLUMN_HEAD = "text-[11px] uppercase tracking-[0.1em] opacity-40";
