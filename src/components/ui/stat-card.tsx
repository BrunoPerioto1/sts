import type { CSSProperties, ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { signColor } from "@/lib/format";

interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Linha pequena embaixo do valor ("12 ganhas", "de 40 resolvidas"). */
  hint?: ReactNode;
  icon?: Icon;
  /** Pinta o valor pelo sinal (signColor): verde, vermelho ou neutro. */
  signed?: number | null;
  /** Cor explícita do valor — o dashboard passa a performanceColor, que
   *  respeita "cores desligadas". Vence `signed`. */
  color?: string;
  /**
   * `card`: bloco com borda próprio (grade de KPIs do Dashboard).
   * `plain`: só o conteúdo, pra grade dentro de outro card (Perfil, Casas).
   */
  variant?: "card" | "plain";
  /** Ocupa duas colunas da grade (KPI que sobra sozinho na última linha). */
  wide?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Número com rótulo — o mesmo bloco no Dashboard, no Perfil e em Casas. */
export function StatCard({ label, value, hint, icon: IconComponent, signed, color, variant = "plain", wide, className, style }: StatCardProps) {
  const valueClass = color ? undefined : signed !== undefined ? signColor(signed) : undefined;
  const card = variant === "card";
  return (
    <div
      className={cn(
        "min-w-0",
        // Card: ícone pequeno na linha do rótulo e valor sem quebra. Ícone de
        // 36px em caixa deixava ~98px pro valor em 390; "+R$ 5.315,99" quebrava
        // e, com auto-rows-fr, esticava todas as linhas da grade.
        card && "flex items-start gap-2.5 rounded-xl border border-foreground/[0.07] bg-foreground/[0.015] shadow-card px-3.5 py-3",
        wide && "col-span-2",
        className,
      )}
      style={style}
    >
      {IconComponent && (
        <span className={cn("flex shrink-0 items-center justify-center text-zinc-400", card ? "h-4 w-4 mt-px" : "h-9 w-9 rounded-xl bg-foreground/[0.04] max-[359px]:h-7 max-[359px]:w-7")} aria-hidden="true">
          <IconComponent size={card ? 16 : 21} />
        </span>
      )}
      <div className="min-w-0 space-y-0.5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted truncate">{label}</p>
        <p
          className={cn(
            "text-lg leading-tight font-semibold tracking-tight tabular-nums",
            card ? "whitespace-nowrap max-[399px]:text-base" : "break-words",
            valueClass,
          )}
          style={color ? { color } : undefined}
        >
          {value}
        </p>
        {hint && <p className="text-[11px] text-zinc-500 tabular-nums truncate">{hint}</p>}
      </div>
    </div>
  );
}
