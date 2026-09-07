import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { AuthField } from "./AuthField";
import { actionToast } from "@/lib/action-toast";
import { ArrowRight, CircleNotch } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { postRegister } from "@/api/routes/post-register";
import { postLogin } from "@/api/routes/post-login";
import { cn } from "@/lib/utils";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const MIN_PASSWORD = 6;

// Três critérios, três barras: tamanho, número e um caractere fora de letra e
// número. Não é medida de entropia — é o que a tela promete e o que o
// formulário cobra.
function passwordStrength(password: string) {
  const checks = [password.length >= MIN_PASSWORD, /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  const label = password.length === 0 ? null : score <= 1 ? "Fraca" : score === 2 ? "Boa" : "Forte";
  // Só o tamanho barra o cadastro — número e símbolo entram como força, não
  // como exigência, pra não inventar regra que o backend não cobra.
  return { score, label, meetsMinimum: checks[0] };
}

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerData, setRegisterData] = useState({ nome: "", email: "", password: "" });
  const navigate = useNavigate();

  const strength = passwordStrength(registerData.password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerData.nome || !registerData.email || !registerData.password) {
      setError("Preencha todos os campos.");
      return;
    }
    if (!strength.meetsMinimum) {
      setError(`Use ${MIN_PASSWORD} caracteres ou mais.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await postRegister({
        username: registerData.nome,
        email: registerData.email,
        password: registerData.password,
        roleId: 1,
        fullName: registerData.nome,
      });

      const loginRes = await postLogin({ email: registerData.email, password: registerData.password });
      localStorage.setItem("token", loginRes.access_token);

      actionToast.success({ title: "Conta criada!", description: "Bem-vindo ao SportsBet Manager!" });
      navigate("/dashboard");
    } catch (err) {
      // class-validator devolve `message` como array quando mais de uma regra
      // falha; a tela mostra a primeira.
      const raw = axios.isAxiosError(err) ? err.response?.data?.message : null;
      setError(Array.isArray(raw) ? raw[0] : (raw ?? "Falha ao criar conta."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="w-full max-w-[380px] flex flex-col gap-5">
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
        value={registerData.nome}
        onChange={(e) => setRegisterData((prev) => ({ ...prev, nome: e.target.value }))}
        required
      />

      <AuthField
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="seu@email.com"
        value={registerData.email}
        valid={isEmail(registerData.email)}
        onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))}
        required
      />

      <div className="flex flex-col gap-2">
        <AuthField
          id="password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          placeholder="Sua senha"
          value={registerData.password}
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
            setRegisterData((prev) => ({ ...prev, password: e.target.value }));
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
