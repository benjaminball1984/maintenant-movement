'use server';

/**
 * Server Actions de gestion de l'abonnement à un espace (V2.5.22, sous-chantier
 * V2.5.10.d). Symétrique de la table `relation_reseau` mais pour les espaces.
 */

import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const schema = z.object({
  espaceType: z.enum([
    'commune',
    'federation',
    'confederation',
    'gt_thematique',
    'groupe_entraide_local',
    'campagne',
  ]),
  espaceId: z.string().uuid(),
  cheminRevalidation: z.string().optional(),
});

type Resultat = { ok: true; jeSuis: boolean } | { ok: false; message: string };

/**
 * Bascule l'abonnement : crée s'il n'existe pas, supprime s'il existe.
 * Retourne le nouvel état (`jeSuis` après l'action).
 */
export async function basculerAbonnementEspaceAction(donneesBrutes: unknown): Promise<Resultat> {
  const parse = schema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour suivre un espace.' };
  }

  const supabase = await getSupabaseServer();
  const { data: existant } = await supabase
    .from('abonnement_espace_reseau')
    .select('id')
    .eq('suiveur_id', session.userId)
    .eq('espace_type', donnees.espaceType)
    .eq('espace_id', donnees.espaceId)
    .maybeSingle();

  if (existant === null) {
    const { error } = await supabase.from('abonnement_espace_reseau').insert({
      suiveur_id: session.userId,
      espace_type: donnees.espaceType,
      espace_id: donnees.espaceId,
    });
    if (error !== null) {
      return { ok: false, message: `Abonnement impossible : ${error.message}` };
    }
    if (donnees.cheminRevalidation) revalidatePath(donnees.cheminRevalidation);
    return { ok: true, jeSuis: true };
  }

  const { error } = await supabase.from('abonnement_espace_reseau').delete().eq('id', existant.id);
  if (error !== null) {
    return { ok: false, message: `Désabonnement impossible : ${error.message}` };
  }
  if (donnees.cheminRevalidation) revalidatePath(donnees.cheminRevalidation);
  return { ok: true, jeSuis: false };
}

// V2.5.22 — `jeSuisCetEspace` (helper de lecture pour Server Components)
// a été déplacé dans `lib/reseau/abonnement.ts`. Un fichier `'use server'`
// expose TOUTES ses exports comme Server Actions callables depuis le
// client, ce qui tirait `next/headers` dans le bundle client et cassait
// la compilation. Importer désormais `jeSuisCetEspace` depuis
// `@/lib/reseau/abonnement`.
