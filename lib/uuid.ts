/**
 * Helpers UUID (V2.4.64).
 *
 * Validation : format UUID v4 (8-4-4-4-12 hex, version=4, variant
 * 8/9/a/b). Tolère les majuscules et minuscules.
 *
 * Pur, testable. Évite d'inclure le paquet `uuid` côté client juste
 * pour valider.
 */

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Valide qu'une chaîne est un UUID (v1 à v5).
 *
 * @example estUuidValide('550e8400-e29b-41d4-a716-446655440000') → true
 * @example estUuidValide('550E8400-E29B-41D4-A716-446655440000') → true (case insensible)
 * @example estUuidValide('pas-un-uuid') → false
 * @example estUuidValide('') → false
 */
export function estUuidValide(s: string | null | undefined): boolean {
  if (s === null || s === undefined) return false;
  return REGEX_UUID.test(s);
}

/**
 * Retourne l'UUID en minuscules si valide, sinon `null`.
 * Pratique pour normaliser avant de comparer / stocker.
 */
export function normaliserUuid(s: string | null | undefined): string | null {
  if (!estUuidValide(s)) return null;
  return (s as string).toLowerCase();
}
