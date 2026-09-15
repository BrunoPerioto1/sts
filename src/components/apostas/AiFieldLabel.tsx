import { Sparkles } from "lucide-react";
import { type AiFieldMark } from "@/hooks/apostas/use-aposta-form";
import { cn } from "@/lib/utils";

const badge =
  "inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold leading-4 ring-1 ring-inset";

interface AiFieldLabelProps {
  children: React.ReactNode;
  mark?: AiFieldMark;
  htmlFor?: string;
  className?: string;
}

/**
 * Rótulo de campo com a procedência da leitura: selo "IA" no que o print
 * preencheu, "confira" em amarelo no que ela leu com dúvida. Some sozinho
 * quando o usuário digita por cima (o hook limpa a marca).
 */
export function AiFieldLabel({ children, mark, htmlFor, className }: AiFieldLabelProps) {
  const Tag = htmlFor ? "label" : "span";
  return (
    <div className="flex items-center gap-1.5">
      <Tag htmlFor={htmlFor} className={cn("text-xs", className)}>
        {children}
      </Tag>
      {mark?.filled &&
        (mark.check ? (
          <span className={cn(badge, "bg-amber-400/10 text-amber-400 ring-amber-400/25")}>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            confira
          </span>
        ) : (
          <span className={cn(badge, "bg-accent/15 text-accent-text ring-accent/30")}>
            <Sparkles className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
            IA
          </span>
        ))}
    </div>
  );
}
