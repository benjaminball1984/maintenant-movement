/**
 * Validation pure du contenu d'un message de fil de groupe (cycle V2,
 * V2.2.1). Extraite des helpers et de la Server Action pour être
 * testable sans Supabase.
 */

export const LONGUEUR_MIN_MESSAGE = 1;
export const LONGUEUR_MAX_MESSAGE = 4000;

export type RaisonInvalide = 'vide' | 'trop_long';

export type ResultatValidation =
  | { ok: true; contenuNettoye: string }
  | { ok: false; raison: RaisonInvalide };

/**
 * Valide et nettoie un contenu de message :
 * - retire les espaces en début/fin (trim),
 * - refuse si vide ou trop long.
 *
 * La validation MIME / pièce jointe ne s'applique pas ici (le fil est
 * texte uniquement à ce stade — cf. migration V2.2.1).
 */
export function validerContenuMessageFil(contenuBrut: string): ResultatValidation {
  const contenuNettoye = contenuBrut.trim();
  if (contenuNettoye.length < LONGUEUR_MIN_MESSAGE) {
    return { ok: false, raison: 'vide' };
  }
  if (contenuNettoye.length > LONGUEUR_MAX_MESSAGE) {
    return { ok: false, raison: 'trop_long' };
  }
  return { ok: true, contenuNettoye };
}
