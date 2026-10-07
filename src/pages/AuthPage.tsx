import { useState } from "react";
import { ChartLineUp } from "@phosphor-icons/react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

const AuthPage = () => {
  const [view, setView] = useState<"login" | "register" | "forgot">("login");
  const [forgotEmail, setForgotEmail] = useState("");

  return (
    <div className="min-h-dvh grid lg:grid-cols-[1.05fr_1fr]">
      <div
        className="relative hidden lg:flex flex-col justify-between p-14 overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 90% at 8% 0%, var(--color-section-glow) 0%, var(--color-section) 38%, var(--color-bg) 82%)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-[30px] h-[30px] rounded-md border border-accent flex items-center justify-center shrink-0">
            <ChartLineUp size={18} weight="regular" className="text-accent" />
          </div>
          <span className="text-base font-medium">SportsBet Manager</span>
        </div>

        <div className="max-w-lg">
          <h1 className="text-4xl leading-[1.1] font-medium mb-4">
            Sua banca lida como<br />um demonstrativo.
          </h1>
          <p className="text-base opacity-70 mb-9">
            Registre entradas, concilie saldos em dezenas de casas e leia ROI de verdade.
            Sem confete, sem cassino, sem cor decorativa.
          </p>
          <div className="hr-fade mb-6" style={{ marginLeft: 0, marginRight: "auto", width: "100%" }} />
          {/* Antes eram numeros inventados (+R$ 4.812, 1.284 apostas) — num app
              de banca, cifra de mentira na porta de entrada soa como promessa. */}
          <div className="flex gap-9">
            {[
              ["Telegram", "Aposta pelo bot"],
              ["Automática", "Liquidação por placar"],
              ["Por casa", "Saldo conciliado"],
            ].map(([value, label]) => (
              <div key={label}>
                <div className="text-2xl font-medium">{value}</div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs opacity-40">
          Ferramenta pessoal de gestão. Não é uma casa de apostas.
        </p>
      </div>

      {/* Celular: sem a coluna da esquerda, o form vira um cartao compacto no
          alto da tela, com a marca dentro dele. Centralizado na vertical numa
          tela alta ele sobrava no meio de um vazio. Desktop segue como era. */}
      <div className="flex flex-col items-center justify-start lg:justify-center bg-[var(--color-section)] lg:bg-background px-4 pt-[10dvh] pb-8 lg:p-6">
        <div className="w-full max-w-[420px] rounded-2xl bg-card px-5 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] lg:max-w-[380px] lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
          <div className="lg:hidden flex flex-col items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-lg border border-accent flex items-center justify-center">
              <ChartLineUp size={18} className="text-accent" />
            </div>
            <span className="text-sm font-medium">SportsBet Manager</span>
          </div>

          {view === "login" ? (
            <LoginForm
              onSwitchToRegister={() => setView("register")}
              onForgotPassword={(email) => {
                setForgotEmail(email);
                setView("forgot");
              }}
            />
          ) : view === "forgot" ? (
            <ForgotPasswordForm initialEmail={forgotEmail} onBack={() => setView("login")} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setView("login")} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
