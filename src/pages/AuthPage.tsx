import { useState } from "react";
import { ChartLineUp } from "@phosphor-icons/react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

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
          <div className="flex gap-9">
            <div>
              <div className="text-2xl font-medium text-positive">+R$ 4.812</div>
              <div className="text-xs uppercase tracking-wide opacity-55 mt-1">Lucro acumulado</div>
            </div>
            <div>
              <div className="text-2xl font-medium">1.284</div>
              <div className="text-xs uppercase tracking-wide opacity-55 mt-1">Apostas</div>
            </div>
            <div>
              <div className="text-2xl font-medium">84</div>
              <div className="text-xs uppercase tracking-wide opacity-55 mt-1">Casas</div>
            </div>
          </div>
        </div>

        <p className="text-xs opacity-40">
          Ferramenta pessoal de gestão. Não é uma casa de apostas.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 bg-background p-6">
        <div className="lg:hidden w-full max-w-[380px]">
          <div className="w-[38px] h-[38px] rounded-lg border border-accent flex items-center justify-center">
            <ChartLineUp size={20} className="text-accent" />
          </div>
        </div>

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
