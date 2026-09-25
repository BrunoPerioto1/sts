import { useState } from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { exportAllBetsCsv, exportMonthlyCsv, exportTransactionsCsv } from "@/lib/bet-exports";

export function ExportDataCard({ totalBets }: { totalBets: number }) {
  const [running, setRunning] = useState<string | null>(null);

  // Sem isso a falha (rede, 400) virava promise rejeitada solta: o botão não
  // fazia nada e ninguém ficava sabendo.
  const download = async (label: string, run: () => Promise<void>) => {
    setRunning(label);
    try {
      await run();
    } catch (err) {
      actionToast.error({ description: getErrorMessage(err, `Não foi possível baixar ${label.toLowerCase()}.`) });
    } finally {
      setRunning(null);
    }
  };

  const rows = [
    { label: "Apostas", sub: `${totalBets.toLocaleString("pt-BR")} linhas · todas as casas`, onClick: exportAllBetsCsv },
    { label: "Movimentações", sub: "depósitos, saques e ajustes", onClick: exportTransactionsCsv },
    { label: "Resumo mensal", sub: "lucro e ROI por mês", onClick: exportMonthlyCsv },
  ];

  return (
    <section aria-labelledby="export-title">
      <h2 id="export-title" className="text-base font-semibold">Dados</h2>
      <p className="text-[13px] text-zinc-400 mt-1 mb-3">Arquivos CSV com separador ";", que abrem direto no Excel.</p>
      <ul className="rounded-xl border border-border divide-y divide-border">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3 px-4 py-3">
            <span className="flex-1 min-w-0">
              <span className="block text-sm">{row.label}</span>
              <span className="block text-xs text-zinc-500">{row.sub}</span>
            </span>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={running !== null}
              onClick={() => void download(row.label, row.onClick)}
              aria-label={`Baixar ${row.label}`}
            >
              <DownloadSimple size={14} /> {running === row.label ? "Baixando…" : "Baixar"}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
