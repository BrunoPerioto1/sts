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
  matchedTips: MatchedTip[];
}

/** Abaixo disso o campo entra em amarelo como "confira". */
export const LOW_CONFIDENCE = 0.7;

export function parseBetImage(image: Blob, houseHint?: string) {
  const form = new FormData();
  // O nome do arquivo importa: sem ele o multer recebe o campo como texto.
  form.append('image', image, 'bilhete.webp');
  if (houseHint) form.append('houseHint', houseHint);
  return unwrap<ParsedBetSlip>(api.bets.post('parse-image', form));
}
