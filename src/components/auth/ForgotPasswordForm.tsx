import { useEffect, useState } from "react";
import { ArrowLeft, EnvelopeSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { AuthField } from "./AuthField";
import { AuthHeading } from "./AuthHeading";
import { postForgotPassword } from "@/api/routes/post-login";
import { getErrorMessage } from "@/lib/api-error";
import { formatCountdown } from "@/lib/format";

// O backend gera no máximo um link por minuto por conta (RESEND_AFTER_MS no
// PasswordResetService) e, antes disso, responde "enviado" sem mandar nada.
// A tela espera o mesmo minuto pra "Pedir de novo" não prometer um link que
// não sai.
const RESEND_AFTER_MS = 60_000;

interface ForgotPasswordFormProps {
  initialEmail?: string;
  onBack: () => void;
}

/**
 * Recuperar senha por link: o backend manda por e-mail e, pra quem vinculou o
 * Telegram, também no bot. A resposta é a mesma exista ou não a conta, então
 * a tela de "enviado" não afirma que o e-mail está cadastrado.
 */
export function ForgotPasswordForm({ initialEmail = "", onBack }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<"email" | "sent">("email");
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Um tique por segundo só enquanto falta tempo pra pedir de novo.
  const resendInMs = sentAt ? sentAt + RESEND_AFTER_MS - now : 0;
  useEffect(() => {
    if (!sentAt) return;
    const t = setInterval(() => {
      const at = Date.now();
      setNow(at);
      if (at >= sentAt + RESEND_AFTER_MS) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [sentAt]);

  const requestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Informe o e-mail da conta.");
    setBusy(true);
    setError(null);
    try {
      await postForgotPassword(email.trim());
      const at = Date.now();
      setSentAt(at);
      setNow(at);
      setStep("sent");
    } catch (err) {
      setError(getErrorMessage(err, "Não deu pra pedir o link agora. Tente de novo."));
    } finally {
      setBusy(false);
    }
  };

  if (step === "sent") {
    return (
      <div className="flex flex-col gap-[18px] lg:gap-4">
        <AuthHeading
          title="Confira seu e-mail"
          sub="Se o e-mail estiver cadastrado, você vai receber um link pra redefinir a senha. Ele vale 30 minutos."
        />
        <p className="text-sm text-zinc-400">
          Quem tem o Telegram vinculado recebe o mesmo link no bot. Não achou? Olhe também a caixa de spam.
        </p>
        <Button
          type="button"
          onClick={onBack}
          className="w-full h-12 lg:h-10 mt-1.5 lg:mt-1 rounded-[10px] lg:rounded-[8px] text-[15px] lg:text-sm font-semibold"
        >
          Voltar pro login
        </Button>
        <p className="text-center text-sm text-zinc-500">
          Não chegou?{" "}
          {resendInMs > 0 ? (
            <span className="tabular-nums">Pedir de novo em {formatCountdown(resendInMs)}</span>
          ) : (
            <button type="button" onClick={() => setStep("email")} className="text-accent underline underline-offset-4 hover:no-underline">
              Pedir de novo
            </button>
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={requestLink} className="flex flex-col gap-[18px] lg:gap-4">
      <AuthHeading title="Esqueci a senha" sub="Mandamos um link pro seu e-mail pra você escolher uma senha nova." />

      <AuthField
        id="forgot-email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => {
          setError(null);
          setEmail(e.target.value);
        }}
        error={error}
        required
      />

      <Button type="submit" className="w-full h-12 lg:h-10 mt-1.5 lg:mt-1 rounded-[10px] lg:rounded-[8px] text-[15px] lg:text-sm font-semibold gap-2" loading={busy}>
        {busy ? (
          "Enviando link…"
        ) : (
          <>
            <EnvelopeSimple size={18} /> Mandar link
          </>
        )}
      </Button>

      <p className="text-center text-sm text-zinc-500">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-accent underline underline-offset-4 hover:no-underline">
          <ArrowLeft size={14} /> Voltar pro login
        </button>
      </p>
    </form>
  );
}
