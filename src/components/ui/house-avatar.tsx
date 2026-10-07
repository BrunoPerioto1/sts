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
export function HouseAvatar({ name, size = "md", className }: { name: string; size?: keyof typeof SIZES; className?: string }) {
  const logoUrl = useHouseLogoUrl(name);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (logoUrl && failedUrl !== logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        onError={() => setFailedUrl(logoUrl)}
        className={cn("shrink-0 object-cover bg-white", SIZES[size], className)}
      />
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
