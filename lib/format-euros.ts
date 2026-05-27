/**
 * Helpers de formatage des montants en euros (V2.4.34).
 *
 * Extraits de `lib/marche/config.ts` (V1 chantier 4.3) pour partage
 * inter-modules. Pur, testable.
 */

/**
 * Affiche un montant à partir d'une valeur en CENTIMES.
 * Format « 12,50 € » (sans décimales si entier).
 * Retourne `''` si null, undefined ou <= 0.
 */
export function formaterEurosDepuisCentimes(centimes: number | null | undefined): string {
  if (centimes === null || centimes === undefined || centimes <= 0) return '';
  const euros = centimes / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: euros % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(euros);
}

/**
 * Affiche un montant à partir d'une valeur en EUROS (déjà décimaux).
 * Format « 12,50 € » (toujours 2 décimales sauf si entier).
 * Retourne `''` si null, undefined ou <= 0.
 */
export function formaterEuros(euros: number | null | undefined): string {
  if (euros === null || euros === undefined || euros <= 0) return '';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: euros % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(euros);
}
