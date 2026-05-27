/**
 * Helpers de téléphone français (V2.4.61).
 *
 * Validation pragmatique (pas E.164 strict) :
 * - 10 chiffres commençant par 0 (format national)
 * - OU format international `+33` + 9 chiffres
 * - Espaces, points, tirets, slashs ignorés à la validation
 *
 * Pour le formatage, on produit le format français standard
 * « 06 12 34 56 78 ».
 *
 * Pur, testable, sans dépendance externe (libphonenumber serait
 * surdimensionné pour ce besoin).
 */

const REGEX_NATIONAL = /^0[1-9]\d{8}$/;
const REGEX_INTERNATIONAL = /^\+33[1-9]\d{8}$/;

/**
 * Retire tous les séparateurs visuels d'un numéro (espaces, points,
 * tirets, slashs). Retourne la chaîne « brute ».
 */
function nettoyer(tel: string): string {
  return tel.replace(/[\s.\-/]/g, '');
}

/**
 * Valide qu'une chaîne ressemble à un numéro de téléphone français.
 *
 * @example estTelephoneFrValide('06 12 34 56 78') → true
 * @example estTelephoneFrValide('+33 6 12 34 56 78') → true
 * @example estTelephoneFrValide('+33612345678') → true
 * @example estTelephoneFrValide('0612345678') → true
 * @example estTelephoneFrValide('0012345678') → false (commence par 00)
 * @example estTelephoneFrValide('12345') → false (trop court)
 */
export function estTelephoneFrValide(tel: string | null | undefined): boolean {
  if (tel === null || tel === undefined) return false;
  const t = nettoyer(tel);
  return REGEX_NATIONAL.test(t) || REGEX_INTERNATIONAL.test(t);
}

/**
 * Normalise un numéro vers le format national français
 * (« 0612345678 », sans séparateurs).
 *
 * @example normaliserTelephoneFr('+33 6 12 34 56 78') → '0612345678'
 * @example normaliserTelephoneFr('06.12.34.56.78') → '0612345678'
 * @returns chaîne vide si invalide.
 */
export function normaliserTelephoneFr(tel: string): string {
  const t = nettoyer(tel);
  if (REGEX_INTERNATIONAL.test(t)) return `0${t.slice(3)}`;
  if (REGEX_NATIONAL.test(t)) return t;
  return '';
}

/**
 * Formate un numéro normalisé au format français standard
 * « XX XX XX XX XX » (paires de chiffres séparées par des espaces).
 *
 * @example formaterTelephoneFr('0612345678') → '06 12 34 56 78'
 * @returns chaîne vide si invalide.
 */
export function formaterTelephoneFr(tel: string): string {
  const n = normaliserTelephoneFr(tel);
  if (n === '') return '';
  return `${n.slice(0, 2)} ${n.slice(2, 4)} ${n.slice(4, 6)} ${n.slice(6, 8)} ${n.slice(8, 10)}`;
}
