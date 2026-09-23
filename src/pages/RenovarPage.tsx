import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, LockKey } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getBilling, type Billing } from "@/api/routes/get-billing";
import { actionToast } from "@/lib/action-toast";

/**
 * Destino de todo 402 (acesso vencido). Cobrança é PIX manual: o admin confere
 * o comprovante e libera pelo painel — aqui só se mostra valor e chave.
 */
const RenovarPage = () => {
  const [billing, setBilling] = useState<Billing | null>(null);

  useEffect(() => {
    getBilling().then(setBilling).catch(() => setBilling({ pixKey: null, price: null }));
  }, []);

  const copy = async () => {
    if (!billing?.pixKey) return;
    try {
      await navigator.clipboard.writeText(billing.pixKey);
      actionToast.success({ title: "Chave PIX copiada" });
    } catch {
      /* clipboard é best-effort; a chave continua visível */
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <EmptyState
        bare
        icon={<LockKey size={34} />}
        title="Seu acesso venceu"
        description="Pague pelo PIX e mande o comprovante no Telegram. O acesso volta assim que for confirmado."
        action={
          <div className="flex flex-col items-center gap-4 w-full max-w-[340px]">
            {billing?.price != null && (
              <p className="text-3xl font-semibold tabular-nums">
                {billing.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                <span className="text-sm font-normal opacity-50"> /mês</span>
              </p>
            )}
            {billing?.pixKey && (
              <button
                type="button"
                onClick={copy}
                className="w-full flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-left hover:bg-foreground/[0.03]"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-[0.1em] opacity-45">Chave PIX</span>
                  <span className="block text-sm break-all">{billing.pixKey}</span>
                </span>
                <Copy size={18} className="shrink-0 opacity-60" />
              </button>
            )}
            <div className="flex gap-2">
              <Button asChild><Link to="/dashboard">Já foi liberado</Link></Button>
              <Button asChild variant="outline"><Link to="/logout">Sair</Link></Button>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default RenovarPage;
