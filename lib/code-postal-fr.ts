/**
 * Helpers de code postal français (V2.4.63).
 *
 * Validation pragmatique : 5 chiffres, premier chiffre dans [0-9]
 * (sauf 00 qui n'existe pas en métropole), pas de format DROM strict
 * (97x/98x acceptés au même titre que la métropole, à charge à
 * l'appelant de filtrer si besoin).
 *
 * Pur, testable. Permet aussi d'extraire le code département (2
 * premiers chiffres en métropole, 3 pour les DROM 97x/98x).
 */

const REGEX_CP = /^\d{5}$/;

/**
 * Valide qu'une chaîne est un code postal français bien formé.
 *
 * @example estCodePostalFrValide('75001') → true
 * @example estCodePostalFrValide('33500') → true
 * @example estCodePostalFrValide('97400') → true (La Réunion)
 * @example estCodePostalFrValide('00000') → false
 * @example estCodePostalFrValide('123') → false
 */
export function estCodePostalFrValide(cp: string | null | undefined): boolean {
  if (cp === null || cp === undefined) return false;
  const c = cp.trim();
  if (!REGEX_CP.test(c)) return false;
  if (c === '00000') return false;
  return true;
}

/**
 * Extrait le code département à partir d'un code postal français.
 *
 * Règles :
 * - Métropole : 2 premiers chiffres (75001 → 75, 33500 → 33).
 * - Corse : 20xxx → 2A ou 2B (impossible à déduire seul du CP de
 *   manière fiable, on retourne '20' générique).
 * - DROM : 971xx → 971, 972xx → 972, 973xx → 973, 974xx → 974,
 *   976xx → 976. (975 St-Pierre-et-Miquelon, 977 St-Barthélemy,
 *   978 St-Martin également).
 *
 * @returns code département ou `null` si invalide.
 */
export function extraireDepartementFr(cp: string | null | undefined): string | null {
  if (!estCodePostalFrValide(cp ?? '')) return null;
  const c = (cp as string).trim();
  // DROM : 97x et 98x → 3 premiers chiffres.
  if (c.startsWith('97') || c.startsWith('98')) return c.slice(0, 3);
  // Métropole : 2 premiers.
  return c.slice(0, 2);
}
