/**
 * Conversion 99-coin ↔ euros (V2.4.72).
 *
 * La parité officielle T99CP / euro n'est pas figée (ce serait une
 * monnaie « peg » comme les stablecoins, contraire à la doctrine).
 * Mais pour l'affichage des cagnottes mixtes (« 50 € + 100 99-coin »
 * → afficher un total équivalent), on a besoin d'un taux indicatif.
 *
 * Convention V1 : 1 T99CP = 0,10 € (10 centimes). Configurable via
 * env `TAUX_T99CP_EN_CENTIMES` (entier centimes par 99-coin). Défaut
 * 10 si non défini. Pur, testable (le taux est en paramètre).
 */

/** Taux par défaut : 1 T99CP = 10 centimes (0,10 €). */
export const TAUX_PAR_DEFAUT_CENTIMES = 10;

/**
 * Convertit un montant en 99-coin vers son équivalent en centimes
 * d'euros (entier).
 *
 * @param coins - nombre de 99-coin (peut être décimal)
 * @param tauxCentimes - taux 1 coin = X centimes (default 10)
 *
 * @example coinsEnCentimes(100) → 1000 (10 €)
 * @example coinsEnCentimes(50.5) → 505 (5,05 €)
 * @example coinsEnCentimes(100, 5) → 500 (taux moitié)
 */
export function coinsEnCentimes(
  coins: number,
  tauxCentimes: number = TAUX_PAR_DEFAUT_CENTIMES,
): number {
  return Math.round(coins * tauxCentimes);
}

/**
 * Convertit un montant en centimes vers son équivalent en 99-coin
 * (décimal arrondi au 0.01 près).
 *
 * @example centimesEnCoins(1000) → 100
 * @example centimesEnCoins(505) → 50.5
 */
export function centimesEnCoins(
  centimes: number,
  tauxCentimes: number = TAUX_PAR_DEFAUT_CENTIMES,
): number {
  if (tauxCentimes === 0) return 0;
  return Math.round((centimes / tauxCentimes) * 100) / 100;
}

/**
 * Compose un total équivalent en euros (centimes) pour une cagnotte
 * mixte qui a reçu X centimes d'euros + Y unités T99CP entières (10^18 base).
 *
 * Note : les unités T99CP sont stockées en string BigInt côté chaîne
 * Polygon. Ici on convertit déjà en nombre de 99-coin (la division par
 * 10^18 se fait en amont, cf. lib/format-t99cp.ts).
 *
 * @example totalCentimes(500, 100) → 1500 (5 € + 100×10 cts = 10 €, total 15 €)
 */
export function totalCentimes(
  centimesEuros: number,
  coins99: number,
  tauxCentimes: number = TAUX_PAR_DEFAUT_CENTIMES,
): number {
  return centimesEuros + coinsEnCentimes(coins99, tauxCentimes);
}
