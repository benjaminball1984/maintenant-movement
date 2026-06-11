import type { PrefilSignature } from '@/components/modales/ModaleSignaturePetition';
import { getSession } from '@/lib/auth/session';

/**
 * Construit le préremplissage de la modale de signature de pétition à
 * partir de la session courante (revue bêta 2026-06-11) : une personne
 * connectée ne devrait pas retaper prénom/nom/email que le site connaît.
 *
 * Retourne `undefined` quand personne n'est connectée : la modale affiche
 * alors ses champs vides, comme avant.
 */
export async function prefilSignatureDepuisSession(): Promise<PrefilSignature | undefined> {
  const session = await getSession();
  if (session === null) return undefined;
  return {
    prenom: session.personne?.prenom ?? undefined,
    nom: session.personne?.nom ?? undefined,
    email: session.email !== '' ? session.email : undefined,
    code_postal: session.personne?.code_postal ?? undefined,
  };
}
