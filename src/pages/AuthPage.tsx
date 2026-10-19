import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChartLineUp } from "@phosphor-icons/react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

// Mesma estrutura nas duas telas: marca, título, campos, botão e troca de
// tela. No celular o form fica direto no fundo, sem card; no desktop o card
// emoldura o form no centro e a troca de tela fica embaixo dele.
const AuthPage = () => {
  // "Criar conta" da landing chega com ?cadastro e já abre no cadastro.
  const [params] = useSearchParams();
  const [view, setView] = useState<"login" | "register" | "forgot">(() => (params.has("cadastro") ? "register" : "login"));
  const [forgotEmail, setForgotEmail] = useState("");
  const signup = view === "register";

  return (
    <div className="relative isolate min-h-dvh flex flex-col px-6 lg:items-center lg:justify-center lg:gap-6 lg:p-6">
      {/* Fundo de pontos com um brilho azul atrás do card (o "Dot Background"
          do Aceternity). Só no desktop: no celular o form fica direto no fundo
          e os pontos passariam por trás dos campos. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
        <div className="absolute inset-0 [background-image:radial-gradient(rgb(var(--rgb-text)/0.12)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(520px_circle_at_50%_40%,rgb(var(--rgb-accent)/0.14),transparent_70%)]" />
      </div>
      <div className="flex flex-col lg:w-[400px] lg:rounded-[14px] lg:border lg:border-foreground/10 lg:bg-card lg:shadow-card lg:px-9 lg:pt-9 lg:pb-8">
        {/* A marca volta pra landing. */}
        <Link to="/" className="flex items-end gap-2.5 h-[88px] self-start rounded-md lg:h-auto lg:items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="w-8 h-8 lg:w-[30px] lg:h-[30px] rounded-[8px] bg-accent text-white flex items-center justify-center">
            <ChartLineUp size={16} weight="bold" />
          </span>
          <span className="text-[15px] lg:text-[14.5px] font-semibold tracking-[-0.01em] pb-1.5 lg:pb-0">SportsBet</span>
        </Link>

        {view === "login" ? (
          <LoginForm
            onForgotPassword={(email) => {
              setForgotEmail(email);
              setView("forgot");
            }}
          />
        ) : view === "forgot" ? (
          <ForgotPasswordForm initialEmail={forgotEmail} onBack={() => setView("login")} />
        ) : (
          <RegisterForm />
        )}
      </div>

      {view !== "forgot" && (
        <p className="mt-auto lg:mt-0 pt-5 pb-9 lg:p-0 flex justify-center gap-1.5 text-sm lg:text-[13.5px] text-zinc-400">
          {signup ? "Já tem conta?" : "Ainda não tem conta?"}
          <button
            type="button"
            onClick={() => setView(signup ? "login" : "register")}
            className="font-medium text-accent-text hover:underline underline-offset-4"
          >
            {signup ? "Entrar" : "Criar conta"}
          </button>
        </p>
      )}
    </div>
  );
};

export default AuthPage;
