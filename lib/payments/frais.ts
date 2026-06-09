/**
 * Helpers de calcul de frais : purs, sans dépendance au service de
 * paiement (donc importables côté client sans tirer Node APIs).
 *
 * DOCTRINE DES FRAIS (décision Lilou/Ben du 2026-06-09)
 * ----------------------------------------------------
 *
 *   - Paiements en EUROS (Stripe) : frais de **3 % + 0,30 €** sur TOUS
 *     les paiements, quel que soit le type (adhésion, don à une cagnotte,
 *     achat au marché, et les futurs dons réseau / médias et paiements
 *     d'entraide). Les frais sont **ajoutés au-dessus**, à la charge du
 *     payeur : le bénéficiaire (porteur, vendeur, association) reçoit
 *     toujours le montant plein. Pour obtenir le total à débiter, on
 *     additionne montant + frais (`totalAvecFraisEuros`).
 *
 *   - Paiements en 99-coin (T99CP / Polygon) : AUCUN frais plateforme.
 *     Le seul coût est le gas Polygon, payé on-chain par le wallet
 *     émetteur, hors de notre système (non calculé ici).
 *
 * Pourquoi « % + fixe » et pas un simple pourcentage : c'est le seul
 * modèle viable à tous les montants. La part fixe de Stripe (0,25 €)
 * écrase les petits montants (à 1 €, Stripe coûte 27 % du montant) ;
 * un pourcentage seul ne couvrirait jamais ce coût fixe. Les 0,30 €
 * couvrent le fixe de Stripe et laissent une marge minime ; les 3 %
 * couvrent la part proportionnelle (1,5 % carte européenne) avec une
 * petite marge pour financer le site.
 */

/** Part proportionnelle des frais Maintenant! en euros (3 %). */
export const TAUX_FRAIS_EUR = 0.03;

/** Part fixe des frais Maintenant! en euros, en centimes (0,30 €). */
export const FRAIS_FIXE_EUR_CENTIMES = 30;

/**
 * Frais Maintenant! sur un paiement en euros = 3 % du montant + 0,30 €.
 *
 * Ces frais sont **ajoutés** au montant destiné au bénéficiaire (à la
 * charge du payeur). Le bénéficiaire reçoit le montant plein ; le payeur
 * règle `montant + frais` (cf. `totalAvecFraisEuros`).
 *
 * @param montantBeneficiaireCentimes Montant qui revient au bénéficiaire (centimes d'euros).
 * @returns Frais en centimes d'euros. Renvoie 0 si le montant est nul ou négatif (garde-fou).
 */
export function calculerFraisEuros(montantBeneficiaireCentimes: number): number {
  if (montantBeneficiaireCentimes <= 0) return 0;
  return Math.round(montantBeneficiaireCentimes * TAUX_FRAIS_EUR) + FRAIS_FIXE_EUR_CENTIMES;
}

/**
 * Total à débiter au payeur = montant destiné au bénéficiaire + frais.
 *
 * Helper de commodité partagé entre les Server Actions (calcul du
 * `montantTotalCentimes` envoyé à Stripe) et les formulaires (affichage
 * du total au payeur), pour garantir un calcul identique des deux côtés.
 *
 * @param montantBeneficiaireCentimes Montant qui revient au bénéficiaire (centimes d'euros).
 * @returns Total à débiter (centimes d'euros). Renvoie 0 si le montant est nul ou négatif.
 */
export function totalAvecFraisEuros(montantBeneficiaireCentimes: number): number {
  if (montantBeneficiaireCentimes <= 0) return 0;
  return montantBeneficiaireCentimes + calculerFraisEuros(montantBeneficiaireCentimes);
}

/**
 * Frais Maintenant! sur un paiement en T99CP = 0 (politique « 0 % T99CP »,
 * cf. doctrine des frais ci-dessus). Le seul coût d'un paiement 99-coin est
 * le gas Polygon, payé par le wallet émetteur, hors de notre système.
 *
 * Signature avec paramètre pour symétrie d'appel avec `calculerFraisEuros`
 * et pour permettre un changement de doctrine sans refactor des appelants.
 */
export function calculerFraisT99CP(_montantUnites: bigint): bigint {
  return 0n;
}
