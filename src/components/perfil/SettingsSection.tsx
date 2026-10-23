import type { ReactNode } from "react";

/** Card do lado direito de cada seção de Configurações (desktop). */
export const SETTINGS_CARD = "rounded-xl border border-border bg-card";

/**
 * Linha de Configurações no desktop: título e explicação à esquerda, card à
 * direita, com um fio em cima separando da seção anterior e 24px de respiro
 * entre o fio e o card. Abaixo do lg o título sobe pra cima do card.
 */
export function SettingsSection({
  id,
  title,
  badge,
  description,
  children,
}: {
  id: string;
  title: string;
  badge?: ReactNode;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-x-10 gap-y-3 border-t border-border pt-6"
    >
      <div className="lg:pt-4">
        <h2 id={id} className="flex items-center gap-2 text-[15px] font-semibold">
          {title}
          {badge}
        </h2>
        <p className="text-[13px] text-zinc-400 mt-1.5">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Linha de ação dentro do card (Senha, Excluir conta): texto à esquerda, botão à direita. */
export function SettingsActionRow({
  title,
  description,
  action,
  danger,
}: {
  title: string;
  description: string;
  action: ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="flex-1 min-w-0">
        <p className={danger ? "text-sm font-medium text-danger" : "text-sm font-medium"}>{title}</p>
        <p className="text-[13px] text-zinc-400 mt-0.5">{description}</p>
      </div>
      {action}
    </div>
  );
}
