/**
 * face-api.js + SSD MobileNet: o "match" usa distância euclidiana entre
 * descritores de 128 dimensões — não retorna probabilidade de confiança
 * (tipo softmax). O valor costuma situar-se na faixa ~0,15–0,5 para o mesmo
 * sujeito em condições normais, com limiar empírico 0,6.
 *
 * A fórmula antiga (1 - distance) * 100 assumia distance ∈ [0,1], o que
 * ancorava percentuais artificialmente no meio (~55–65%) para distâncias
 * reais comuns ~0,35–0,45.
 *
 * Aqui, percentuais exibidos são "compatibilidade" relativa ao limiar. O mapeamento
 * linear puro muitas vezes ficava com valores baixos; aplicamos uma curva
 * (expoente < 1) que mantém a ordem (menor distância → maior %) e deixa a faixa
 * mais "generosa" visualmente, sem ser constante.
 */
export const FACE_MATCH_DISTANCE_THRESHOLD = 0.6;

/** < 1 eleva o meio da faixa; manter a ordem monotônica. Típ. 0,4–0,5. */
const SIMILARITY_DISPLAY_GAMMA = 0.4;

/**
 * Converte distância euclidiana em percentual 0–100 (compatibilidade exibida).
 * `linear = (limiar - d) / limiar`; depois `100 * linear^γ` (γ<1 suaviza para cima).
 */
export function distanceToSimilarityPercent(
  distance: number | null | undefined,
  threshold: number = FACE_MATCH_DISTANCE_THRESHOLD
): number {
  if (distance == null || Number.isNaN(distance) || distance >= threshold) {
    return 0;
  }
  if (distance < 0) {
    return 100;
  }
  const linear = (threshold - distance) / threshold;
  const t = Math.min(1, Math.max(0, linear));
  return Math.round(100 * t ** SIMILARITY_DISPLAY_GAMMA);
}

/**
 * Só em desenvolvimento: distância bruta, percentual, limiar (validação no console).
 */
export function logFaceMatchDebug(
  context: string,
  distance: number,
  displayPercent: number
): void {
  if (!import.meta.env.DEV) return;
  const payload = {
    distancia: Number(distance.toFixed(4)),
    limiar: FACE_MATCH_DISTANCE_THRESHOLD,
    percentualExibido: displayPercent,
    nota: `100 * linear^${SIMILARITY_DISPLAY_GAMMA}, linear=(limiar-dist)/limiar`,
  };
  if (typeof globalThis !== "undefined" && "console" in globalThis) {
    globalThis.console.debug(`[reconhecimento-facial] ${context}`, payload);
  }
}
