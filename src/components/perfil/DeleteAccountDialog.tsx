import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { clearToken } from "@/lib/auth-session";
import { deleteMe } from "@/api/routes/delete-me";

// Pede a senha: excluir a conta apaga apostas, casas e histórico, e só o
// token (sessão aberta num aparelho alheio) não pode bastar. Mesmo fluxo da
// AccountPage do celular.
export function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMe(password);
      clearToken();
      navigate("/login", { replace: true });
    } catch (error) {
      actionToast.error({ description: getErrorMessage(error, "Falha ao excluir a conta.") });
      setDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setPassword("");
      }}
      title="Excluir sua conta?"
      description="Apaga apostas, casas, movimentações e o vínculo com o Telegram. Não dá pra desfazer."
      confirmLabel={deleting ? "Excluindo…" : "Excluir conta"}
      destructive
      pending={deleting}
      confirmDisabled={password.length === 0}
      onConfirm={() => void handleDelete()}
    >
      <div className="space-y-1.5">
        <Label htmlFor="delete-password" className="text-[13px] font-normal text-zinc-400">
          Digite sua senha para confirmar
        </Label>
        <Input
          id="delete-password"
          type="password"
          autoComplete="current-password"
          className="h-10 rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
    </ConfirmDialog>
  );
}
