import { useState } from "react";
import { ArrowLeft, CircleNotch, TelegramLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { AuthField } from "./AuthField";
import { postForgotPassword, postResetPassword } from "@/api/routes/post-login";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { MIN_PASSWORD } from "@/hooks/auth/use-register-form";

interface ForgotPasswordFormProps {
  initialEmail?: string;
  onBack: () => void;
}

/**
 * Recuperar senha pelo bot do Telegram: o app não manda e-mail, mas o bot
 * conhece quem vinculou a conta. Dois passos — pedir o código, depois código +
 * senha nova. A resposta do primeiro passo é a mesma exista ou não a conta.
 */
export function ForgotPasswordForm({ initialEmail = "", onBack }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Informe o e-mail da conta.");
    setBusy(true);
    setError(null);
    try {
      await postForgotPassword(email.trim());
      setStep("code");
    } catch (err) {
      setError(getErrorMessage(err, "Não deu pra pedir o código agora. Tente de novo."));
    } finally {
      setBusy(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) return setError("O código tem 6 dígitos.");
    if (password.length < MIN_PASSWORD) return setError(`Use ${MIN_PASSWORD} caracteres ou mais.`);
    setBusy(true);
    setError(null);
    try {
      await postResetPassword({ email: email.trim(), code: code.trim(), newPassword: password });
      actionToast.success({ title: "Senha trocada", description: "Entre com a senha nova." });
      onBack();
    } catch (err) {
      setError(getErrorMessage(err, "Código inválido ou vencido. Peça um novo."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={step === "email" ? requestCode : reset} className="w-full max-w-[380px] flex flex-col gap-5">
      <div>
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight">Esqueci a senha</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {step === "email"
            ? "O código chega no bot do Telegram vinculado à sua conta."
            : "Se o e-mail tiver Telegram vinculado, o código já chegou no bot. Vale 15 minutos."}
        </p>
      </div>

      {step === "email" ? (
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
      ) : (
        <>
          <AuthField
            id="reset-code"
            label="Código do bot"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setError(null);
              setCode(e.target.value.replace(/\D/g, ""));
            }}
            required
          />
          <AuthField
            id="reset-password"
            label="Senha nova"
            type="password"
            autoComplete="new-password"
            placeholder={`${MIN_PASSWORD} caracteres ou mais`}
            value={password}
            onChange={(e) => {
              setError(null);
              setPassword(e.target.value);
            }}
            error={error}
            required
          />
        </>
      )}

      <Button type="submit" className="w-full min-h-[48px] text-base gap-2 bg-accent text-white hover:bg-accent/90" disabled={busy}>
        {busy ? (
          <CircleNotch size={18} className="animate-spin" />
        ) : step === "email" ? (
          <>
            <TelegramLogo size={18} /> Mandar código no Telegram
          </>
        ) : (
          "Trocar senha"
        )}
      </Button>

      <p className="text-center text-sm text-zinc-500">
        {step === "code" && (
          <>
            Não chegou?{" "}
            <button type="button" onClick={() => setStep("email")} className="text-accent underline underline-offset-4 hover:no-underline">
              Pedir de novo
            </button>
            {" · "}
          </>
        )}
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-accent underline underline-offset-4 hover:no-underline">
          <ArrowLeft size={14} /> Voltar pro login
        </button>
      </p>
      <p className="text-center text-xs text-zinc-500 -mt-2">
        Sem Telegram vinculado? Fale com o administrador pra redefinir.
      </p>
    </form>
  );
}
