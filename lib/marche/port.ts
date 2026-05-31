/**
 * Frais de port du marché solidaire (décision D5).
 *
 * Cf. fiche CDC `marche-solidaire-V2.md` §"Frais de port" :
 *   - le port (fixé par la vendeureuse, en centimes d'euros) n'est facturé que
 *     si la personne acheteuse choisit l'envoi postal ;
 *   - pour un achat en euros, il s'ajoute au total réglé via Stripe ;
 *   - pour un achat en 99-coin, ce montant de référence est réglé en POL
 *     (Polygon natif) au taux du moment, hors de la transaction T99CP.
 *
 * Cette fonction PURE centralise la règle « le port s'applique-t-il, et pour
 * quel montant ? » afin que l'action serveur et le formulaire d'achat
 * partagent exactement le même calcul (et qu'il soit testable isolément).
 */

/** Mode de remise choisi par la personne acheteuse. */
export type ModeRemise = 'main_propre' | 'envoi';

export interface ParametresPort {
  /** Mode choisi (undefined = non précisé → traité comme main propre). */
  modeRemise: ModeRemise | undefined;
  /** La vendeureuse propose-t-elle l'envoi postal ? */
  envoiPostal: boolean;
  /** Frais de port fixés par la vendeureuse (centimes d'euros). */
  fraisPortCentimes: number;
}

/**
 * Retourne les frais de port effectivement facturés (centimes d'euros).
 *
 * Renvoie 0 dès qu'une condition manque (mode ≠ envoi, envoi non proposé,
 * montant nul ou invalide), ce qui garantit le comportement historique pour
 * tout produit sans port : total = prix seul.
 */
export function portFactureCentimes({
  modeRemise,
  envoiPostal,
  fraisPortCentimes,
}: ParametresPort): number {
  if (modeRemise !== 'envoi') return 0;
  if (envoiPostal !== true) return 0;
  if (!Number.isFinite(fraisPortCentimes) || fraisPortCentimes <= 0) return 0;
  return Math.trunc(fraisPortCentimes);
}
