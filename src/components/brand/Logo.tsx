import { cn } from "@/lib/utils";
import { LogoIcon } from "./LogoIcon";
import "./display-font.css";

type LogoSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

/**
 * Tamanhos: `md` é o do cabeçalho (cresce do sm pra cima); `lg`, o do topo do
 * login; `xl`, o do rodapé; `2xl` e `3xl` são pra peças de destaque, e só eles
 * têm tagline. O ícone é ~1,6× a altura do texto, a proporção do quadro da marca.
 */
const SIZES: Record<LogoSize, { icon: string; text: string; gap: string; tagline?: string }> = {
  sm: { icon: "h-7 w-7", text: "text-[18px]", gap: "gap-2" },
  md: { icon: "h-7 w-7 sm:h-9 sm:w-9", text: "text-[18px] sm:text-[23px]", gap: "gap-2 sm:gap-2.5" },
  // 36/23: com 40/26 o nome competia com o título "Entrar" logo abaixo.
  lg: { icon: "h-9 w-9", text: "text-[23px]", gap: "gap-2.5" },
  // Rodapé: um degrau acima do cabeçalho, é o fecho da página e tem espaço sobrando.
  xl: { icon: "h-11 w-11", text: "text-[28px]", gap: "gap-3" },
  "2xl": { icon: "h-14 w-14", text: "text-[38px]", gap: "gap-3.5", tagline: "mt-1.5 text-[11px] tracking-[0.32em]" },
  "3xl": { icon: "h-24 w-24", text: "text-[68px]", gap: "gap-5", tagline: "mt-2.5 text-[15px] tracking-[0.36em]" },
};

/**
 * Logo do Trackton. `icon`: só o ícone; `wordmark`: ícone + nome; `full`: ícone,
 * nome e a tagline, que só aparece no `2xl` e no `3xl` (nos menores ela vira
 * `wordmark`, então nunca entra no cabeçalho). O nome usa a fonte dos títulos
 * da landing, no peso mais forte.
 */
export function Logo({
  variant = "wordmark",
  size = "md",
  className,
}: {
  variant?: "icon" | "wordmark" | "full";
  size?: LogoSize;
  className?: string;
}) {
  const s = SIZES[size];
  if (variant === "icon") {
    return (
      <span className={cn("inline-flex", className)}>
        <LogoIcon className={s.icon} />
        <span className="sr-only">Trackton</span>
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center", s.gap, className)}>
      <LogoIcon className={s.icon} />
      <span className="flex flex-col">
        <span className={cn("whitespace-nowrap font-display font-extrabold leading-none tracking-[-0.025em] [font-stretch:115%]", s.text)}>
          Trackton
        </span>
        {variant === "full" && s.tagline && (
          <span className={cn("whitespace-nowrap font-medium uppercase leading-none text-brand-muted", s.tagline)}>Sua aposta no controle</span>
        )}
      </span>
    </span>
  );
}
