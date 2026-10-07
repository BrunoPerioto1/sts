import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CaretRight, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { SectionLabel } from "@/components/ui/section-label";

/**
 * Card agrupado com divisórias entre as linhas (padrão do Perfil). Com
 * `title`, leva o <SectionLabel> em cima.
 */
export function ListGroup({
  title,
  count,
  titleIcon,
  titleAction,
  children,
  className,
}: {
  title?: string;
  count?: number;
  titleIcon?: ReactNode;
  titleAction?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const card = (
    <div className={cn("rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border", !title && className)}>
      {children}
    </div>
  );
  if (!title) return card;
  return (
    <section className={cn("space-y-2", className)}>
      <SectionLabel count={count} icon={titleIcon} action={titleAction}>
        {title}
      </SectionLabel>
      {card}
    </section>
  );
}

/** Ícone da linha num quadrado tingido (azul por padrão; `neutral` pra admin). */
export function ListIcon({ icon: IconComponent, tone = "accent" }: { icon: Icon; tone?: "accent" | "neutral" }) {
  return (
    <span
      className={cn(
        "w-8 h-8 shrink-0 rounded-[9px] flex items-center justify-center",
        tone === "accent" ? "bg-accent/10 text-accent-text" : "bg-foreground/[0.08] text-zinc-300",
      )}
    >
      <IconComponent size={16} />
    </span>
  );
}

type RowBase = {
  /** Ícone (<ListIcon>) ou outro marcador à esquerda. */
  leading?: ReactNode;
  title: ReactNode;
  /** Uma linha só, truncada. Conteúdo extra (apelidos, contagens) vai aqui,
   *  separado por " · ", em vez de abrir uma linha nova — a altura não varia. */
  subtitle?: ReactNode;
  /** Valor, status ou ação à direita. Em linha clicável sem trailing, aparece
   *  o chevron; com trailing, passe `chevron` pra manter os dois. */
  trailing?: ReactNode;
  chevron?: boolean;
  /** Linha apagada (item inativo). */
  dimmed?: boolean;
  className?: string;
};

type RowProps = RowBase &
  (
    | { to: string; onClick?: never }
    | ({ to?: never; onClick?: () => void } & Omit<HTMLAttributes<HTMLElement>, "title" | "onClick">)
  );

const rowClass = "min-h-[60px] w-full px-3.5 py-2.5 flex items-center gap-3 text-left";

/**
 * Linha de lista: leading · título/subtítulo · trailing. Vira <Link> com `to`,
 * <button> com `onClick` e <div> sem nenhum dos dois. Atributos extras (ex.:
 * handlers de toque longo) passam direto pro elemento.
 */
export const ListRow = forwardRef<HTMLElement, RowProps>(function ListRow(props, ref) {
  const { leading, title, subtitle, trailing, chevron, dimmed, className, ...rest } = props;
  const interactive = "to" in rest && rest.to ? true : "onClick" in rest && !!rest.onClick;
  const showChevron = chevron ?? (interactive && trailing === undefined);

  const inner = (
    <>
      {leading}
      <span className={cn("flex-1 min-w-0", dimmed && "opacity-50")}>
        <span className="block text-sm font-medium text-foreground truncate">{title}</span>
        {subtitle && <span className="block text-xs text-zinc-500 truncate">{subtitle}</span>}
      </span>
      {trailing !== undefined && <span className="shrink-0 text-right">{trailing}</span>}
      {showChevron && <CaretRight size={13} className="shrink-0 text-zinc-600" />}
    </>
  );

  if ("to" in rest && rest.to) {
    const { to, ...linkRest } = rest;
    return (
      <Link ref={ref as React.Ref<HTMLAnchorElement>} to={to} className={cn("press", rowClass, "hover:bg-foreground/[0.03]", className)} {...linkRest}>
        {inner}
      </Link>
    );
  }
  const { onClick, ...elementRest } = rest as { onClick?: () => void } & HTMLAttributes<HTMLElement>;
  if (onClick) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        className={cn("press", rowClass, "hover:bg-foreground/[0.03]", className)}
        {...(elementRest as HTMLAttributes<HTMLButtonElement>)}
      >
        {inner}
      </button>
    );
  }
  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className={cn(rowClass, className)} {...(elementRest as HTMLAttributes<HTMLDivElement>)}>
      {inner}
    </div>
  );
});
