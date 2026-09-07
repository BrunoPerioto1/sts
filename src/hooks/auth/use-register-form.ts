import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { postRegister } from "@/api/routes/post-register";
import { postLogin } from "@/api/routes/post-login";
import { actionToast } from "@/lib/action-toast";
import { saveToken } from "@/lib/auth-session";

export const MIN_PASSWORD = 6;

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

export function useRegisterForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState({ nome: "", email: "", password: "" });

  const strength = passwordStrength(data.password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!data.nome || !data.email || !data.password) {
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
        username: data.nome,
        email: data.email,
        password: data.password,
        roleId: 1,
        fullName: data.nome,
      });

      const loginRes = await postLogin({ email: data.email, password: data.password });
      saveToken(loginRes.access_token);

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

  return {
    data,
    setData,
    error,
    setError,
    submitting,
    strength,
    emailValid: isEmail(data.email),
    submit,
  };
}
