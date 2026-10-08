import { useRef } from "react";
import { CircleNotch, ImageSquare, Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { HouseAvatar } from "@/components/ui/house-avatar";
import { useSetAdminHouseLogo } from "@/hooks/queries/use-admin";
import { adminLogoUrl, toHouseLogoPng } from "@/lib/house-logo";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import type { AdminHouse } from "@/api/routes/get-admin";
import { cn } from "@/lib/utils";

/**
 * Avatar clicável: escolhe uma imagem, o navegador reduz pra 128px e envia.
 * `withLabel` mostra os textos ao lado (folha do celular); sem ele é só o
 * avatar com o lixo no hover (linha do desktop).
 */
export function HouseLogoPicker({ house, withLabel = false }: { house: AdminHouse; withLabel?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const setLogo = useSetAdminHouseLogo();

  const send = (logo: Blob | null) =>
    setLogo.mutate(
      { id: house.id, logo },
      {
        onSuccess: () => actionToast.success({ title: logo ? "Logo atualizado" : "Logo removido" }),
        onError: (err) => actionToast.error({ description: getErrorMessage(err, "Não foi possível salvar o logo.") }),
      },
    );

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      send(await toHouseLogoPng(file));
    } catch {
      actionToast.error({ description: "Não consegui ler essa imagem. Use PNG, JPEG ou WebP." });
    }
  };

  const fileInput = (
    <input
      ref={input}
      type="file"
      accept="image/png,image/jpeg,image/webp"
      className="hidden"
      onChange={(e) => {
        void pick(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  // Folha do celular: o logo numa moldura com a mesma borda e fundo dos
  // inputs (parece parte do formulário) e ações como botões de verdade.
  if (withLabel) {
    return (
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={setLogo.isPending}
          aria-label={`Trocar logo de ${house.name}`}
          className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-input bg-card p-1.5 focus-visible:outline-none focus-visible:border-accent"
        >
          <HouseAvatar
            name={house.name}
            logoUrl={adminLogoUrl(house)}
            className={cn("h-full w-full rounded-lg text-base", !house.isActive && "opacity-50")}
          />
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/55 text-white transition-opacity",
              setLogo.isPending ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            {setLogo.isPending ? <CircleNotch size={18} className="animate-spin" /> : <ImageSquare size={18} />}
          </span>
        </button>

        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={setLogo.isPending} onClick={() => input.current?.click()}>
              <ImageSquare /> {house.logoVersion ? "Trocar" : "Enviar"}
            </Button>
            {house.logoVersion && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={setLogo.isPending}
                onClick={() => send(null)}
                className="text-zinc-400 hover:bg-danger/10 hover:text-danger active:bg-danger/[0.16]"
              >
                <Trash /> Remover
              </Button>
            )}
          </div>
          <p className="text-xs text-zinc-500">
            {house.logoVersion ? "Sem logo, mostramos as iniciais." : "PNG, JPEG ou WebP, de preferência quadrada."}
          </p>
        </div>

        {fileInput}
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 shrink-0">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={setLogo.isPending}
        aria-label={`Trocar logo de ${house.name}`}
        title="Trocar logo"
        className="relative rounded-[9px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <HouseAvatar name={house.name} logoUrl={adminLogoUrl(house)} className={cn(!house.isActive && "opacity-50")} />
        <span className="absolute inset-0 rounded-[9px] flex items-center justify-center bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          {setLogo.isPending ? <CircleNotch size={14} className="animate-spin" /> : <ImageSquare size={14} />}
        </span>
      </button>

      {house.logoVersion && (
        <button
          type="button"
          onClick={() => send(null)}
          aria-label={`Remover logo de ${house.name}`}
          title="Remover logo"
          className="-ml-2 w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-45 hover:!opacity-100 transition"
        >
          <Trash size={13} />
        </button>
      )}

      {fileInput}
    </div>
  );
}
