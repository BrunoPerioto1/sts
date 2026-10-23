import { useState } from "react";
import { ArrowsLeftRight, ChartBar, DownloadSimple, Receipt } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { exportAllBetsCsv, exportMonthlyCsv, exportTransactionsCsv } from "@/lib/bet-exports";
import { formatInt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useProGate } from "@/hooks/queries/use-plan";
import { SETTINGS_CARD } from "./SettingsSection";

export function ExportDataCard({ totalBets }: { totalBets: number }) {
  const [running, setRunning] = useState<string | null>(null);
  const proGate = useProGate();

  // Sem isso a falha (rede, 400) virava promise rejeitada solta: o botão não
  // fazia nada e ninguém ficava sabendo.
  const download = async (label: string, run: () => Promise<void>) => {
    if (!proGate("csvExport", "Exportar CSV")) return;
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
    { label: "Apostas", sub: `${formatInt(totalBets)} linhas · todas as casas`, icon: Receipt, onClick: exportAllBetsCsv },
    { label: "Movimentações", sub: "Depósitos, saques e ajustes", icon: ArrowsLeftRight, onClick: exportTransactionsCsv },
    { label: "Resumo mensal", sub: "Lucro e ROI por mês", icon: ChartBar, onClick: exportMonthlyCsv },
  ];

  return (
    <ul className={cn(SETTINGS_CARD, "divide-y divide-border")}>
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-3 px-5 py-4">
          <span className="h-10 w-10 shrink-0 rounded-lg bg-foreground/[0.04] flex items-center justify-center text-zinc-400" aria-hidden="true">
            <row.icon size={18} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-medium">{row.label}</span>
            <span className="block text-[13px] text-zinc-400 mt-0.5">{row.sub}</span>
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={running !== null}
            onClick={() => void download(row.label, row.onClick)}
            aria-label={`Baixar ${row.label} em CSV`}
          >
            <DownloadSimple /> {running === row.label ? "Baixando…" : "Baixar CSV"}
          </Button>
        </li>
      ))}
    </ul>
  );
}
