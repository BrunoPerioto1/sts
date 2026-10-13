import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { postRegister } from "@/api/routes/post-register";
import { postLogin } from "@/api/routes/post-login";
import { actionToast } from "@/lib/action-toast";
import { saveToken } from "@/lib/auth-session";

export const MIN_PASSWORD = 6;

// Quatro barras, cada uma pede mais tamanho e mais variedade. Não é medida de
// entropia — é o que a tela promete. Só o tamanho mínimo barra o cadastro;
// o resto entra como força, não como exigência que o backend não cobra.
const LEVELS = ["Curta", "Fraca", "Boa", "Forte", "Muito forte"] as const;

function passwordStrength(p: string) {
  const digit = /\d/.test(p), symbol = /[^A-Za-z0-9]/.test(p);
  let score = 0;
  if (p.length >= MIN_PASSWORD) score = 1;
  if (p.length >= 8 && digit) score = 2;
  if (p.length >= 10 && digit && symbol) score = 3;
  if (p.length >= 12 && digit && symbol && /[A-Z]/.test(p)) score = 4;
  return { score, label: p ? LEVELS[score] : null, meetsMinimum: score >= 1 };
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
      // Sem username: o servidor gera um único a partir do nome. Mandar o
      // "Nome" como username fazia dois "Bruno" colidirem no cadastro.
      await postRegister({
        email: data.email,
        password: data.password,
        fullName: data.nome.trim(),
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
