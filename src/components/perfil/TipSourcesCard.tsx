import { Checkbox } from "@/components/ui/checkbox";
import { useMyTipSources, useSetMyTipSource } from "@/hooks/queries/use-tip-sources";
import { actionToast } from "@/lib/action-toast";
import { cn } from "@/lib/utils";

/**
 * Fontes de tips que o usuário recebe. Salva no clique, fora do "Salvar
 * alterações" da tela: é um liga/desliga, não um campo de formulário. Some
 * quando não há fonte cadastrada — aí só existe o canal principal.
 *
 * `bare`: sem a moldura de card (Preferências no celular, que é lista solta).
 */
export function TipSourcesCard({ bare = false }: { bare?: boolean }) {
  const { data } = useMyTipSources();
  const set = useSetMyTipSource();
  if (!data?.length) return null;

  return (
    <section
      className={cn(!bare && "rounded-xl border border-border bg-card p-5")}
      aria-labelledby="tip-sources-title"
    >
      <h2 id="tip-sources-title" className={bare ? "text-sm font-normal text-zinc-400" : "text-base font-semibold"}>
        Fontes de tips
      </h2>
      <p className={cn("text-[13px] text-zinc-500 mt-1", bare ? "mb-2" : "mb-3")}>
        As do canal principal sempre chegam. Fonte desligada não manda tip no Telegram e some das pendentes; o que
        você já planilhou continua.
      </p>
      <ul className="divide-y divide-border">
        {data.map((source) => (
          <li key={source.id}>
            <label className="flex items-center gap-3 min-h-[48px] sm:min-h-[40px] cursor-pointer">
              <Checkbox
                checked={source.enabled}
                onCheckedChange={(v) =>
                  set.mutate(
                    { id: source.id, enabled: v === true },
                    {
                      onSuccess: (_r, { enabled }) =>
                        actionToast.success({ title: enabled ? `${source.name} ligada` : `${source.name} desligada` }),
                      onError: (e) => actionToast.error({ description: (e as Error).message }),
                    },
                  )
                }
              />
              <span className={cn("text-sm", !source.enabled && "opacity-50")}>{source.name}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
