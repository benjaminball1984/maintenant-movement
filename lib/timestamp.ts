/**
 * Helpers timestamp (V2.4.89).
 *
 * Conversion entre dates ISO, Unix seconds, Unix millis. Centralise
 * pour éviter les bugs de × 1000 oubliés (Unix s vs JS ms).
 *
 * Pur, testable, sans dépendance externe.
 */

/**
 * Convertit une date ISO en timestamp Unix (secondes).
 * Retourne `null` si la date est invalide.
 *
 * @example isoEnSecondes('2026-05-23T14:00:00.000Z') → 1779793200
 */
export function isoEnSecondes(iso: string): number | null {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 1000);
}

/**
 * Convertit un timestamp Unix (secondes) en date ISO.
 *
 * @example secondesEnIso(1779793200) → '2026-05-23T14:00:00.000Z'
 */
export function secondesEnIso(secondes: number): string {
  return new Date(secondes * 1000).toISOString();
}

/**
 * Retourne le timestamp Unix (secondes) actuel.
 * Helper pratique pour ne pas mélanger `Date.now()` (ms) avec
 * les timestamps externes (Stripe, JWT) qui sont en secondes.
 */
export function maintenantEnSecondes(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Valide qu'un nombre est un timestamp Unix plausible (entre 2000
 * et 2200, en secondes). Pour valider les `iat` / `exp` des JWT, les
 * timestamps de webhooks externes, etc.
 *
 * @example estTimestampValide(1779793200) → true
 * @example estTimestampValide(1779793200000) → false (c'est en ms, pas en s)
 */
export function estTimestampValide(t: number | null | undefined): boolean {
  if (t === null || t === undefined) return false;
  if (!Number.isFinite(t)) return false;
  // 2000-01-01 UTC = 946 684 800 secondes ; 2200-01-01 = 7 258 118 400
  return t >= 946_684_800 && t <= 7_258_118_400;
}
