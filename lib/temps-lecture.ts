/**
 * Helper de calcul du temps de lecture (V2.4.49).
 *
 * Convention : 200 mots / minute pour un texte français adulte
 * (référence : moyenne basse pour respecter les lecteurices plus
 * lentes, alors que la moyenne haute est ~250 mots/min). Minimum
 * 1 minute affichée (« moins de 1 min » étant inutile en UX).
 *
 * Pur, testable, sans dépendance.
 */

const MOTS_PAR_MINUTE = 200;

/**
 * Calcule le nombre de mots d'un texte (séparation par whitespace).
 *
 * @example compterMots('Bonjour le monde') → 3
 * @example compterMots('  un\n\n  deux  ') → 2
 */
export function compterMots(texte: string): number {
  return texte
    .trim()
    .split(/\s+/)
    .filter((m) => m !== '').length;
}

/**
 * Estime le temps de lecture en minutes (entier arrondi haut, min 1).
 *
 * @example calculerTempsLectureMinutes('mot '.repeat(400)) → 2
 * @example calculerTempsLectureMinutes('court texte') → 1
 */
export function calculerTempsLectureMinutes(texte: string): number {
  const mots = compterMots(texte);
  return Math.max(1, Math.ceil(mots / MOTS_PAR_MINUTE));
}

/**
 * Formate le temps de lecture : « 1 min de lecture » / « N min de lecture ».
 *
 * @example formaterTempsLecture('court') → '1 min de lecture'
 * @example formaterTempsLecture(beaucoup) → '5 min de lecture'
 */
export function formaterTempsLecture(texte: string): string {
  const minutes = calculerTempsLectureMinutes(texte);
  return `${minutes} min de lecture`;
}
