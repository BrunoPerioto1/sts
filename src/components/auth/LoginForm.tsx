import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { actionToast } from "@/lib/action-toast";
import { Eye, EyeSlash, ArrowRight } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { postLogin } from "@/api/routes/post-login";
import { getMe } from "@/api/routes/get-me";

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const REMEMBERED_EMAIL_KEY = "remembered_email";

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      actionToast.error({ description: "Por favor, preencha todos os campos." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await postLogin({ email: loginData.email, password: loginData.password });
      localStorage.setItem("token", res.access_token);

      if (loginData.rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, loginData.email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      await getMe().catch(() => undefined);

      navigate("/dashboard");
    } catch (err: any) {
      const description = err?.response?.data?.message || "Credenciais inválidas.";
      actionToast.error({ description });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="w-full max-w-[360px] flex flex-col gap-[18px]">
      <div>
        <h1 className="text-2xl font-medium mb-1">Entrar</h1>
        <p className="text-sm opacity-60">Acesse sua banca</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs uppercase tracking-wide opacity-70">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={loginData.email}
          onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs uppercase tracking-wide opacity-70">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Sua senha"
            value={loginData.password}
            onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-[10px] top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={loginData.rememberMe}
            onCheckedChange={(checked) => setLoginData((prev) => ({ ...prev, rememberMe: checked as boolean }))}
          />
          <Label htmlFor="remember" className="text-sm font-normal">Manter conectado</Label>
        </div>
        <Button type="button" variant="link" className="px-0 h-auto text-sm">
          Esqueci a senha
        </Button>
      </div>

      <Button type="submit" className="w-full min-h-[40px] mt-1" disabled={submitting}>
        {submitting ? "Entrando…" : "Entrar"}
        {!submitting && <ArrowRight size={16} />}
      </Button>

      <p className="text-center text-sm opacity-60">
        Ainda não tem conta?{" "}
        <button type="button" onClick={onSwitchToRegister} className="text-accent hover:underline">
          Criar conta
        </button>
      </p>
    </form>
  );
}
