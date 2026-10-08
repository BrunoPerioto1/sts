import { houseLogoUrl } from "@/api/routes/get-houses";
import type { AdminHouse } from "@/api/routes/get-admin";

/** URL do avatar a partir da linha do admin (que inclui as inativas). */
export const adminLogoUrl = (house: AdminHouse) => (house.logoVersion ? houseLogoUrl(house.id, house.logoVersion) : null);

// Avatar de casa: o servidor guarda o que receber (até 200 KB) e serve com
// cache eterno, então quem reduz é o navegador — 128px já cobre o maior avatar
// (40px) em tela 3x.
const SIZE = 128;

/**
 * Imagem escolhida → PNG quadrado de 128px. Quase quadrada (logo de app) é
 * cortada pra preencher; retangular (nome escrito) cabe inteira, com o fundo
 * pintado da cor do canto da própria imagem — sem faixa branca em volta.
 */
export async function toHouseLogoPng(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");

  const { width: w, height: h } = bitmap;
  const ratio = w / h;
  if (ratio > 0.8 && ratio < 1.25) {
    const side = Math.min(w, h);
    ctx.drawImage(bitmap, (w - side) / 2, (h - side) / 2, side, side, 0, 0, SIZE, SIZE);
  } else {
    ctx.drawImage(bitmap, 0, 0, 1, 1, 0, 0, SIZE, SIZE);
    const scale = SIZE / Math.max(w, h);
    const dw = w * scale;
    const dh = h * scale;
    ctx.drawImage(bitmap, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh);
  }
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar PNG"))), "image/png"),
  );
}
