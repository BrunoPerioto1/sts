import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
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
        {/* A marca volta pra landing. Grande e no estilo do cabeçalho da landing:
            é a identidade da tela, não um detalhe de navegação. */}
        <Link to="/" className="flex items-end h-[88px] self-start rounded-md lg:h-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo size="lg" />
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
