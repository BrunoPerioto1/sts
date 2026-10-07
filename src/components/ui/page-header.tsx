import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CaretLeft } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  /** Linha de contexto embaixo do título. Contagem mora aqui, nunca ao lado do
   *  título: "201 casas · catálogo compartilhado". */
  subtitle?: ReactNode;
  /** Botões à direita (Button variant="icon", "Nova" etc.). */
  actions?: ReactNode;
  /**
   * Voltar: rota fixa, callback, ou `true` pra voltar no histórico. Com
   * voltar o título fica menor — é tela empilhada; sem, é tela raiz (aba).
   */
  back?: string | (() => void) | true;
  className?: string;
}

const backClass = "press -ml-2 h-11 w-11 shrink-0 flex items-center justify-center text-zinc-400 hover:text-foreground";

/**
 * Cabeçalho mobile das telas (entra no `mobileHeader` do MainLayout). Sem
 * divisória embaixo — o respiro separa o header do conteúdo.
 *
 * Busca: quando é a ação principal da tela (Tips, Casas, catálogo), vai como
 * <SearchField> aberto logo abaixo do header, no corpo. Nas demais, um
 * <Button variant="icon"> em `actions` que expande o campo.
 */
export function PageHeader({ title, subtitle, actions, back, className }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className={cn("flex items-center gap-2 min-h-11", className)}>
      {back !== undefined &&
        (typeof back === "string" ? (
          <Link to={back} aria-label="Voltar" className={backClass}>
            <CaretLeft size={20} />
          </Link>
        ) : (
          <button type="button" onClick={back === true ? () => navigate(-1) : back} aria-label="Voltar" className={backClass}>
            <CaretLeft size={20} />
          </button>
        ))}
      <div className="min-w-0 flex-1">
        <h1 className={cn("font-semibold tracking-tight truncate", back !== undefined ? "text-lg leading-tight" : "text-2xl leading-tight")}>
          {title}
        </h1>
        {subtitle && (
          <p className={cn("mt-0.5 text-zinc-500 truncate", back !== undefined ? "text-xs" : "text-sm")}>{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
