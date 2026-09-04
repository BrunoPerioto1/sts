import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionToast } from "@/lib/action-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePreferencesForm } from "@/hooks/use-preferences-form";
import { PreferencesFields } from "@/components/perfil/PreferencesFields";
import { postTelegramLinkCode } from "@/api/routes/post-telegram-link";
import { postUnlinkTelegram } from "@/api/routes/post-unlink-telegram";
import { type MeResponse } from "@/api/routes/get-me";
import { patchMe } from "@/api/routes/patch-me";
import { getDashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import { useMe } from "@/hooks/queries/use-me";
import { useHouses } from "@/hooks/queries/use-houses";
import { getBets } from "@/api/routes/get-bets";
import { getTransactions } from "@/api/routes/get-transaction";
import { getDashboardMonthlySummary } from "@/api/routes/get-dashboard-monthly";
import { formatCurrencyCompact, formatSignedCurrency, formatSignedCurrencyCompact } from "@/lib/format";
import { getErrorMessage } from "@/lib/api-error";
import { TelegramLogo, DownloadSimple, SignOut, IdentificationCard, SlidersHorizontal, CaretRight } from "@phosphor-icons/react";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function preferencesSummary(me: MeResponse): string {
  const stake = me.stake != null ? Number(me.stake) : null;
  const filter = me.minPercentFilter != null ? Number(me.minPercentFilter) : null;
  if (stake == null && filter == null) return "Não configurado";
  const parts: string[] = [];
  if (stake != null) parts.push(formatCurrencyCompact(stake));
  if (filter != null) parts.push(`${filter.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`);
  return parts.join(" · ");
}

export default function PerfilPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [linking, setLinking] = useState(false);
  const [code, setCode] = useState<string>("");
  const { me, setMe, reloadMe } = useMe();
  const [form, setForm] = useState({ username: "", email: "" });
  const [saving, setSaving] = useState(false);

  const prefsForm = usePreferencesForm(me, setMe);

  // Chave sob "dashboard" de proposito: e a mesma metrica que o dashboard
  // mostra, entao uma aposta nova invalida as duas de uma vez.
  const metricsQuery = useQuery({
    queryKey: ["dashboard", "metrics", "all-time"],
    queryFn: () => getDashboardMetrics({}),
  });
  const houses = useHouses();

  const summary = {
    totalBets: Number(metricsQuery.data?.totalBets ?? 0),
    totalProfit: Number(metricsQuery.data?.totalProfit ?? 0),
    roi: Number(metricsQuery.data?.roi ?? 0),
    totalHouses: houses.length,
  };

  // Hidrata os forms quando o usuario chega — do cache (instantaneo) ou da rede.
  useEffect(() => {
    if (!me) return;
    setForm({ username: me.username, email: me.email });
    prefsForm.resetFrom(me);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const handleGenerateTelegramCode = async () => {
    try {
      setLinking(true);
      const res = await postTelegramLinkCode();
      setCode(res.code);
      try { await navigator.clipboard.writeText(res.code); } catch { /* clipboard write is best-effort */ }
      actionToast.success({ title: "Código gerado", description: `Use no bot: /vincular ${res.code}` });
    } catch (error) {
      actionToast.error({ description: getErrorMessage(error, "Falha ao gerar código.") });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    try {
      await postUnlinkTelegram();
      actionToast.success({ title: "Telegram desvinculado" });
      reloadMe();
    } catch (error) {
      actionToast.error({ description: getErrorMessage(error, "Falha ao desvincular.") });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await patchMe(form);
      setMe(updated);
      actionToast.success({ title: "Perfil atualizado" });
    } catch (error) {
      actionToast.error({ description: getErrorMessage(error, "Falha ao salvar.") });
    } finally {
      setSaving(false);
    }
  };

  const exportBets = async () => {
    const res = await getBets({ perPage: 5000, page: 1 });
    const rows = (res.data ?? []).map((b) => [
      new Date(b.betTime).toLocaleDateString("pt-BR"),
      b.game,
      b.market,
      b.houseName ?? "",
      Number(b.odd).toFixed(2),
      Number(b.stake).toFixed(2),
      b.resultName ?? "",
      b.profit != null ? Number(b.profit).toFixed(2) : "",
    ]);
    downloadCsv("apostas.csv", ["Data", "Evento", "Mercado", "Casa", "Odd", "Stake", "Status", "Retorno"], rows);
  };

  const exportTransactions = async () => {
    const txs = await getTransactions({});
    const rows = txs.map((t) => [new Date(t.createdAt).toLocaleDateString("pt-BR"), t.houseName, t.transactionType, Number(t.value).toFixed(2)]);
    downloadCsv("movimentacoes.csv", ["Data", "Casa", "Tipo", "Valor"], rows);
  };

  const exportMonthly = async () => {
    const monthly = await getDashboardMonthlySummary();
    const rows = monthly.map((m) => [m.month, m.totalBets, m.profitMonth.toFixed(2)]);
    downloadCsv("resumo-mensal.csv", ["Mês", "Apostas", "Lucro"], rows);
  };

  if (!me) return <MainLayout title="Perfil"><div className="opacity-55 text-sm">Carregando…</div></MainLayout>;

  const isLinked = !!me.telegramUserId;

  if (isMobile) {
    return (
      <MainLayout
        title="Perfil"
        hideHeaderBorder
        mobileHeader={<h1 className="text-base font-semibold">Perfil</h1>}
      >
        <div className="flex flex-col min-h-[calc(100dvh-220px)] space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white text-zinc-900 flex items-center justify-center text-base font-semibold shrink-0">
              {initialsOf(me.username)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-white truncate">{me.username}</p>
              <p className="text-sm text-zinc-500 truncate">{me.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Apostas</p>
              <p className="text-xl font-semibold text-white">{summary.totalBets.toLocaleString("pt-BR")}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Lucro acumulado</p>
              <p className={`text-xl font-semibold ${summary.totalProfit >= 0 ? "text-positive" : "text-negative"}`}>
                {formatSignedCurrencyCompact(summary.totalProfit)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-xs uppercase tracking-wider text-zinc-500">ROI histórico</p>
              <p className={`text-xl font-semibold ${summary.roi >= 0 ? "text-positive" : "text-negative"}`}>
                {(summary.roi * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Casas</p>
              <p className="text-xl font-semibold text-white">{summary.totalHouses.toLocaleString("pt-BR")}</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 divide-y divide-white/[0.06]">
            <Link to="/profile/account" className="h-14 px-4 flex items-center gap-3">
              <IdentificationCard size={18} className="text-zinc-400 shrink-0" />
              <span className="text-sm text-white flex-1 min-w-0 truncate">Dados da conta</span>
              <span className="text-sm text-zinc-500 truncate max-w-[40%]">{me.username}</span>
              <CaretRight size={16} className="text-zinc-500 shrink-0" />
            </Link>
            <Link to="/profile/telegram" className="h-14 px-4 flex items-center gap-3">
              <TelegramLogo size={18} className="text-zinc-400 shrink-0" />
              <span className="text-sm text-white flex-1 min-w-0 truncate">Telegram</span>
              <span className="text-sm text-zinc-500 truncate">{isLinked ? "Vinculado" : "Não vinculado"}</span>
              <CaretRight size={16} className="text-zinc-500 shrink-0" />
            </Link>
            <Link to="/profile/preferences" className="h-14 px-4 flex items-center gap-3">
              <SlidersHorizontal size={18} className="text-zinc-400 shrink-0" />
              <span className="text-sm text-white flex-1 min-w-0 truncate">Preferências de aposta</span>
              <span className="text-sm text-zinc-500 truncate max-w-[40%]">{preferencesSummary(me)}</span>
              <CaretRight size={16} className="text-zinc-500 shrink-0" />
            </Link>
          </div>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => navigate("/logout")}
            className="w-full h-12 rounded-xl border border-white/10 bg-transparent flex items-center justify-center gap-2 text-sm text-white"
          >
            <SignOut size={16} /> Sair da conta
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Perfil">
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-[14px] items-start">
        <div className="flex flex-col gap-[14px]">
          <div className="card elev-sm bg-card rounded-md p-[16px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-accent-800 text-accent-100 flex items-center justify-center text-lg font-medium shrink-0">
                {initialsOf(me.username)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-medium truncate">{me.username}</p>
                <p className="text-sm opacity-55 truncate">
                  {me.email}
                  {me.createdAt ? ` · na plataforma desde ${new Date(me.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}` : ""}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-zinc-500">Nome</Label>
                <Input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-zinc-500">E-mail</Label>
                <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setForm({ username: me.username, email: me.email })}>Descartar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</Button>
            </div>
          </div>

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

          <div className="card elev-sm bg-card rounded-md p-[16px]">
            <h3 className="text-base font-medium mb-1">Exportar dados</h3>
            <p className="text-sm opacity-55 mb-3">Baixe seus registros em CSV para planilha ou imposto de renda.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { label: "Apostas", sub: `${summary.totalBets.toLocaleString("pt-BR")} linhas`, onClick: exportBets },
                { label: "Movimentações", sub: "histórico completo", onClick: exportTransactions },
                { label: "Resumo mensal", sub: "por mês", onClick: exportMonthly },
              ].map((block) => (
                <div key={block.label} className="rounded-md p-[14px] flex flex-col gap-2" style={{ background: "var(--color-bg)" }}>
                  <span className="text-sm font-medium">{block.label}</span>
                  <span className="text-xs opacity-55">{block.sub}</span>
                  <Button size="sm" variant="outline" className="gap-2 self-start" onClick={block.onClick}>
                    <DownloadSimple size={14} /> Baixar CSV
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs opacity-40 mt-3">Exporta todos os registros · separador ponto-e-vírgula (;)</p>
          </div>
        </div>

        <div className="flex flex-col gap-[14px]">
          <div className="card elev-sm bg-card rounded-md p-[16px]">
            <div className="flex items-center gap-2 mb-1">
              <TelegramLogo size={18} className="text-accent" />
              <h3 className="text-base font-medium">Telegram</h3>
              <span className={`tag ml-auto text-xs px-[10px] py-[3px] rounded-[6px] ${isLinked ? "bg-positive/[0.16] text-positive" : "bg-neutral-800 text-neutral-100"}`}>
                {isLinked ? "Vinculado" : "Não vinculado"}
              </span>
            </div>
            <p className="text-sm opacity-55 mb-3">Registre apostas por mensagem e receba o resumo do dia.</p>
            {isLinked ? (
              <Button variant="outline" size="sm" onClick={handleUnlinkTelegram}>Desvincular</Button>
            ) : (
              <div className="space-y-2">
                <Button size="sm" onClick={handleGenerateTelegramCode} disabled={linking}>
                  {linking ? "Gerando…" : "Vincular Telegram"}
                </Button>
                {code && <p className="text-sm">Código: <span className="font-mono">{code}</span> — envie <span className="font-mono">/vincular {code}</span> no bot.</p>}
              </div>
            )}
          </div>

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
    </MainLayout>
  );
}
