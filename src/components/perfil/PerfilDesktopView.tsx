import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CaretRight, SignOut, SquaresFour } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { formatSignedCurrency } from "@/lib/format";
import { usePreferencesForm } from "@/hooks/use-preferences-form";
import { useMe } from "@/hooks/queries/use-me";
import type { MeResponse } from "@/api/routes/get-me";
import type { ProfileSummary } from "@/hooks/perfil/use-profile-summary";
import { PreferencesFields } from "./PreferencesFields";
import { ProfileIdentityCard } from "./ProfileIdentityCard";
import { ExportDataCard } from "./ExportDataCard";
import { TelegramCard } from "./TelegramCard";

export function PerfilDesktopView({ me, summary }: { me: MeResponse; summary: ProfileSummary }) {
  const navigate = useNavigate();
  const { setMe, reloadMe } = useMe();
  const prefsForm = usePreferencesForm(me, setMe);

  // Hidrata o form de preferências quando o usuario chega — do cache
  // (instantaneo) ou da rede.
  useEffect(() => {
    prefsForm.resetFrom(me);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  return (
    <>
      <Link to="/profile/dashboard" className="press flex items-center gap-3 card bg-card rounded-md p-4 mb-[14px]">
        <SquaresFour size={20} className="text-zinc-400" />
        <span className="flex-1"><span className="block text-sm">Dashboard</span><span className="block text-xs text-zinc-400">Indicadores, ícones e cores</span></span>
        <CaretRight size={16} />
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-[14px] items-start">
        <div className="flex flex-col gap-[14px]">
          <ProfileIdentityCard me={me} onSaved={setMe} />

          <div className="card elev-sm bg-card rounded-md p-[16px]">
            <h3 className="text-base font-medium mb-1">Preferências de aposta</h3>
            <p className="text-sm opacity-55 mb-3">Usadas pelo bot do Telegram ao calcular recomendações e notificações de sinal.</p>
            <div className="grid grid-cols-2 gap-3">
              <PreferencesFields form={prefsForm} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={prefsForm.handleDiscard}>Descartar</Button>
              <Button onClick={prefsForm.handleSave} disabled={!prefsForm.canSave}>{prefsForm.saving ? "Salvando…" : "Salvar alterações"}</Button>
            </div>
          </div>

          <ExportDataCard totalBets={summary.totalBets} />
        </div>

        <div className="flex flex-col gap-[14px]">
          <TelegramCard isLinked={!!me.telegramUserId} onUnlinked={reloadMe} />

          <div className="card elev-sm bg-card rounded-md p-[16px]">
            <h3 className="text-base font-medium mb-2">Resumo da banca</h3>
            <div className="divide-y divide-border">
              <div className="flex justify-between py-2 text-sm"><span className="opacity-60">Apostas</span><span className="font-medium tabular-nums">{summary.totalBets.toLocaleString("pt-BR")}</span></div>
              <div className="flex justify-between py-2 text-sm">
                <span className="opacity-60">Lucro acumulado</span>
                <span className={`font-medium tabular-nums ${summary.totalProfit >= 0 ? "text-positive" : "text-negative"}`}>
                  {formatSignedCurrency(summary.totalProfit)}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="opacity-60">ROI histórico</span>
                <span className={`font-medium tabular-nums ${summary.roi >= 0 ? "text-positive" : "text-negative"}`}>
                  {(summary.roi * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm"><span className="opacity-60">Casas</span><span className="font-medium tabular-nums">{summary.totalHouses.toLocaleString("pt-BR")}</span></div>
            </div>
          </div>

          <div className="card elev-sm bg-card rounded-md p-[16px]">
            <h3 className="text-base font-medium mb-3">Sessão</h3>
            <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/logout")}>
              <SignOut size={16} /> Sair da conta
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
