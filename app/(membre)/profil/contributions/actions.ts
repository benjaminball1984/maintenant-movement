'use server';

import { getPersonneOuRediriger } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { definirRecontactSignatureSchema } from '@/lib/validations/profil';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions de l'espace « Mes contributions » (chantier 13.3-D).
 *
 * Convention de retour identique aux autres Server Actions du profil :
 * `{ ok: true } | { ok: false, message }`.
 */
export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

/**
 * Active ou désactive, pour UNE signature de la personne connectée, le
 * consentement « la créatrice de la pétition peut me recontacter ».
 *
 * Sécurité : la RLS `signature_petition_update_self` n'autorise la mise à
 * jour que des signatures dont `personne_id = auth.uid()`. On ajoute un
 * filtre explicite `personne_id` (défense en profondeur) et on vérifie
 * d'abord la session.
 */
export async function definirRecontactSignature(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = definirRecontactSignatureSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees = parse.data;

  const { userId } = await getPersonneOuRediriger('/profil/contributions');
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('signature_petition')
    .update({ accepte_contact_createurice: donnees.autorise })
    .eq('id', donnees.signature_id)
    .eq('personne_id', userId)
    .select('id')
    .maybeSingle();

  if (error !== null) {
    return { ok: false, message: `Mise à jour impossible : ${error.message}` };
  }
  if (data === null) {
    return { ok: false, message: 'Signature introuvable ou non modifiable.' };
  }

  revalidatePath('/profil/contributions');
  return { ok: true };
}
