'use server';

import { getTurnstileService } from '@/lib/turnstile';
import { type DonneesSignerPetition, signerPetitionSchema } from '@/lib/validations/petition';

/**
 * Server Action de signature de pétition (stub chantier 2.1).
 *
 * Pour le chantier 2.1, les tables `petition` et `signature_petition`
 * n'existent pas encore (créées au chantier 3.1). Cette action :
 *   - valide la charge utile (Zod)
 *   - vérifie le Turnstile côté serveur
 *   - retourne un succès sans persister
 *
 * Quand le chantier 3.1 sera livré, on remplacera le corps par :
 *   - insertion dans `signature_petition`
 *   - mise à jour du compteur stretch (× 1,5 à 90 %)
 *   - inscription conditionnelle à la newsletter si `accepte_newsletter`
 *   - notification de la personne créatrice si `accepte_contact_createurice`
 *
 * Le signe est cohérent avec ce que le pattern adapter (CLAUDE.md §6)
 * pose pour les services externes : interface stable, branchement réel
 * différé.
 */
export type ResultatSignature = { ok: true } | { ok: false; message: string };

export async function signerPetition(donneesBrutes: unknown): Promise<ResultatSignature> {
  const parse = signerPetitionSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesSignerPetition = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return {
      ok: false,
      message: 'La vérification anti-bot a échoué. Recharger la page et réessayer.',
    };
  }

  // Persistance à brancher au chantier 3.1.
  // biome-ignore lint/suspicious/noConsoleLog: trace utile en dev tant que la BDD n'est pas branchée.
  console.log('[signerPetition stub] signature reçue :', {
    petition_id: donnees.petition_id,
    email: donnees.email,
    code_postal: donnees.code_postal,
  });

  return { ok: true };
}
