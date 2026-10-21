import { cn } from "@/lib/utils";

/**
 * O ícone da marca: o bilhete branco com o check sobre o azul. `square` é o
 * public/favicon.svg (bilhete 15% maior, pra ler em tamanho pequeno); `circle`
 * é a foto do bot no Telegram (o icon.svg recortado em círculo).
 *
 * Fica fora do Logo.tsx de propósito: o app (barra lateral, login) usa só o
 * ícone e não deve baixar a fonte do wordmark que o Logo importa.
 */
export function LogoIcon({ shape = "square", className }: { shape?: "square" | "circle"; className?: string }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden className={cn("flex-none", className)}>
      {shape === "circle" ? (
        <circle cx="48" cy="48" r="48" className="fill-brand-primary" />
      ) : (
        <rect width="96" height="96" rx="22" className="fill-brand-primary" />
      )}
      <g transform={`translate(48 48) scale(${shape === "circle" ? 1.05 : 1.15}) translate(-48 -48)`}>
        <path d="M24 28H72Q78 28 78 34V42A6 6 0 0 0 78 54V62Q78 68 72 68H24Q18 68 18 62V54A6 6 0 0 0 18 42V34Q18 28 24 28Z" fill="#fff" />
        <polyline
          points="38,48 46,56 60,41"
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-brand-primary"
        />
      </g>
    </svg>
  );
}
