import { useRef } from "react";
import { CircleNotch, ImageSquare, Trash } from "@phosphor-icons/react";
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
        <HouseAvatar
          name={house.name}
          logoUrl={adminLogoUrl(house)}
          size={withLabel ? "lg" : "md"}
          className={cn(!house.isActive && "opacity-50")}
        />
        <span className="absolute inset-0 rounded-[9px] flex items-center justify-center bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          {setLogo.isPending ? <CircleNotch size={14} className="animate-spin" /> : <ImageSquare size={14} />}
        </span>
      </button>

      {withLabel && (
        <div className="flex flex-col items-start gap-0.5">
          <button type="button" onClick={() => input.current?.click()} className="text-sm text-accent-text">
            {house.logoVersion ? "Trocar logo" : "Enviar logo"}
          </button>
          {house.logoVersion && (
            <button type="button" onClick={() => send(null)} className="text-xs text-zinc-500">
              Remover (volta às iniciais)
            </button>
          )}
        </div>
      )}
      {!withLabel && house.logoVersion && (
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
    </div>
  );
}
