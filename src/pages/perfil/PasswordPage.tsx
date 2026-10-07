import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthField } from "@/components/auth/AuthField";
import { ScreenFooter } from "@/components/perfil/ScreenFooter";
import { actionToast } from "@/lib/action-toast";
import { postChangePassword } from "@/api/routes/post-change-password";
import { getErrorMessage } from "@/lib/api-error";
import { replaceToken } from "@/lib/auth-session";
import { PageHeader } from "@/components/ui/page-header";

const MIN_PASSWORD = 6;

export default function PasswordPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const tooShort = next.length > 0 && next.length < MIN_PASSWORD;
  const canSave = current.length > 0 && next.length >= MIN_PASSWORD;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const { access_token } = await postChangePassword({ currentPassword: current, newPassword: next });
      // A senha nova derrubou todas as sessões; esta segue com o token novo.
      replaceToken(access_token);
      actionToast.success({ title: "Senha alterada", description: "Os outros aparelhos foram desconectados." });
      navigate(-1);
    } catch (err) {
      setError(getErrorMessage(err, "Falha ao alterar a senha."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout
      title="Alterar senha"
      hideHeaderBorder
      hideBottomNav
      mobileHeader={<PageHeader back title="Alterar senha" />}
    >
      <div className="flex flex-col">
        <div className="flex flex-col gap-4">
          <AuthField
            id="current-password"
            label="Senha atual"
            type="password"
            autoComplete="current-password"
            placeholder="Sua senha de hoje"
            value={current}
            onChange={(e) => {
              setError(null);
              setCurrent(e.target.value);
            }}
            error={error}
          />

          <AuthField
            id="new-password"
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            placeholder={`Mínimo de ${MIN_PASSWORD} caracteres`}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            error={tooShort ? `Use ${MIN_PASSWORD} caracteres ou mais.` : null}
          />

          <p className="text-sm text-zinc-500">
            Trocar a senha desconecta os outros aparelhos. Aqui você continua logado.
          </p>
        </div>

        <ScreenFooter
          onSave={handleSave}
          onDiscard={() => {
            setCurrent("");
            setNext("");
            setError(null);
          }}
          saving={saving}
          disabled={!canSave}
          saveLabel="Salvar nova senha"
        />
      </div>
    </MainLayout>
  );
}
