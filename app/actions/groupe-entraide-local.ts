'use server';

import { getSession } from '@/lib/auth/session';
import {
  type DonneesCreerGroupeEntraide,
  coordonneesValides,
  creerGroupeEntraideSchema,
  slugValide,
  slugifierNomGroupe,
} from '@/lib/groupe-entraide-local-validation';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Server Actions du sous-espace « Groupe d'entraide local » (cycle V2 V2.3.2).
 *
 * - `creerGroupeEntraide` : crée un nouveau groupe au statut `en_moderation`,
 *   slug auto-généré depuis le nom (avec suffixe -2, -3, etc. en cas de
 *   collision). Le créateur devient automatiquement membre + animateur.
 * - `rejoindreGroupe` / `quitterGroupe` : adhésion / désinscription self-service.
 *
 * Toutes vérifient la session ; la RLS Supabase couvre la défense secondaire.
 */

export type ResultatCreerGroupe = { ok: true; slug: string } | { ok: false; message: string };

export async function creerGroupeEntraide(donneesBrutes: unknown): Promise<ResultatCreerGroupe> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise pour créer un groupe.' };
  }

  const parse = creerGroupeEntraideSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return {
      ok: false,
      message: parse.error.issues[0]?.message ?? 'Données invalides.',
    };
  }
  const donnees: DonneesCreerGroupeEntraide = parse.data;

  if (!coordonneesValides(donnees.latitude, donnees.longitude)) {
    return { ok: false, message: 'Latitude et longitude doivent être fournies ensemble.' };
  }

  const supabase = await getSupabaseServer();

  // Slug : on tente le slug nominal, puis -2, -3, etc. en cas de collision.
  const slugBase = slugifierNomGroupe(donnees.nom);
  if (!slugValide(slugBase)) {
    return { ok: false, message: 'Le nom doit contenir au moins 3 caractères alphanumériques.' };
  }
  const slug = await trouverSlugLibre(supabase, slugBase);

  const { data, error } = await supabase
    .from('groupe_entraide_local')
    .insert({
      slug,
      nom: donnees.nom,
      description_courte: donnees.description_courte,
      description: donnees.description,
      zone_geographique: donnees.zone_geographique,
      latitude: donnees.latitude ?? null,
      longitude: donnees.longitude ?? null,
      image_url: donnees.image_url ?? null,
      statut: 'en_moderation',
      createurice_id: session.userId,
    })
    .select('id, slug')
    .single();

  if (error !== null || data === null) {
    return { ok: false, message: error?.message ?? 'Création impossible.' };
  }

  // Le créateur devient automatiquement animateur du groupe (preset
  // « créateur d'espace » de MD4 V2 : `gerer_membres`, `administrer_espace`).
  // En l'absence de la table `droit` V2 branchée, on utilise le rôle de
  // l'appartenance.
  const { error: errAppartenance } = await supabase
    .from('appartenance_groupe_entraide_local')
    .insert({
      groupe_id: data.id,
      personne_id: session.userId,
      role_groupe: 'animateur',
    });
  if (errAppartenance !== null) {
    // Ne pas casser la création du groupe pour autant — on logge et on continue.
    console.warn('[creerGroupeEntraide] appartenance créateur échouée :', errAppartenance);
  }

  revalidatePath('/s-entraider/groupes-locaux');
  redirect(`/s-entraider/groupes-locaux/${data.slug}`);
}

export async function rejoindreGroupe(
  groupeId: string,
): Promise<{ ok: boolean; message?: string }> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from('appartenance_groupe_entraide_local').insert({
    groupe_id: groupeId,
    personne_id: session.userId,
    role_groupe: 'membre',
  });

  if (error !== null) {
    // Cas typique : appartenance déjà active (index unique partiel).
    if (/duplicate key/i.test(error.message)) {
      return { ok: false, message: 'Tu es déjà membre de ce groupe.' };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath('/s-entraider/groupes-locaux');
  return { ok: true };
}

export async function quitterGroupe(groupeId: string): Promise<{ ok: boolean; message?: string }> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('appartenance_groupe_entraide_local')
    .update({ est_active: false, quitte_le: new Date().toISOString() })
    .eq('groupe_id', groupeId)
    .eq('personne_id', session.userId)
    .eq('est_active', true);

  if (error !== null) {
    return { ok: false, message: error.message };
  }
  revalidatePath('/s-entraider/groupes-locaux');
  return { ok: true };
}

async function trouverSlugLibre(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  base: string,
): Promise<string> {
  let candidat = base;
  let suffixe = 2;
  // Borne dure pour éviter une boucle infinie pathologique (50 collisions).
  for (let tentative = 0; tentative < 50; tentative++) {
    const { count } = await supabase
      .from('groupe_entraide_local')
      .select('id', { count: 'exact', head: true })
      .eq('slug', candidat);
    if ((count ?? 0) === 0) return candidat;
    candidat = `${base}-${suffixe}`.slice(0, 80);
    suffixe += 1;
  }
  // En dernier recours, slug + timestamp.
  return `${base}-${Date.now()}`.slice(0, 80);
}
