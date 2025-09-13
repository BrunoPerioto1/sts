import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Target, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { postRegister } from "@/api/routes/post-register";
import { postLogin } from "@/api/routes/post-login";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerData, setRegisterData] = useState({
    nome: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
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

    try {
      // Backend exige: username, email, password, roleId, full_name?
      await postRegister({
        username: registerData.nome,
        email: registerData.email,
        password: registerData.password,
        roleId: 1,
        full_name: registerData.nome,
      });

      // Login automático após cadastro
      const loginRes = await postLogin({ email: registerData.email, password: registerData.password });
      localStorage.setItem("token", loginRes.access_token);

      toast({ title: "Conta criada!", description: "Bem-vindo ao TrackerBet!" });
      navigate("/dashboard");
    } catch (err: any) {
      const description = err?.response?.data?.message || "Falha ao criar conta.";
      toast({ title: "Erro", description, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">TrackerBet</h1>
          </div>
          <p className="text-muted-foreground">Crie sua conta</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cadastro</CardTitle>
            <CardDescription>
              Crie sua conta para começar a gerenciar suas apostas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={registerData.nome}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, nome: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={registerData.acceptTerms}
                  onCheckedChange={(checked) => 
                    setRegisterData(prev => ({ ...prev, acceptTerms: checked as boolean }))
                  }
                />
                <Label htmlFor="terms" className="text-sm">
                  Aceito os{" "}
                  <Button variant="link" className="px-0 h-auto text-sm">
                    termos de uso
                  </Button>{" "}
                  e{" "}
                  <Button variant="link" className="px-0 h-auto text-sm">
                    política de privacidade
                  </Button>
                </Label>
              </div>

              <Button type="submit" className="w-full">
                Criar conta
              </Button>
            </form>

            <Separator className="my-6" />

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?
              </p>
              <Button
                variant="outline"
                onClick={onSwitchToLogin}
                className="w-full"
              >
                Entrar
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}