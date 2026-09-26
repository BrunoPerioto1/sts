import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { CheckCircle, Copy, LockKey, LockKeyOpen } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getBilling, postPaymentClaim, type Billing } from "@/api/routes/get-billing";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { getAccessBlock } from "@/lib/auth-session";
import { formatTime } from "@/lib/format";

/**
 * Destino de todo 402 (acesso vencido ou conta nova sem ativar). Cobrança é
 * PIX manual: o admin confere e libera pelo painel. O payToken que veio no 402
 * traz o PIX copia-e-cola desta conta (valor + identificador) e o "Já paguei".
 */
const RenovarPage = () => {
  const block = getAccessBlock();
  const token = block?.payToken;
  const [billing, setBilling] = useState<Billing | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    getBilling(token)
      .then(setBilling)
      .catch(() => setBilling({ pixKey: null, price: null }));
  }, [token]);

  useEffect(() => {
    if (!billing?.pixCode) return;
    QRCode.toDataURL(billing.pixCode, { margin: 1, width: 220 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [billing?.pixCode]);

  const status = billing?.status ?? block?.status ?? "expired";
  const isNew = status === "new";

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      actionToast.success({ title: `${label} copiado` });
    } catch {
      /* clipboard é best-effort; o texto continua visível */
    }
  };

  const claim = async () => {
    if (!token) return;
    setClaiming(true);
    try {
      await postPaymentClaim(token);
      setBilling((prev) => (prev ? { ...prev, paymentClaimedAt: new Date().toISOString() } : prev));
      actionToast.success({
        title: "Administrador avisado",
        description: "O acesso volta assim que ele conferir o pagamento.",
        duration: 3500,
      });
    } catch (err) {
      actionToast.error({ description: getErrorMessage(err, "Não deu pra avisar agora. Tente de novo.") });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10">
      <EmptyState
        bare
        icon={isNew ? <LockKeyOpen size={34} /> : <LockKey size={34} />}
        title={isNew ? "Ative sua conta" : "Seu acesso venceu"}
        description={
          isNew
            ? "Sua conta foi criada. Pague pelo PIX pra começar — a liberação sai assim que o pagamento for confirmado."
            : "Pague pelo PIX. O acesso volta assim que o pagamento for confirmado."
        }
        action={
          <div className="flex flex-col items-center gap-4 w-full max-w-[340px]">
            {billing?.price != null && (
              <p className="text-3xl font-semibold tabular-nums">
                {billing.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                <span className="text-sm font-normal opacity-50"> /mês</span>
              </p>
            )}

            {/* Celular paga com o copia-e-cola; no computador, o QR se lê com
                o app do banco. Os dois já levam valor e identificador. */}
            {qr && (
              <img src={qr} alt="QR Code do PIX" width={220} height={220} className="hidden sm:block rounded-lg bg-white p-2" />
            )}
            {billing?.pixCode && (
              <Button className="w-full gap-2" onClick={() => copy(billing.pixCode as string, "PIX copia e cola")}>
                <Copy size={18} /> Copiar PIX copia e cola
              </Button>
            )}
            {billing?.pixKey && (
              <button
                type="button"
                onClick={() => copy(billing.pixKey as string, "Chave PIX")}
                className="w-full flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-left hover:bg-foreground/[0.03]"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-[0.1em] opacity-45">Chave PIX</span>
                  <span className="block text-sm break-all">{billing.pixKey}</span>
                  {billing.txid && (
                    <span className="block text-xs opacity-55 mt-0.5">Identificador: {billing.txid}</span>
                  )}
                </span>
                <Copy size={18} className="shrink-0 opacity-60" />
              </button>
            )}

            {token &&
              (billing?.paymentClaimedAt ? (
                <p className="flex items-center gap-2 text-sm text-positive">
                  <CheckCircle size={16} weight="fill" />
                  Você avisou às {formatTime(billing.paymentClaimedAt)}. É só aguardar a liberação.
                </p>
              ) : (
                <Button variant="outline" className="w-full" disabled={claiming} onClick={claim}>
                  {claiming ? "Avisando…" : "Já paguei"}
                </Button>
              ))}

            <div className="flex gap-2">
              <Button asChild variant="ghost"><Link to="/dashboard">Já foi liberado</Link></Button>
              <Button asChild variant="ghost"><Link to="/logout">Sair</Link></Button>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default RenovarPage;
