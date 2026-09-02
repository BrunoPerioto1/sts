import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { postTelegramLinkCode } from "@/api/routes/post-telegram-link";
import { postUnlinkTelegram } from "@/api/routes/post-unlink-telegram";
import { getMe, type MeResponse } from "@/api/routes/get-me";
import { patchMe } from "@/api/routes/patch-me";
import { getDashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import { getAllHouses } from "@/api/routes/get-houses";
import { getBets } from "@/api/routes/get-bets";
import { getTransactions } from "@/api/routes/get-transaction";
import { getDashboardMonthlySummary } from "@/api/routes/get-dashboard-monthly";
import { TelegramLogo, DownloadSimple, SignOut } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

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

export default function PerfilPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [linking, setLinking] = useState(false);
  const [code, setCode] = useState<string>("");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [form, setForm] = useState({ username: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState({ totalBets: 0, totalProfit: 0, roi: 0, totalHouses: 0 });

  const loadMe = () => {
    getMe().then((data) => {
      setMe(data);
      setForm({ username: data.username, email: data.email });
    }).catch(() => undefined);
  };

  useEffect(() => {
    loadMe();
    Promise.all([getDashboardMetrics({}), getAllHouses()])
      .then(([metrics, houses]) => {
        setSummary({
          totalBets: Number(metrics.totalBets),
          totalProfit: Number(metrics.totalProfit),
          roi: Number(metrics.roi),
          totalHouses: houses.length,
        });
      })
      .catch(() => undefined);
  }, []);

  const handleGenerateTelegramCode = async () => {
    try {
      setLinking(true);
      const res = await postTelegramLinkCode();
      setCode(res.code);
      try { await navigator.clipboard.writeText(res.code); } catch {}
      toast({ title: "Código gerado", description: `Use no bot: /vincular ${res.code}` });
    } catch (error: any) {
      toast({ title: "Erro", description: error?.response?.data?.message || "Falha ao gerar código.", variant: "destructive" });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    try {
      await postUnlinkTelegram();
      toast({ title: "Telegram desvinculado" });
      loadMe();
    } catch (error: any) {
      toast({ title: "Erro", description: error?.response?.data?.message || "Falha ao desvincular.", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await patchMe(form);
      setMe(updated);
      toast({ title: "Perfil atualizado" });
    } catch (error: any) {
      toast({ title: "Erro", description: error?.response?.data?.message || "Falha ao salvar.", variant: "destructive" });
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

  return (
    <MainLayout title="Perfil">
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-[14px] items-start">
        <div className="flex flex-col gap-[14px]">
          <div className="card elev-sm bg-card rounded-md p-[16px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-accent-800 text-accent-100 flex items-center justify-center text-[19px] font-medium shrink-0">
                {initialsOf(me.username)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[19px] font-medium truncate">{me.username}</p>
                <p className="text-[12.5px] opacity-55 truncate">
                  {me.email}
                  {me.createdAt ? ` · na plataforma desde ${new Date(me.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}` : ""}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome</Label>
                <Input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">E-mail</Label>
                <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setForm({ username: me.username, email: me.email })}>Descartar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</Button>
            </div>
          </div>

          <div className="card elev-sm bg-card rounded-md p-[16px]">
            <h3 className="text-base font-medium mb-1">Exportar dados</h3>
            <p className="text-[12.5px] opacity-55 mb-3">Baixe seus registros em CSV para planilha ou imposto de renda.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { label: "Apostas", sub: `${summary.totalBets} linhas`, onClick: exportBets },
                { label: "Movimentações", sub: "histórico completo", onClick: exportTransactions },
                { label: "Resumo mensal", sub: "por mês", onClick: exportMonthly },
              ].map((block) => (
                <div key={block.label} className="rounded-md p-[14px] flex flex-col gap-2" style={{ background: "var(--color-bg)" }}>
                  <span className="text-[13.5px] font-medium">{block.label}</span>
                  <span className="text-[11.5px] opacity-55">{block.sub}</span>
                  <Button size="sm" variant="ghost" className="gap-2 self-start px-0" onClick={block.onClick}>
                    <DownloadSimple size={14} /> Baixar CSV
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-[11px] opacity-40 mt-3">Exporta todos os registros · separador ponto-e-vírgula (;)</p>
          </div>
        </div>

        <div className="flex flex-col gap-[14px]">
          <div className="card elev-sm bg-card rounded-md p-[16px]">
            <div className="flex items-center gap-2 mb-1">
              <TelegramLogo size={18} className="text-accent" />
              <h3 className="text-base font-medium">Telegram</h3>
              <span className={`tag ml-auto text-[11px] px-[10px] py-[3px] rounded-[6px] ${isLinked ? "bg-positive/[0.16] text-positive" : "bg-neutral-800 text-neutral-100"}`}>
                {isLinked ? "Vinculado" : "Não vinculado"}
              </span>
            </div>
            <p className="text-[12.5px] opacity-55 mb-3">Registre apostas por mensagem e receba o resumo do dia.</p>
            {isLinked ? (
              <Button variant="outline" size="sm" onClick={handleUnlinkTelegram}>Desvincular</Button>
            ) : (
              <div className="space-y-2">
                <Button size="sm" onClick={handleGenerateTelegramCode} disabled={linking}>
                  {linking ? "Gerando…" : "Vincular Telegram"}
                </Button>
                {code && <p className="text-[12.5px]">Código: <span className="font-mono">{code}</span> — envie <span className="font-mono">/vincular {code}</span> no bot.</p>}
              </div>
            )}
          </div>

          <div className="card elev-sm bg-card rounded-md p-[16px]">
            <h3 className="text-base font-medium mb-2">Resumo da banca</h3>
            <div className="divide-y divide-border">
              <div className="flex justify-between py-2 text-[13px]"><span className="opacity-60">Apostas</span><span className="font-medium tabular-nums">{summary.totalBets}</span></div>
              <div className="flex justify-between py-2 text-[13px]">
                <span className="opacity-60">Lucro acumulado</span>
                <span className={`font-medium tabular-nums ${summary.totalProfit >= 0 ? "text-positive" : "text-negative"}`}>
                  {summary.totalProfit >= 0 ? "+" : ""}R$ {summary.totalProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 text-[13px]">
                <span className="opacity-60">ROI histórico</span>
                <span className={`font-medium tabular-nums ${summary.roi >= 0 ? "text-positive" : "text-negative"}`}>{(summary.roi * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-2 text-[13px]"><span className="opacity-60">Casas</span><span className="font-medium tabular-nums">{summary.totalHouses}</span></div>
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
