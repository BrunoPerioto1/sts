import { useState } from "react";
import { ChartLineUp } from "@phosphor-icons/react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

// Mesma estrutura nas duas telas: marca, título, campos, botão e troca de
// tela. No celular o form fica direto no fundo, sem card; no desktop o card
// emoldura o form no centro e a troca de tela fica embaixo dele.
const AuthPage = () => {
  const [view, setView] = useState<"login" | "register" | "forgot">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const signup = view === "register";

  return (
    <div className="min-h-dvh flex flex-col px-6 lg:items-center lg:justify-center lg:gap-6 lg:p-6">
      <div className="flex flex-col lg:w-[400px] lg:rounded-[14px] lg:border lg:border-foreground/10 lg:bg-card lg:px-9 lg:pt-9 lg:pb-8">
        <div className="flex items-end gap-2.5 h-[88px] lg:h-auto lg:items-center">
          <span className="w-8 h-8 lg:w-[30px] lg:h-[30px] rounded-[8px] bg-accent text-white flex items-center justify-center">
            <ChartLineUp size={16} weight="bold" />
          </span>
          <span className="text-[15px] lg:text-[14.5px] font-semibold tracking-[-0.01em] pb-1.5 lg:pb-0">SportsBet</span>
        </div>

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
