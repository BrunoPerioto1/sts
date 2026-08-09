import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { postRegister } from "@/api/routes/post-register";
import { postLogin } from "@/api/routes/post-login";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registerData, setRegisterData] = useState({
    nome: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerData.nome || !registerData.email || !registerData.password) {
      toast({ title: "Erro", description: "Por favor, preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (registerData.password.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (!registerData.acceptTerms) {
      toast({ title: "Erro", description: "Você deve aceitar os termos de uso.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await postRegister({
        username: registerData.nome,
        email: registerData.email,
        password: registerData.password,
        roleId: 1,
        fullName: registerData.nome,
      });

      const loginRes = await postLogin({ email: registerData.email, password: registerData.password });
      localStorage.setItem("token", loginRes.access_token);

      toast({ title: "Conta criada!", description: "Bem-vindo ao SportsBet Manager!" });
      navigate("/dashboard");
    } catch (err: any) {
      const description = err?.response?.data?.message || "Falha ao criar conta.";
      toast({ title: "Erro", description, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="w-full max-w-[360px] flex flex-col gap-[18px]">
      <div>
        <h1 className="text-2xl font-medium mb-1">Criar conta</h1>
        <p className="text-[13px] opacity-60">Comece a registrar suas apostas</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nome" className="text-xs">Nome completo</Label>
        <Input
          id="nome"
          type="text"
          placeholder="Seu nome completo"
          value={registerData.nome}
          onChange={(e) => setRegisterData((prev) => ({ ...prev, nome: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={registerData.email}
          onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 6 caracteres"
            value={registerData.password}
            onChange={(e) => setRegisterData((prev) => ({ ...prev, password: e.target.value }))}
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

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-xs">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          placeholder="Confirme sua senha"
          value={registerData.confirmPassword}
          onChange={(e) => setRegisterData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="terms"
          checked={registerData.acceptTerms}
          onCheckedChange={(checked) => setRegisterData((prev) => ({ ...prev, acceptTerms: checked as boolean }))}
        />
        <Label htmlFor="terms" className="text-sm font-normal">
          Aceito os termos de uso e política de privacidade
        </Label>
      </div>

      <Button type="submit" className="w-full min-h-[40px] mt-1" disabled={submitting}>
        {submitting ? "Criando conta…" : "Criar conta"}
      </Button>

      <p className="text-center text-sm opacity-60">
        Já tem uma conta?{" "}
        <button type="button" onClick={onSwitchToLogin} className="text-accent hover:underline">
          Entrar
        </button>
      </p>
    </form>
  );
}
