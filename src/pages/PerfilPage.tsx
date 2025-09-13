import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { postTelegramLinkCode } from "@/api/routes/post-telegram-link";
import { useNavigate } from "react-router-dom";

export default function PerfilPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [linking, setLinking] = useState(false);
  const [code, setCode] = useState<string>("");

  const handleGenerateTelegramCode = async () => {
    try {
      setLinking(true);
      const res = await postTelegramLinkCode();
      setCode(res.code);
      try { await navigator.clipboard.writeText(res.code); } catch {}
      toast({ title: "Código gerado", description: `Use no bot: /vincular ${res.code}` });
    } catch (error: any) {
      const description = error?.response?.data?.message || "Falha ao gerar código.";
      toast({ title: "Erro", description, variant: "destructive" });
    } finally {
      setLinking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <MainLayout title="Perfil">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vincular Telegram</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gere um código e use no bot com o comando <span className="font-mono">/vincular &lt;código&gt;</span>.
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={handleGenerateTelegramCode} disabled={linking}>
                {linking ? "Gerando…" : "Gerar código"}
              </Button>
              {code && (
                <span className="text-sm">Código: <span className="font-mono">{code}</span></span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessão</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}


