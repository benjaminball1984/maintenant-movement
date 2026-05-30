'use server';

import { getSession } from '@/lib/auth/session';
import { creerOrganisationSchema } from '@/lib/organisations/validation';
import { slugifier, slugifierAvecSuffixeTemps } from '@/lib/slug';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

type Resultat = { ok: true; slug: string } | { ok: false; message: string };

/**
 * Crée une organisation (épopée réseau V2, chantier B.1).
 *
 * La personne connectée en devient le·la créateur·ice (gestionnaire provisoire
 * via `cree_par`, formalisé en B.2). La page est `active` mais NON officielle :
 * le badge est accordé séparément par l'admin (voie 2). Slug dérivé du nom avec
 * anti-collision (suffixe temporel si le slug de base est déjà pris).
 */
export async function creerOrganisationAction(donneesBrutes: unknown): Promise<Resultat> {
  const parse = creerOrganisationSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour créer une organisation.' };
  }
  const supabase = await getSupabaseServer();

  // Slug : base dérivée du nom, suffixe temporel si déjà pris.
  const slugBase = slugifier(donnees.nom);
  const { data: existant } = await supabase
    .from('organisation')
    .select('id')
    .eq('slug', slugBase)
    .maybeSingle();
  const slug = existant === null ? slugBase : slugifierAvecSuffixeTemps(donnees.nom);

  const { error } = await supabase.from('organisation').insert({
    slug,
    nom: donnees.nom,
    type_organisation: donnees.type_organisation,
    description: donnees.description === '' ? null : (donnees.description ?? null),
    image_url: donnees.image_url === '' ? null : (donnees.image_url ?? null),
    cree_par: session.userId,
  });
  if (error !== null) {
    return { ok: false, message: `Création impossible : ${error.message}` };
  }

  revalidatePath('/organisations');
  return { ok: true, slug };
}
