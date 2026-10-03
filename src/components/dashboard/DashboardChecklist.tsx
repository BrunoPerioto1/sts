import { Link } from "react-router-dom";
import { CheckCircle, Circle, CaretRight } from "@phosphor-icons/react";
import { useMe } from "@/hooks/queries/use-me";
import { useHouseBalances } from "@/hooks/queries/use-houses";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  hint: string;
  href: string;
  done: boolean;
}

/**
 * Estado vazio do dashboard: em vez de "nenhuma aposta", os passos que levam
 * até a primeira métrica. Cada passo sabe se já foi feito pelos dados que o
 * app já tem (/users/me e saldos das casas).
 */
export function DashboardChecklist() {
  const { me } = useMe();
  const { data: balances } = useHouseBalances();

  const steps: Step[] = [
    {
      label: "Vincular o Telegram",
      hint: "Tips chegam no privado e viram aposta com um toque.",
      href: "/profile/telegram",
      done: !!me?.telegramUserId,
    },
    {
      label: "Definir a banca",
      hint: "A stake recomendada e as unidades saem dela.",
      href: "/profile/preferences",
      done: Number(me?.stake ?? 0) > 0,
    },
    {
      label: "Registrar um depósito numa casa",
      hint: "É o que faz o saldo e a banca acumulada baterem.",
      href: "/houses",
      done: (balances ?? []).some((h) => Number(h.totalDeposit) > 0),
    },
    {
      label: "Planilhar a primeira aposta",
      hint: "Por aqui, por print ou pelo botão Planilhar do bot.",
      href: "/bets",
      done: false,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="mx-auto max-w-lg rounded-xl border border-foreground/[0.07] bg-foreground/[0.015] p-5 animate-fade-in">
      <p className="text-[11px] uppercase tracking-wide text-zinc-400">Primeiros passos · {doneCount} de {steps.length}</p>
      <h3 className="mt-1 text-lg font-semibold">Seu dashboard aparece com a primeira aposta</h3>
      <ol className="mt-4 space-y-1">
        {steps.map((step) => (
          <li key={step.href}>
            <Link
              to={step.href}
              className={cn(
                "press flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-foreground/[0.04] transition-colors",
                step.done && "opacity-55",
              )}
            >
              {step.done ? (
                <CheckCircle size={20} weight="fill" className="shrink-0 text-positive" aria-label="feito" />
              ) : (
                <Circle size={20} className="shrink-0 text-zinc-500" aria-label="pendente" />
              )}
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm font-medium", step.done && "line-through")}>{step.label}</span>
                <span className="block text-xs text-zinc-400">{step.hint}</span>
              </span>
              {!step.done && <CaretRight size={14} className="shrink-0 text-zinc-500" />}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
