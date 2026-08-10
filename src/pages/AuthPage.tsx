import { useState } from "react";
import { ChartLineUp } from "@phosphor-icons/react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
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
          <h1 className="text-[38px] leading-[1.1] font-medium mb-4">
            Suas apostas com cara de<br />demonstrativo financeiro.
          </h1>
          <p className="text-[15px] opacity-70 mb-9">
            Registre entradas, concilie saldos em dezenas de casas e leia ROI de verdade — sem confetes, sem cassino.
          </p>
          <div className="flex gap-9">
            <div>
              <div className="text-[26px] font-medium text-positive">Multi-casas</div>
              <div className="text-[11px] uppercase tracking-wide opacity-55 mt-1">Concilie saldos em um só lugar</div>
            </div>
            <div>
              <div className="text-[26px] font-medium">ROI real</div>
              <div className="text-[11px] uppercase tracking-wide opacity-55 mt-1">Sem números de cassino</div>
            </div>
            <div>
              <div className="text-[26px] font-medium">Telegram</div>
              <div className="text-[11px] uppercase tracking-wide opacity-55 mt-1">Registre por mensagem</div>
            </div>
          </div>
        </div>

        <p className="text-xs opacity-40">
          Ferramenta pessoal de gestão. Não é uma casa de apostas.
        </p>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
