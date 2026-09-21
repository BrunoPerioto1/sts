import { api } from '../apiClient';
import { unwrap } from '../request';

export interface ParsedHouse {
  id: number;
  name: string;
}

export interface MatchedTip {
  tipId: number;
  /** Score de 0 a 1 do matching local (sem IA). */
  score: number;
  event: string;
  market: string;
  odd: number | null;
  stake: number | null;
  at: string;
}

export interface ParsedBetSlip {
  event: string | null;
  market: string | null;
  sport: string | null;
  house: ParsedHouse | null;
  /** Odd final, já com o boost aplicado. */
  odd: number | null;
  /** Odd antes do boost; null quando o bilhete não tinha boost. */
  originalOdd: number | null;
  stake: number | null;
  /**
   * Heurística de 0 a 1 por campo — não é probabilidade do modelo. Só decide
   * o que a tela marca em amarelo pedindo conferência.
   */
  confidence: Record<string, number>;
  /** Campos que a IA não identificou no print, em português e prontos pra tela. */
  missing: string[];
  /** Odd que não estava no bilhete — saiu do produto das seleções. Confira. */
  oddFromSelections: boolean;
  matchedTips: MatchedTip[];
}

/** Abaixo disso o campo entra em amarelo como "confira". */
export const LOW_CONFIDENCE = 0.7;

/**
 * Teto de espera da leitura. A function do Vercel morre em 60s e o backend
 * corta a IA antes disso; sem timeout aqui uma conexão que morre no meio
 * deixava a tela girando "Lendo bilhete…" para sempre.
 */
const READ_TIMEOUT_MS = 75_000;

/**
 * Lê UM bilhete. Mais de uma imagem = partes do mesmo bilhete (print grande
 * dividido), nunca apostas diferentes — lote é uma chamada por bilhete.
 */
export function parseBetImage(images: Blob | Blob[], houseHint?: string) {
  const form = new FormData();
  const parts = Array.isArray(images) ? images : [images];
  // O nome do arquivo importa: sem ele o multer recebe o campo como texto.
  parts.forEach((part, i) => form.append('images', part, `bilhete-${i + 1}.webp`));
  if (houseHint) form.append('houseHint', houseHint);
  return unwrap<ParsedBetSlip>(
    api.bets.post('parse-image', form, { timeout: READ_TIMEOUT_MS }),
  );
}
