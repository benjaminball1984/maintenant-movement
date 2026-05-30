'use server';

import { getSession } from '@/lib/auth/session';
import {
  coopterGestionnaireSchema,
  creerOrganisationSchema,
  mettreAJourOrganisationSchema,
} from '@/lib/organisations/validation';
import { slugifier, slugifierAvecSuffixeTemps } from '@/lib/slug';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

type Resultat = { ok: true; slug: string } | { ok: false; message: string };
type ResultatSimple = { ok: true } | { ok: false; message: string };

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

  const { data: orgCreee, error } = await supabase
    .from('organisation')
    .insert({
      slug,
      nom: donnees.nom,
      type_organisation: donnees.type_organisation,
      description: donnees.description === '' ? null : (donnees.description ?? null),
      image_url: donnees.image_url === '' ? null : (donnees.image_url ?? null),
      cree_par: session.userId,
    })
    .select('id')
    .single();
  if (error !== null || orgCreee === null) {
    return { ok: false, message: `Création impossible : ${error?.message ?? ''}` };
  }

  // B.2 : le·la créateur·ice devient gestionnaire (via la RPC SECURITY DEFINER
  // qui vérifie qu'iel est bien le·la créateur·ice). Best-effort : si ça échoue,
  // la gestion via `cree_par` reste possible.
  await supabase.rpc('bootstrap_gestionnaire_organisation', { p_org_id: orgCreee.id });

  revalidatePath('/organisations');
  return { ok: true, slug };
}

/**
 * Met à jour la page d'une organisation (nom, type, description, logo).
 * La RLS n'autorise que les gestionnaires, le·la créateur·ice ou l'admin.
 */
export async function mettreAJourOrganisationAction(
  donneesBrutes: unknown,
): Promise<ResultatSimple> {
  const parse = mettreAJourOrganisationSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const d = parse.data;
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('organisation')
    .update({
      nom: d.nom,
      type_organisation: d.type_organisation,
      description: d.description === '' ? null : (d.description ?? null),
      image_url: d.image_url === '' ? null : (d.image_url ?? null),
    })
    .eq('id', d.id)
    .select('slug')
    .maybeSingle();
  if (error !== null) {
    return { ok: false, message: `Mise à jour impossible : ${error.message}` };
  }
  if (data === null) {
    return { ok: false, message: 'Tu n’as pas les droits pour modifier cette organisation.' };
  }
  revalidatePath(`/organisations/${data.slug}`);
  return { ok: true };
}

/**
 * Coopte une personne comme gestionnaire (par son numéro réseau M+7).
 * Réservé à un gestionnaire d'une organisation DÉJÀ officielle (voie 2) :
 * la RPC `coopter_gestionnaire_organisation` applique cette règle.
 */
export async function coopterGestionnaireAction(donneesBrutes: unknown): Promise<ResultatSimple> {
  const parse = coopterGestionnaireSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();

  // Résout le numéro public M+7 en identifiant de personne.
  const { data: personneId } = await supabase.rpc('personne_id_par_numero', {
    numero_cible: parse.data.numero,
  });
  if (personneId === null || typeof personneId !== 'string') {
    return { ok: false, message: 'Aucune personne ne correspond à ce numéro réseau.' };
  }

  const { data: ok } = await supabase.rpc('coopter_gestionnaire_organisation', {
    p_org_id: parse.data.org_id,
    p_personne_cible: personneId,
  });
  if (ok !== true) {
    return {
      ok: false,
      message:
        'Cooptation impossible : il faut être gestionnaire d’une organisation déjà officielle.',
    };
  }
  revalidatePath('/organisations');
  return { ok: true };
}

/** Retire un·e gestionnaire (jamais le·la dernier·e). Gestionnaire ou admin. */
export async function retirerGestionnaireAction(donneesBrutes: unknown): Promise<ResultatSimple> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const gestionnaireId =
    typeof donneesBrutes === 'object' && donneesBrutes !== null
      ? (donneesBrutes as { gestionnaire_id?: unknown }).gestionnaire_id
      : undefined;
  if (typeof gestionnaireId !== 'string') {
    return { ok: false, message: 'Identifiant de gestionnaire invalide.' };
  }
  const supabase = await getSupabaseServer();
  const { data: ok } = await supabase.rpc('retirer_gestionnaire', {
    p_gestionnaire_id: gestionnaireId,
  });
  if (ok !== true) {
    return {
      ok: false,
      message: 'Retrait impossible (droits insuffisants, ou c’est le·la dernier·e gestionnaire).',
    };
  }
  revalidatePath('/organisations');
  return { ok: true };
}

/**
 * Accorde ou retire le badge « officiel » d'une organisation. Réservé à
 * l'admin (voie 2). La RPC `definir_badge_officiel_organisation` vérifie le
 * droit admin.
 */
export async function definirBadgeOfficielAction(donneesBrutes: unknown): Promise<ResultatSimple> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const o =
    typeof donneesBrutes === 'object' && donneesBrutes !== null
      ? (donneesBrutes as { org_id?: unknown; officiel?: unknown })
      : {};
  if (typeof o.org_id !== 'string' || typeof o.officiel !== 'boolean') {
    return { ok: false, message: 'Données invalides.' };
  }
  const supabase = await getSupabaseServer();
  const { data: ok } = await supabase.rpc('definir_badge_officiel_organisation', {
    p_org_id: o.org_id,
    p_officiel: o.officiel,
  });
  if (ok !== true) {
    return { ok: false, message: 'Action réservée à l’administration.' };
  }
  revalidatePath('/organisations');
  return { ok: true };
}
