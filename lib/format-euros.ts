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

/**
 * Formatteur EUR « entier » construit une seule fois et réutilisé (comme
 * l'étaient les constantes `Intl.NumberFormat` inline qu'il remplace).
 */
const FORMATEUR_EUR_ENTIER = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

/**
 * Affiche un montant en EUROS arrondi à l'euro entier (aucune décimale).
 * Format « 12 € », « 13 € » (12,5 arrondi au plus proche).
 *
 * Reproduit exactement `Intl.NumberFormat('fr-FR', { style: 'currency',
 * currency: 'EUR', maximumFractionDigits: 0 })`. Contrairement à
 * {@link formaterEuros}, NE filtre PAS 0 ni les négatifs : `0` donne
 * « 0 € » et `-5` donne « -5 € ». À utiliser pour les compteurs, soldes et
 * totaux où l'affichage explicite d'un zéro est voulu.
 */
export function formaterEurosEntier(euros: number): string {
  return FORMATEUR_EUR_ENTIER.format(euros);
}

/**
 * Formatteur EUR « deux décimales fixes » construit une seule fois.
 */
const FORMATEUR_EUR_DECIMALES = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

/**
 * Affiche un montant en EUROS avec TOUJOURS deux décimales. Format
 * « 12,00 € », « 12,50 € », « 0,00 € ».
 *
 * Reproduit exactement le défaut de la devise EUR (`Intl.NumberFormat(
 * 'fr-FR', { style: 'currency', currency: 'EUR' })`). Contrairement à
 * {@link formaterEuros}, conserve les « ,00 » et NE filtre PAS 0 ni les
 * négatifs. À utiliser pour les affichages comptables (trésorerie, reçus,
 * dons) où le format monétaire fixe est attendu.
 */
export function formaterEurosDecimales(euros: number): string {
  return FORMATEUR_EUR_DECIMALES.format(euros);
}
