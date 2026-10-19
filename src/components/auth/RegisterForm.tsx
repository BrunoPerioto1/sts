import { Button } from "@/components/ui/button";
import { AuthField } from "./AuthField";
import { AuthHeading } from "./AuthHeading";
import { MIN_PASSWORD, useRegisterForm } from "@/hooks/auth/use-register-form";
import { cn } from "@/lib/utils";

// Curta em vermelho, Fraca em âmbar, daí pra cima verde. Classes por extenso
// pro Tailwind enxergar.
const TONES = [
  { text: "text-danger", bar: "bg-danger" },
  { text: "text-warning", bar: "bg-warning" },
  { text: "text-success", bar: "bg-success" },
];

export function RegisterForm() {
  const { data, setData, error, setError, submitting, strength, emailValid, submit } = useRegisterForm();
  const tone = TONES[Math.min(strength.score, 2)];

  return (
    <form onSubmit={submit} className="flex flex-col gap-[18px] lg:gap-4">
      <AuthHeading title="Criar conta" sub="Leva menos de um minuto." />

      <AuthField
        id="nome"
        label="Nome"
        type="text"
        autoComplete="name"
        placeholder="Como quer ser chamado"
        value={data.nome}
        onChange={(e) => setData((prev) => ({ ...prev, nome: e.target.value }))}
        required
      />

      <AuthField
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@email.com"
        value={data.email}
        valid={emailValid}
        onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
        required
      />

      <div className="flex flex-col gap-2 lg:gap-[7px]">
        <AuthField
          id="password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          placeholder="Crie uma senha"
          value={data.password}
          error={error}
          hint={
            strength.label && (
              <span className={cn("whitespace-nowrap text-[12.5px] lg:text-xs font-medium", tone.text)}>
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

        <div className="grid grid-cols-4 gap-1 pt-0.5" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-[3px] rounded-full transition-colors",
                data.password && i < Math.max(strength.score, 1) ? tone.bar : "bg-foreground/10"
              )}
            />
          ))}
        </div>
        <p className="text-[12.5px] lg:text-xs text-zinc-500">Mínimo de {MIN_PASSWORD} caracteres</p>
      </div>

      <Button
        type="submit"
        className="w-full h-12 lg:h-10 mt-1.5 lg:mt-1 rounded-[10px] lg:rounded-[8px] text-[15px] lg:text-sm font-semibold gap-2"
        loading={submitting}
      >
        {submitting ? "Criando conta…" : "Criar conta"}
      </Button>

      <p className="-mt-1.5 lg:-mt-1 text-[12.5px] lg:text-xs leading-normal text-zinc-500 text-pretty">
        Ao criar a conta, você aceita os termos de uso e a política de privacidade.
      </p>
    </form>
  );
}
