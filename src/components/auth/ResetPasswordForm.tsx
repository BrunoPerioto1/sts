import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { AuthField } from "./AuthField";
import { AuthHeading } from "./AuthHeading";
import { postResetPassword } from "@/api/routes/post-login";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { MIN_PASSWORD } from "@/hooks/auth/use-register-form";

interface ResetPasswordFormProps {
  /** Token do link do e-mail (ou do bot); null quando a página abriu sem ele. */
  token: string | null;
  onDone: () => void;
  onRequestNew: () => void;
}

/** Senha nova a partir do link de "Esqueci a senha". O link só vale uma vez. */
export function ResetPasswordForm({ token, onDone, onRequestNew }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Sem token ou recusado pelo servidor: em vez de insistir, a saída é pedir outro.
  const [linkDead, setLinkDead] = useState(!token);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password.length < MIN_PASSWORD) return setError(`Use ${MIN_PASSWORD} caracteres ou mais.`);
    if (password !== confirm) return setError("As senhas não são iguais.");
    setBusy(true);
    setError(null);
    try {
      await postResetPassword({ token, newPassword: password });
      actionToast.success({ title: "Senha trocada", description: "Entre com a senha nova." });
      onDone();
    } catch (err) {
      // 400 é o token (a senha já foi conferida aqui); o resto, rede ou
      // servidor, deixa tentar de novo com o mesmo link.
      if (axios.isAxiosError(err) && err.response?.status === 400) setLinkDead(true);
      else setError(getErrorMessage(err, "Não deu pra trocar a senha agora. Tente de novo."));
    } finally {
      setBusy(false);
    }
  };

  if (linkDead) {
    return (
      <div className="flex flex-col gap-[18px] lg:gap-4">
        <AuthHeading title="Link expirado" sub="Este link já foi usado, venceu ou está incompleto. Peça um novo pra trocar a senha." />
        <Button
          type="button"
          onClick={onRequestNew}
          className="w-full h-12 lg:h-10 mt-1.5 lg:mt-1 rounded-[10px] lg:rounded-[8px] text-[15px] lg:text-sm font-semibold"
        >
          Pedir outro link
        </Button>
        <p className="text-center text-sm text-zinc-500">
          <button type="button" onClick={onDone} className="text-accent underline underline-offset-4 hover:no-underline">
            Voltar pro login
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-[18px] lg:gap-4">
      <AuthHeading title="Nova senha" sub="Escolha a senha que você vai usar pra entrar. As outras sessões abertas saem." />
      <AuthField
        id="new-password"
        label="Senha nova"
        type="password"
        autoComplete="new-password"
        placeholder={`${MIN_PASSWORD} caracteres ou mais`}
        value={password}
        onChange={(e) => {
          setError(null);
          setPassword(e.target.value);
        }}
        required
      />
      <AuthField
        id="confirm-password"
        label="Confirmar senha nova"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => {
          setError(null);
          setConfirm(e.target.value);
        }}
        error={error}
        required
      />
      <Button type="submit" className="w-full h-12 lg:h-10 mt-1.5 lg:mt-1 rounded-[10px] lg:rounded-[8px] text-[15px] lg:text-sm font-semibold" loading={busy}>
        {busy ? "Trocando senha…" : "Trocar senha"}
      </Button>
    </form>
  );
}
