const MAX_EDGE = 1600;
const QUALITY = 0.82;

/**
 * Reduz o print antes do upload: o bilhete é texto grande num screenshot de
 * celular, então 1600px no lado maior não custa leitura nenhuma e derruba um
 * PNG de 3 MB para algumas centenas de KB — o suficiente para caber com folga
 * no limite de body da serverless function.
 *
 * Se qualquer etapa falhar (canvas bloqueado, formato exótico), devolve o
 * arquivo original: melhor mandar pesado do que não mandar.
 */
export async function compressImage(file: Blob): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      // Safari mais velho ignora image/webp e devolve PNG; o jpeg é o fallback
      // explícito para não subir um PNG reescalado, que sai maior.
      canvas.toBlob(resolve, 'image/webp', QUALITY);
    });
    if (blob?.type === 'image/webp') return blob;

    const jpeg = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', QUALITY);
    });
    return jpeg ?? blob ?? file;
  } catch {
    return file;
  }
}
