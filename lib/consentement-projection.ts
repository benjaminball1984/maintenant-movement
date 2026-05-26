/**
 * Projection pure : `signature_petition` → liste de `consentement` à insérer
 * lors du backfill V2.1.2.
 *
 * Extrait du script `scripts/backfill-consentement.ts` pour être testable
 * sans mock Supabase. La règle de projection est pure et déterministe :
 *
 * - `accepte_newsletter = true` → 1 consentement type `newsletter_plateforme`,
 *   sans objet (consentement global au mouvement).
 * - `accepte_contact_createurice = true` → 1 consentement type
 *   `contact_createur`, objet = la pétition (un consentement par pétition).
 * - Les `false` ne créent RIEN.
 * - Si `profil_unifie_id` est null, on ne produit rien (cas théorique, à
 *   compter et logger côté caller).
 *
 * Source toujours = `backfill_signature_v1`, date_consentement = date de la
 * signature d'origine.
 */

export interface LigneSignatureSource {
  petition_id: string;
  profil_unifie_id: string | null;
  accepte_newsletter: boolean;
  accepte_contact_createurice: boolean;
  created_at: string;
}

export interface LigneConsentementCible {
  profil_unifie_id: string;
  type_consentement: 'newsletter_plateforme' | 'contact_createur';
  valeur: true;
  source: 'backfill_signature_v1';
  date_consentement: string;
  objet_type: 'petition' | null;
  objet_id: string | null;
}

export function projeterSignatureEnConsentements(
  signature: LigneSignatureSource,
): LigneConsentementCible[] {
  if (signature.profil_unifie_id === null) {
    return [];
  }
  const consentements: LigneConsentementCible[] = [];
  if (signature.accepte_newsletter) {
    consentements.push({
      profil_unifie_id: signature.profil_unifie_id,
      type_consentement: 'newsletter_plateforme',
      valeur: true,
      source: 'backfill_signature_v1',
      date_consentement: signature.created_at,
      objet_type: null,
      objet_id: null,
    });
  }
  if (signature.accepte_contact_createurice) {
    consentements.push({
      profil_unifie_id: signature.profil_unifie_id,
      type_consentement: 'contact_createur',
      valeur: true,
      source: 'backfill_signature_v1',
      date_consentement: signature.created_at,
      objet_type: 'petition',
      objet_id: signature.petition_id,
    });
  }
  return consentements;
}
