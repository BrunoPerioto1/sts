import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Target, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { postLogin } from "@/api/routes/post-login";
import { getMe } from "@/api/routes/get-me";

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const REMEMBERED_EMAIL_KEY = "remembered_email";

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  const [loginData, setLoginData] = useState(() => {
    // Carregar email salvo no estado inicial
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    return {
      email: rememberedEmail || "",
      password: "",
      rememberMe: !!rememberedEmail
    };
  });

  // Verificar se já está autenticado ao carregar a página
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Verificar se o token ainda é válido fazendo uma requisição
      getMe()
        .then(() => {
          navigate("/dashboard", { replace: true });
        })
        .catch(() => {
          // Token inválido, limpar
          localStorage.removeItem("token");
        });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await postLogin({ email: loginData.email, password: loginData.password });
      localStorage.setItem("token", res.access_token);
      
      // Salvar ou remover email baseado no checkbox "lembrar de mim"
      if (loginData.rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, loginData.email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      // Opcional: buscar dados do usuário logado
      await getMe().catch(() => undefined);

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta ao TrackerBet.",
      });
      navigate("/dashboard");
    } catch (err: any) {
      const description = err?.response?.data?.message || "Falha ao realizar login.";
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
          <p className="text-muted-foreground">Entre na sua conta</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Acesse sua conta para gerenciar suas apostas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
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

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={loginData.rememberMe}
                    onCheckedChange={(checked) => 
                      setLoginData(prev => ({ ...prev, rememberMe: checked as boolean }))
                    }
                  />
                  <Label htmlFor="remember" className="text-sm">
                    Lembrar de mim
                  </Label>
                </div>
                <Button variant="link" className="px-0 h-auto text-sm">
                  Esqueci minha senha
                </Button>
              </div>

              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>

            <Separator className="my-6" />

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?
              </p>
              <Button
                variant="outline"
                onClick={onSwitchToRegister}
                className="w-full"
              >
                Criar conta
              </Button>
            </div>
          </CardContent>
        </Card>

      
      </div>
    </div>
  );
}