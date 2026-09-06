import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AuthField } from "./AuthField";
import { actionToast } from "@/lib/action-toast";
import { ArrowRight, CircleNotch } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { postLogin } from "@/api/routes/post-login";
import { getMe } from "@/api/routes/get-me";

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const REMEMBERED_EMAIL_KEY = "remembered_email";

// Corpo de erro que o backend manda no login: 401 traz `attemptsLeft` quando a
// conta existe, 429 traz `lockedUntil`.
type LoginErrorBody = { message?: string; attemptsLeft?: number; lockedUntil?: string };

// mm:ss pro tempo que falta do bloqueio.
function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Instante em que o bloqueio do backend expira (429 traz `lockedUntil`).
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [loginData, setLoginData] = useState(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    return {
      email: rememberedEmail || "",
      password: "",
      rememberMe: !!rememberedEmail,
    };
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getMe()
        .then(() => navigate("/dashboard", { replace: true }))
        .catch(() => localStorage.removeItem("token"));
    }
  }, [navigate]);

  // Um tique por segundo só enquanto há bloqueio de pé — é o que faz a
  // contagem regressiva andar e o botão voltar sozinho quando ela zera.
  const locked = !!lockedUntil && lockedUntil.getTime() > now;
  useEffect(() => {
    if (!lockedUntil) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lockedUntil]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;

    if (!loginData.email || !loginData.password) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await postLogin({ email: loginData.email, password: loginData.password });
      queryClient.clear();
      localStorage.setItem("token", res.access_token);

      if (loginData.rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, loginData.email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      await getMe().catch(() => undefined);
      navigate("/dashboard");
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const data = axios.isAxiosError(err) ? (err.response?.data as LoginErrorBody | undefined) : undefined;

      // 429 = conta travada; 401 com `attemptsLeft` = ainda dá pra tentar.
      // O aviso fica embaixo do campo, não num toast que some sozinho.
      if (status === 429 && data?.lockedUntil) {
        const until = new Date(data.lockedUntil);
        setLockedUntil(until);
        setNow(Date.now());
        setError(null);
      } else if (typeof data?.attemptsLeft === "number") {
        const left = data.attemptsLeft;
        setError(
          `Senha incorreta. Resta${left === 1 ? "" : "m"} ${left} tentativa${left === 1 ? "" : "s"} antes do bloqueio temporário.`
        );
      } else if (status === 401) {
        setError("E-mail ou senha incorretos.");
      } else {
        actionToast.error({ description: data?.message || "Não foi possível entrar. Tente de novo." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="w-full max-w-[380px] flex flex-col gap-5">
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
        value={loginData.email}
        onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
        required
      />

      <AuthField
        id="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        placeholder="Sua senha"
        value={loginData.password}
        onChange={(e) => {
          setError(null);
          setLoginData((prev) => ({ ...prev, password: e.target.value }));
        }}
        error={error}
        required
      />

      {locked && (
        <p className="text-sm text-negative -mt-1">
          Muitas tentativas. Tente de novo em {formatCountdown(lockedUntil!.getTime() - now)}.
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={loginData.rememberMe}
            onCheckedChange={(checked) => setLoginData((prev) => ({ ...prev, rememberMe: checked as boolean }))}
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

      <Button type="submit" className="w-full min-h-[48px] text-base gap-2 bg-blue-600 text-white hover:bg-blue-600/90" disabled={submitting || locked}>
        {submitting ? (
          <>
            <CircleNotch size={18} className="animate-spin" /> Verificando…
          </>
        ) : locked ? (
          `Bloqueado por ${formatCountdown(lockedUntil!.getTime() - now)}`
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
