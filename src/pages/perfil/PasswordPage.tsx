import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft } from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthField } from "@/components/auth/AuthField";
import { ScreenFooter } from "@/components/perfil/ScreenFooter";
import { actionToast } from "@/lib/action-toast";
import { postChangePassword } from "@/api/routes/post-change-password";
import { getErrorMessage } from "@/lib/api-error";

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
      await postChangePassword({ currentPassword: current, newPassword: next });
      actionToast.success({ title: "Senha alterada" });
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
      mobileHeader={
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={() => navigate(-1)} aria-label="Voltar" className="p-1 -ml-1 text-zinc-400 hover:text-white">
            <CaretLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold truncate">Alterar senha</h1>
        </div>
      }
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
            Trocar a senha não desconecta esta sessão — você continua logado aqui.
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
