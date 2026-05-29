'use server';

import { getSession } from '@/lib/auth/session';
import { sanitizeRichHtml } from '@/lib/rich-text/sanitize';
import { getSupabaseServer } from '@/lib/supabase';
import { getTurnstileService } from '@/lib/turnstile';
import {
  type DonneesAttacherModule,
  type DonneesCreerCampagne,
  type DonneesDetacherModule,
  type DonneesModererCampagne,
  attacherModuleSchema,
  creerCampagneSchema,
  detacherModuleSchema,
  modererCampagneSchema,
} from '@/lib/validations/campagne';
import { slugifierTitreMobilisation } from '@/lib/validations/mobilisation';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions du sous-espace Campagnes (chantier 3.2).
 *
 * Modération a priori (cf. spec §11) ; gestion des modules combinables
 * via la table `module_campagne` (cf. migration 017).
 */
export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

// ============================================================
// Création d'une campagne (auth requise, statut = en_moderation)
// ============================================================
export async function creerCampagne(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string; campagne_id: string }>> {
  const parse = creerCampagneSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerCampagne = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return {
      ok: false,
      message: 'La vérification anti-bot a échoué. Recharger la page et réessayer.',
    };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour créer une campagne.' };
  }

  const supabase = await getSupabaseServer();
  const slug = await genererSlugUnique(donnees.titre, supabase);

  // V2.5.50 — sanitize HTML riche optionnel avant insertion.
  const texteHtmlPropre =
    donnees.texte_html !== undefined && donnees.texte_html.trim() !== ''
      ? sanitizeRichHtml(donnees.texte_html)
      : null;

  const { data: cree, error } = await supabase
    .from('campagne')
    .insert({
      slug,
      titre: donnees.titre,
      texte: donnees.texte,
      texte_html: texteHtmlPropre,
      image_url: donnees.image_url === '' ? null : (donnees.image_url ?? null),
      createurice_id: session.userId,
      statut: 'en_moderation',
    })
    .select('id, slug')
    .single();

  if (error !== null || cree === null) {
    return { ok: false, message: `Création impossible : ${error?.message ?? 'erreur inconnue'}` };
  }

  revalidatePath('/mobiliser/campagnes');
  return { ok: true, slug: cree.slug, campagne_id: cree.id };
}

// ============================================================
// Modération a priori
// ============================================================
export async function modererCampagne(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = modererCampagneSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesModererCampagne = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();

  const { data: aDroitMod } = await supabase.rpc('est_moderateurice', {
    onglet_demande: 'campagnes',
  });
  if (aDroitMod !== true) {
    const { data: aDroitGeneral } = await supabase.rpc('est_admin_general');
    if (aDroitGeneral !== true) {
      return { ok: false, message: 'Droit de modération requis.' };
    }
  }

  const { error } = await supabase
    .from('campagne')
    .update({
      statut: donnees.decision,
      modere_par: session.userId,
      modere_le: new Date().toISOString(),
      raison_rejet: donnees.decision === 'rejetee' ? (donnees.raison_rejet ?? null) : null,
    })
    .eq('id', donnees.campagne_id);

  if (error !== null) {
    return { ok: false, message: `Modération impossible : ${error.message}` };
  }

  revalidatePath('/admin/moderation/campagnes');
  revalidatePath('/mobiliser/campagnes');
  return { ok: true };
}

// ============================================================
// Attache d'un module à une campagne
// ============================================================
export async function attacherModule(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = attacherModuleSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesAttacherModule = parse.data;

  const supabase = await getSupabaseServer();

  // Si la cible référence une entité concrète, on vérifie qu'elle existe
  // et est dans un état attachable. La RLS sur `module_campagne` impose
  // déjà la lecture côté campagne, mais ici on valide la cible elle-même
  // (ce que la BDD ne peut pas faire — FK polymorphe).
  if (donnees.type_module !== 'page_editoriale' && donnees.cible_id !== undefined) {
    const verif = await verifierCible(supabase, donnees.type_module, donnees.cible_id);
    if (!verif.ok) {
      return verif;
    }
  }

  const { error } = await supabase.from('module_campagne').insert({
    campagne_id: donnees.campagne_id,
    type_module: donnees.type_module,
    cible_id: donnees.cible_id ?? null,
    contenu_editorial: donnees.contenu_editorial ?? null,
    ordre: donnees.ordre,
  });

  if (error !== null) {
    if (error.code === '23505') {
      return { ok: false, message: 'Ce module est déjà attaché à cette campagne.' };
    }
    return { ok: false, message: `Attachement impossible : ${error.message}` };
  }

  revalidatePath('/mobiliser/campagnes');
  return { ok: true };
}

// ============================================================
// Détache d'un module
// ============================================================
export async function detacherModule(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = detacherModuleSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesDetacherModule = parse.data;

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from('module_campagne').delete().eq('id', donnees.module_id);

  if (error !== null) {
    return { ok: false, message: `Détachement impossible : ${error.message}` };
  }

  revalidatePath('/mobiliser/campagnes');
  return { ok: true };
}

// ============================================================
// Helpers internes
// ============================================================

async function genererSlugUnique(titre: string, supabase: ClientSupabase): Promise<string> {
  // Réutilise le slugifieur posé pour mobilisations / pétitions
  // (algorithme identique : on aurait pu factoriser en `lib/slug.ts`,
  // au prochain chantier qui en exprime le besoin).
  const base = slugifierTitreMobilisation(titre);
  if (base === '') {
    return `campagne-${Date.now()}`;
  }

  let candidat = base;
  for (let i = 2; i <= 1000; i += 1) {
    const { count } = await supabase
      .from('campagne')
      .select('id', { count: 'exact', head: true })
      .eq('slug', candidat);

    if ((count ?? 0) === 0) {
      return candidat;
    }
    candidat = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Vérifie qu'une cible référencée par un module existe et est dans un
 * état autorisant l'attachement (publiée pour les pétitions et
 * mobilisations). Les cagnottes et sondages ne sont pas encore en BDD
 * (chantiers 3.3 et 7.5) : on retourne une erreur explicite si on les
 * voit passer.
 */
async function verifierCible(
  supabase: ClientSupabase,
  typeModule: 'petition' | 'mobilisation' | 'cagnotte' | 'sondage',
  cibleId: string,
): Promise<ResultatAction> {
  if (typeModule === 'petition') {
    const { data } = await supabase
      .from('petition')
      .select('id, statut')
      .eq('id', cibleId)
      .maybeSingle();
    if (data === null) return { ok: false, message: 'Pétition cible introuvable.' };
    if (data.statut !== 'publiee') {
      return { ok: false, message: 'La pétition cible doit être publiée pour être attachée.' };
    }
    return { ok: true };
  }

  if (typeModule === 'mobilisation') {
    const { data } = await supabase
      .from('mobilisation')
      .select('id, statut')
      .eq('id', cibleId)
      .maybeSingle();
    if (data === null) return { ok: false, message: 'Mobilisation cible introuvable.' };
    if (data.statut !== 'publiee') {
      return { ok: false, message: 'La mobilisation cible doit être publiée pour être attachée.' };
    }
    return { ok: true };
  }

  // cagnotte (3.3) et sondage (7.5) : tables pas encore créées.
  return {
    ok: false,
    message: `Les modules de type "${typeModule}" ne sont pas encore disponibles (cf. chantiers 3.3 et 7.5).`,
  };
}
