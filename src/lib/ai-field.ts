import { type AiFieldMark } from "@/hooks/apostas/use-aposta-form";

/**
 * Campo lido com baixa confiança ganha moldura âmbar, como no design.
 *
 * Vive fora do AiFieldLabel.tsx de propósito: um arquivo que exporta
 * componente e função quebra o Fast Refresh do Vite, e o módulo antigo fica
 * preso no cache do dev server.
 */
export function aiFieldRing(mark?: AiFieldMark) {
  return mark?.check
    ? "border-pending/50 bg-pending/[0.06] focus-visible:ring-pending"
    : undefined;
}
