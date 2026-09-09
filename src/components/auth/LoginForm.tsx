import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AuthField } from "./AuthField";
import { actionToast } from "@/lib/action-toast";
import { formatCountdown } from "@/lib/format";
import { ArrowRight, CircleNotch } from "@phosphor-icons/react";
import { useLoginForm } from "@/hooks/auth/use-login-form";

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { data, setData, error, setError, submitting, locked, lockRemainingMs, submit } = useLoginForm();

  return (
    <form onSubmit={submit} className="w-full max-w-[380px] flex flex-col gap-5">
      <div>
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight">Entrar</h1>
        <p className="text-sm text-zinc-500 mt-1">Sua banca, do jeito que você deixou</p>
      </div>

      <AuthField
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="seu@email.com"
        value={data.email}
        onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
        required
      />

      <AuthField
        id="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        placeholder="Sua senha"
        value={data.password}
        onChange={(e) => {
          setError(null);
          setData((prev) => ({ ...prev, password: e.target.value }));
        }}
        error={error}
        required
      />

      {locked && (
        <p className="text-sm text-negative -mt-1">
          Muitas tentativas. Tente de novo em {formatCountdown(lockRemainingMs)}.
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={data.rememberMe}
            onCheckedChange={(checked) => setData((prev) => ({ ...prev, rememberMe: checked as boolean }))}
          />
          <Label htmlFor="remember" className="text-sm font-normal">Manter conectado</Label>
        </div>
        <button
          type="button"
          onClick={() => actionToast.error({ title: "Ainda não disponível", description: "Recuperação de senha ainda não foi implementada." })}
          className="text-sm text-accent underline underline-offset-4 hover:no-underline"
        >
          Esqueci a senha
        </button>
      </div>

      <Button type="submit" className="w-full min-h-[48px] text-base gap-2 bg-accent text-white hover:bg-accent/90" disabled={submitting || locked}>
        {submitting ? (
          <>
            <CircleNotch size={18} className="animate-spin" /> Verificando…
          </>
        ) : locked ? (
          `Bloqueado por ${formatCountdown(lockRemainingMs)}`
        ) : (
          <>
            Entrar <ArrowRight size={18} />
          </>
        )}
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Ainda não tem conta?{" "}
        <button type="button" onClick={onSwitchToRegister} className="text-accent underline underline-offset-4 hover:no-underline">
          Criar conta
        </button>
      </p>
    </form>
  );
}
