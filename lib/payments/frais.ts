/**
 * Helpers de calcul de frais — purs, sans dépendance au service de
 * paiement (donc importables côté client sans tirer Node APIs).
 *
 * Convention « absorbés par la donatrice » : la donatrice saisit un
 * montant brut, on déduit 5 % qui restent côté plateforme ; le reste
 * va au porteur. Cf. spec §5D (cagnottes) et §6F (marché solidaire).
 *
 * Cf. ADR à venir si le mode bascule sur « ajout au-dessus » (les 5 %
 * s'ajoutent au montant souhaité pour la cagnotte).
 */

export const TAUX_FRAIS_EUR = 0.05;

/**
 * Frais Maintenant! sur un don ou un achat en euros = 5 % du montant.
 *
 * @param montantTotalCentimes Montant total débité (centimes d'euros).
 * @returns Frais (centimes d'euros). Toujours >= 0.
 */
export function calculerFraisEuros(montantTotalCentimes: number): number {
  if (montantTotalCentimes <= 0) return 0;
  return Math.round(montantTotalCentimes * TAUX_FRAIS_EUR);
}

/**
 * Frais Maintenant! sur un don ou un achat en T99CP = 0 (politique
 * « 0 % T99CP », cf. spec §5D et §6F).
 *
 * Signature avec paramètre pour symétrie d'appel avec
 * `calculerFraisEuros` et pour permettre un changement de doctrine
 * sans refactor des appelants.
 */
export function calculerFraisT99CP(_montantUnites: bigint): bigint {
  return 0n;
}
