import { useState } from "react";
import { cn } from "@/lib/utils";
import { houseColor, houseInitials } from "@/lib/format";
import { useHouseLogoUrl } from "@/hooks/queries/use-houses";

const SIZES = {
  sm: "h-6 w-6 rounded-md text-[10px]",
  md: "h-8 w-8 rounded-[9px] text-xs",
  lg: "h-10 w-10 rounded-[11px] text-sm",
} as const;

/**
 * Avatar da casa: o logo gravado no banco (betting_houses.logo),
 * servido pela nossa própria API — o navegador não fala com terceiro,
 * então a lista de casas não vaza. Sem logo, ou se a imagem não carregar
 * (offline no PWA), ficam as duas letras do nome sobre uma cor derivada do
 * próprio nome (hash — a mesma casa tem a mesma cor em todas as telas).
 */
export function HouseAvatar({
  name,
  size = "md",
  className,
  logoUrl: logoOverride,
}: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** URL já conhecida (admin, que também lista inativas). null = sem logo; omitido = procura pelo nome. */
  logoUrl?: string | null;
}) {
  const byName = useHouseLogoUrl(name);
  const logoUrl = logoOverride === undefined ? byName : (logoOverride ?? undefined);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (logoUrl && failedUrl !== logoUrl) {
    // Muito logo é ícone de app com canto arredondado transparente ou um filete
    // claro na borda: com fundo branco atrás, isso vazava como um resquício de
    // borda branca. Sem fundo, e com um leve zoom dentro do recorte, a borda
    // embutida na imagem fica pra fora.
    return (
      <span aria-hidden="true" className={cn("shrink-0 overflow-hidden", SIZES[size], className)}>
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(logoUrl)}
          className="h-full w-full scale-[1.12] object-cover"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn("shrink-0 flex items-center justify-center font-semibold text-white tracking-tight", SIZES[size], className)}
      style={{ background: houseColor(name) }}
    >
      {houseInitials(name)}
    </span>
  );
}
