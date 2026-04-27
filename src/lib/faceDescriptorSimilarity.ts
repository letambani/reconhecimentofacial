/**
 * face-api.js + SSD MobileNet: o "match" usa distância euclidiana entre
 * descritores de 128 dimensões — não retorna probabilidade de confiança
 * (tipo softmax). O valor costuma situar-se na faixa ~0,15–0,5 para o mesmo
 * sujeito em condições normais, com limiar empírico 0,6.
 *
 * O LIMIAR 0,6 (FACE_MATCH_DISTANCE_THRESHOLD) só define se há correspondência
 * no banco — não muda aqui. Para a % EXIBIDA ("fidelidade"/compatibilidade),
 * usamos uma base mais larga que o limiar: a mesma distância (ex.: 0,42) com
 * leve diferença de ângulo deixa de parecer "baixa" por estar normalizada só
 * até 0,6. Referência de exibição maior aproxima o que o utilizador espera
 * (mesma pessoa, luz e momento).
 */
export const FACE_MATCH_DISTANCE_THRESHOLD = 0.6;

/**
 * Só afeta o número mostrado. Distância acima disso mapeia em 0 % na exibição
 * (os matches reais vêm com d < 0,6). Valor > limiar = escala visual mais
 * "generosa" para a mesma distância física.
 */
const SIMILARITY_DISPLAY_REFERENCE = 0.88;

/**
 * Curvatura < 1 suavisa para cima; junto com DISPLAY_REFERENCE, preserva
 * diferenças (monotônico) sem esmagar tudo.
 */
const SIMILARITY_DISPLAY_GAMMA = 0.28;

/**
 * Converte distância euclidiana em percentual 0–100 (fidelidade/compatibilidade).
 * Só se aplica a distâncias < limiar de match; ordem: menor d → maior %.
 */
export function distanceToSimilarityPercent(
  distance: number | null | undefined,
  matchThreshold: number = FACE_MATCH_DISTANCE_THRESHOLD
): number {
  if (distance == null || Number.isNaN(distance) || distance >= matchThreshold) {
    return 0;
  }
  if (distance < 0) {
    return 100;
  }
  // Base mais larga que o limiar: (ref - d) / ref, em [0, 1) para d < ref
  const t = (SIMILARITY_DISPLAY_REFERENCE - distance) / SIMILARITY_DISPLAY_REFERENCE;
  const clamped = Math.min(1, Math.max(0, t));
  return Math.round(100 * clamped ** SIMILARITY_DISPLAY_GAMMA);
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
    limiarMatch: FACE_MATCH_DISTANCE_THRESHOLD,
    referenciaExibicao: SIMILARITY_DISPLAY_REFERENCE,
    gama: SIMILARITY_DISPLAY_GAMMA,
    percentualExibido: displayPercent,
    nota:
      "100 * ((ref-d)/ref)^gama; ref > limiar para fidelidade mais estável (ângulo/luz)",
  };
  if (typeof globalThis !== "undefined" && "console" in globalThis) {
    globalThis.console.debug(`[reconhecimento-facial] ${context}`, payload);
  }
}
