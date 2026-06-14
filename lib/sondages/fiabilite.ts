/**
 * Calculs de fiabilité d'un résultat de sondage (session 2026-06-14).
 *
 * Toutes les marges se calculent sur la taille EFFECTIVE (n effectif), pas sur
 * le nombre brut de votes : le redressement gonfle la variance, ignorer ça
 * reviendrait à surestimer la précision.
 */

/** Z à 95 % (loi normale). */
const Z95 = 1.96;

/** En dessous de ce nombre de répondant·es, une cellule de croisement n'est pas publiable (fiabilité + anonymat). */
export const SEUIL_CELLULE = 30;

/** Taille d'échantillon effective d'un jeu de poids : (Σp)² / Σp². */
export function nEffectif(poids: number[]): number {
  let s = 0;
  let s2 = 0;
  for (const w of poids) {
    s += w;
    s2 += w * w;
  }
  return s2 > 0 ? (s * s) / s2 : 0;
}

/** Effet de plan de Kish : n·Σp² / (Σp)² (≥ 1). Mesure la perte de précision due à la pondération. */
export function effetDePlan(poids: number[]): number {
  const n = poids.length;
  const neff = nEffectif(poids);
  return neff > 0 ? n / neff : 1;
}

/**
 * Marge d'erreur à 95 % d'une proportion `p` (0–1) sur un échantillon de taille
 * `n` (utiliser le n EFFECTIF si les données sont redressées). Retourne une
 * proportion (0–1) ; multiplier par 100 pour des points de %.
 */
export function margeErreur95(p: number, n: number): number {
  if (n <= 0) return 1;
  const pBorne = Math.min(1, Math.max(0, p));
  return Z95 * Math.sqrt((pBorne * (1 - pBorne)) / n);
}

export interface Intervalle {
  bas: number;
  haut: number;
  marge: number;
}

/** Intervalle de confiance à 95 % d'une proportion (borné à [0, 1]). */
export function intervalle95(p: number, n: number): Intervalle {
  const marge = margeErreur95(p, n);
  return {
    bas: Math.max(0, p - marge),
    haut: Math.min(1, p + marge),
    marge,
  };
}

/** Une cellule (ou un sous-groupe) de `nBrut` répondant·es est-elle publiable ? */
export function estFiable(nBrut: number, seuil: number = SEUIL_CELLULE): boolean {
  return nBrut >= seuil;
}
