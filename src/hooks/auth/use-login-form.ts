import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { postLogin } from "@/api/routes/post-login";
import { getMe } from "@/api/routes/get-me";
import { actionToast } from "@/lib/action-toast";
import { clearToken, getRememberedEmail, getToken, saveToken, setRememberedEmail } from "@/lib/auth-session";

// Corpo de erro que o backend manda no login: 429 traz `lockedUntil`. O 401 é
// o mesmo exista ou não o e-mail (não revela quem tem conta).
type LoginErrorBody = { message?: string; lockedUntil?: string };

export function useLoginForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Instante em que o bloqueio do backend expira (429 traz `lockedUntil`).
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const [data, setData] = useState(() => {
    const rememberedEmail = getRememberedEmail();
    return {
      email: rememberedEmail || "",
      password: "",
      rememberMe: !!rememberedEmail,
    };
  });

  // Token válido na máquina: entra direto, sem passar pela tela.
  useEffect(() => {
    if (!getToken()) return;
    getMe()
      .then(() => navigate("/dashboard", { replace: true }))
      .catch(() => clearToken());
  }, [navigate]);

  // Um tique por segundo só enquanto há bloqueio de pé — é o que faz a
  // contagem regressiva andar e o botão voltar sozinho quando ela zera.
  const locked = !!lockedUntil && lockedUntil.getTime() > now;
  useEffect(() => {
    if (!lockedUntil) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lockedUntil]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;

    if (!data.email || !data.password) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // "Manter conectado": token de 30 dias guardado no localStorage.
      // Desmarcado, a sessão dura até fechar a aba (e no máximo 1 dia).
      const res = await postLogin({ email: data.email, password: data.password, remember: data.rememberMe });
      queryClient.clear();
      saveToken(res.access_token, data.rememberMe);
      setRememberedEmail(data.rememberMe ? data.email : null);

      await getMe().catch(() => undefined);
      navigate("/dashboard");
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const body = axios.isAxiosError(err) ? (err.response?.data as LoginErrorBody | undefined) : undefined;

      // 429 = conta travada. O aviso fica embaixo do campo, não num toast que
      // some sozinho.
      if (status === 429 && body?.lockedUntil) {
        setLockedUntil(new Date(body.lockedUntil));
        setNow(Date.now());
        setError(null);
      } else if (status === 402) {
        // Senha certa, acesso vencido: o interceptor já leva pra /renovar.
      } else if (status === 401) {
        setError("E-mail ou senha incorretos. Depois de 5 erros seguidos o login trava por 15 minutos.");
      } else {
        actionToast.error({ description: body?.message || "Não foi possível entrar. Tente de novo." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    data,
    setData,
    error,
    setError,
    submitting,
    locked,
    lockRemainingMs: lockedUntil ? lockedUntil.getTime() - now : 0,
    submit,
  };
}
