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
 * Aqui, percentuais exibidos são "compatibilidade" relativa ao limiar: quanto
 * mais perto de 0 a distância, maior o valor; no limiar → 0%.
 */
export const FACE_MATCH_DISTANCE_THRESHOLD = 0.6;

/**
 * Converte distância euclidiana em percentual 0–100, usando o limiar de match
 * como extremo superior. Válido só para distâncias abaixo do limiar.
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
  return Math.round((100 * (threshold - distance)) / threshold);
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
    nota: "Percentual = 100 * (limiar - distância) / limiar, não (1 - d)*100",
  };
  if (typeof globalThis !== "undefined" && "console" in globalThis) {
    globalThis.console.debug(`[reconhecimento-facial] ${context}`, payload);
  }
}
