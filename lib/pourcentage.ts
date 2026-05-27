/**
 * Helpers de pourcentage (V2.4.75).
 *
 * Pour les barres de progression (cagnottes, pétitions stretch),
 * les statistiques admin, l'affichage de jauges.
 *
 * Pur, testable, sans dépendance externe.
 */

/**
 * Calcule le ratio `partie / total` sous forme de pourcentage (0-100,
 * peut dépasser 100 si la partie est supérieure au total).
 *
 * - `total <= 0` retourne 0 (éviter division par zéro)
 * - `partie < 0` retourne 0 (ratio négatif n'a pas de sens en UX)
 *
 * @example pourcentage(50, 100) → 50
 * @example pourcentage(150, 100) → 150
 * @example pourcentage(50, 0) → 0
 */
export function pourcentage(partie: number, total: number): number {
  if (total <= 0) return 0;
  if (partie < 0) return 0;
  return (partie / total) * 100;
}

/**
 * Pourcentage arrondi à l'entier (pour barres de progression).
 *
 * @example pourcentageArrondi(33.7, 100) → 34
 */
export function pourcentageArrondi(partie: number, total: number): number {
  return Math.round(pourcentage(partie, total));
}

/**
 * Pourcentage clampé entre 0 et 100 (pour barres dont la largeur CSS
 * ne doit pas dépasser 100%).
 *
 * @example pourcentageClampe(150, 100) → 100
 * @example pourcentageClampe(50, 100) → 50
 */
export function pourcentageClampe(partie: number, total: number): number {
  return Math.min(100, Math.max(0, pourcentage(partie, total)));
}

/**
 * Format humain « 75 % » (avec espace fine et %).
 *
 * @example formaterPourcentage(75) → '75 %'
 * @example formaterPourcentage(75.7) → '76 %' (arrondi)
 */
export function formaterPourcentage(valeur: number): string {
  return `${Math.round(valeur)} %`;
}
