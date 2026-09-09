import { Button } from "@/components/ui/button";
import { AuthField } from "./AuthField";
import { ArrowRight, CircleNotch } from "@phosphor-icons/react";
import { MIN_PASSWORD, useRegisterForm } from "@/hooks/auth/use-register-form";
import { cn } from "@/lib/utils";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { data, setData, error, setError, submitting, strength, emailValid, submit } = useRegisterForm();

  return (
    <form onSubmit={submit} className="w-full max-w-[380px] flex flex-col gap-5">
      <div>
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight">Criar conta</h1>
        <p className="text-sm text-zinc-500 mt-1">Três campos e você já registra a primeira aposta</p>
      </div>

      <AuthField
        id="nome"
        label="Nome"
        type="text"
        autoComplete="name"
        placeholder="Seu nome"
        value={data.nome}
        onChange={(e) => setData((prev) => ({ ...prev, nome: e.target.value }))}
        required
      />

      <AuthField
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="seu@email.com"
        value={data.email}
        valid={emailValid}
        onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
        required
      />

      <div className="flex flex-col gap-2">
        <AuthField
          id="password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          placeholder="Sua senha"
          value={data.password}
          error={error}
          hint={
            strength.label && (
              <span className={cn("text-sm", strength.score >= 2 ? "text-accent" : "text-zinc-500")}>
                {strength.label}
              </span>
            )
          }
          onChange={(e) => {
            setError(null);
            setData((prev) => ({ ...prev, password: e.target.value }));
          }}
          required
        />

        <div className="flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "h-[3px] flex-1 rounded-full transition-colors",
                i < strength.score ? "bg-accent" : "bg-white/10"
              )}
            />
          ))}
        </div>
        <p className="text-sm text-zinc-500">
          {MIN_PASSWORD} caracteres ou mais. Toque no olho para conferir — não pedimos duas vezes.
        </p>
      </div>

      <Button type="submit" className="w-full min-h-[48px] text-base gap-2 bg-accent text-white hover:bg-accent/90" disabled={submitting}>
        {submitting ? (
          <>
            <CircleNotch size={18} className="animate-spin" /> Criando conta…
          </>
        ) : (
          <>
            Criar conta <ArrowRight size={18} />
          </>
        )}
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Ao criar a conta você aceita os termos de uso e a política de privacidade.
      </p>

      <p className="text-center text-sm text-zinc-500">
        Já tem uma conta?{" "}
        <button type="button" onClick={onSwitchToLogin} className="text-accent underline underline-offset-4 hover:no-underline">
          Entrar
        </button>
      </p>
    </form>
  );
}
