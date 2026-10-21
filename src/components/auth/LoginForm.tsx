import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AuthField } from "./AuthField";
import { AuthHeading } from "./AuthHeading";
import { formatCountdown } from "@/lib/format";
import { useLoginForm } from "@/hooks/auth/use-login-form";

interface LoginFormProps {
  /** Abre o "Esqueci a senha" já com o e-mail digitado aqui. */
  onForgotPassword: (email: string) => void;
}

export function LoginForm({ onForgotPassword }: LoginFormProps) {
  const { data, setData, error, setError, submitting, locked, lockRemainingMs, submit } = useLoginForm();

  return (
    <form onSubmit={submit} className="flex flex-col gap-[18px] lg:gap-4">
      <AuthHeading title="Entrar" sub="Bem-vindo de volta!" />

      <AuthField
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@email.com"
        value={data.email}
        onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
        required
      />

      {/* "Esqueci a senha" ao lado do rótulo, pra "Manter conectado" ficar
          sozinho na linha. */}
      <AuthField
        id="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        placeholder="Sua senha"
        value={data.password}
        hint={
          <button
            type="button"
            onClick={() => onForgotPassword(data.email)}
            className="whitespace-nowrap text-[13.5px] lg:text-[13px] font-medium text-accent-text hover:underline underline-offset-4"
          >
            Esqueci a senha
          </button>
        }
        onChange={(e) => {
          setError(null);
          setData((prev) => ({ ...prev, password: e.target.value }));
        }}
        error={error}
        required
      />

      {locked && (
        <p className="text-sm text-danger -mt-1">
          Muitas tentativas. Tente de novo em {formatCountdown(lockRemainingMs)}.
        </p>
      )}

      <div className="flex items-center gap-2.5 h-8 -my-1 lg:h-6 lg:my-0">
        <Checkbox
          id="remember"
          className="h-[18px] w-[18px] rounded-[4px]"
          checked={data.rememberMe}
          onCheckedChange={(checked) => setData((prev) => ({ ...prev, rememberMe: checked as boolean }))}
        />
        <Label htmlFor="remember" className="text-sm lg:text-[13.5px] font-normal text-zinc-300">Manter conectado</Label>
      </div>

      <Button
        type="submit"
        className="w-full h-12 lg:h-10 mt-1.5 lg:mt-1 rounded-[10px] lg:rounded-[8px] text-[15px] lg:text-sm font-semibold gap-2"
        disabled={locked}
        loading={submitting}
      >
        {submitting ? (
          "Verificando…"
        ) : locked ? (
          `Bloqueado por ${formatCountdown(lockRemainingMs)}`
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  );
}
