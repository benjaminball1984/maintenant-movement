'use server';

import { getSession } from '@/lib/auth/session';
import { sanitizeRichHtml } from '@/lib/rich-text/sanitize';
import { getSupabaseServer } from '@/lib/supabase';
import { getTurnstileService } from '@/lib/turnstile';
import {
  type DonneesCreerMobilisation,
  type DonneesParticiperMobilisation,
  type DonneesRetirerMobilisation,
  creerMobilisationSchema,
  participerMobilisationSchema,
  retirerMobilisationSchema,
  slugifierTitreMobilisation,
} from '@/lib/validations/mobilisation';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions du sous-espace Mobilisations (chantier 3.2).
 *
 * Mêmes conventions que pétitions (3.1) : pattern `ResultatAction`,
 * vérifications applicatives en doublon de la RLS (défense en profondeur
 * + messages clairs en français).
 */
export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

// ============================================================
// Création d'une mobilisation (auth requise, statut = publiee)
// ============================================================
export async function creerMobilisation(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string }>> {
  const parse = creerMobilisationSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerMobilisation = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return {
      ok: false,
      message: 'La vérification anti-bot a échoué. Recharger la page et réessayer.',
    };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour créer une mobilisation.' };
  }

  const supabase = await getSupabaseServer();
  const slug = await genererSlugUnique(donnees.titre, supabase);

  const dateFin =
    donnees.date_fin === '' || donnees.date_fin === undefined ? null : donnees.date_fin;

  // V2.5.52 — sanitize HTML riche optionnel avant insertion.
  const descriptionHtmlPropre =
    donnees.description_html !== undefined && donnees.description_html.trim() !== ''
      ? sanitizeRichHtml(donnees.description_html)
      : null;

  const { error } = await supabase.from('mobilisation').insert({
    slug,
    titre: donnees.titre,
    description: donnees.description,
    description_html: descriptionHtmlPropre,
    lieu: donnees.lieu,
    latitude: donnees.latitude ?? null,
    longitude: donnees.longitude ?? null,
    image_url: donnees.image_url === '' ? null : (donnees.image_url ?? null),
    date_debut: donnees.date_debut,
    date_fin: dateFin,
    createurice_id: session.userId,
    // statut default = 'publiee' (modération a posteriori, cf. migration 014)
  });

  if (error !== null) {
    return { ok: false, message: `Création impossible : ${error.message}` };
  }

  revalidatePath('/mobiliser/mobilisations');
  revalidatePath('/carte');
  revalidatePath('/');
  return { ok: true, slug };
}

// ============================================================
// Participation (anonyme ou connectée)
// ============================================================
export async function participerMobilisation(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = participerMobilisationSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesParticiperMobilisation = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return {
      ok: false,
      message: 'La vérification anti-bot a échoué. Recharger la page et réessayer.',
    };
  }

  const supabase = await getSupabaseServer();
  const session = await getSession();

  const { data: mobilisation, error: erreurLecture } = await supabase
    .from('mobilisation')
    .select('id, statut, slug')
    .eq('id', donnees.mobilisation_id)
    .maybeSingle();

  if (erreurLecture !== null || mobilisation === null) {
    return { ok: false, message: 'Mobilisation introuvable.' };
  }
  if (mobilisation.statut !== 'publiee') {
    return {
      ok: false,
      message: 'Cette mobilisation a été retirée et n’accepte plus de participations.',
    };
  }

  const codePostal =
    donnees.code_postal === '' || donnees.code_postal === undefined ? null : donnees.code_postal;

  const { error: erreurInsert } = await supabase.from('participation_mobilisation').insert({
    mobilisation_id: mobilisation.id,
    personne_id: session?.userId ?? null,
    code_postal: codePostal,
    accepte_notifications: donnees.accepte_notifications,
  });

  if (erreurInsert !== null) {
    // Code 23505 = unique violation : déjà participé (cas connecté).
    if (erreurInsert.code === '23505') {
      return { ok: false, message: 'Tu participes déjà à cette mobilisation.' };
    }
    return { ok: false, message: `Participation impossible : ${erreurInsert.message}` };
  }

  revalidatePath(`/mobiliser/mobilisations/${mobilisation.slug}`);
  return { ok: true };
}

// ============================================================
// Retrait a posteriori (créateurice OU modé OU admin)
// ============================================================
export async function retirerMobilisation(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = retirerMobilisationSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesRetirerMobilisation = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();

  // Vérifie le droit (la RLS impose déjà, mais on veut un message clair).
  const { data: mobilisation } = await supabase
    .from('mobilisation')
    .select('id, createurice_id, statut, slug')
    .eq('id', donnees.mobilisation_id)
    .maybeSingle();

  if (mobilisation === null) {
    return { ok: false, message: 'Mobilisation introuvable.' };
  }
  if (mobilisation.statut === 'retiree') {
    return { ok: false, message: 'Cette mobilisation est déjà retirée.' };
  }

  const estCreaturice = mobilisation.createurice_id === session.userId;
  let aDroit = estCreaturice;
  if (!aDroit) {
    const { data: estMod } = await supabase.rpc('est_moderateurice', {
      onglet_demande: 'mobilisations',
    });
    aDroit = estMod === true;
  }
  if (!aDroit) {
    const { data: estAdmin } = await supabase.rpc('est_admin_general');
    aDroit = estAdmin === true;
  }
  if (!aDroit) {
    return { ok: false, message: 'Droit de retrait requis.' };
  }

  const { error } = await supabase
    .from('mobilisation')
    .update({
      statut: 'retiree',
      retire_par: session.userId,
      retire_le: new Date().toISOString(),
      raison_retrait: donnees.raison_retrait,
    })
    .eq('id', donnees.mobilisation_id);

  if (error !== null) {
    return { ok: false, message: `Retrait impossible : ${error.message}` };
  }

  revalidatePath('/mobiliser/mobilisations');
  revalidatePath('/admin/moderation/mobilisations');
  revalidatePath(`/mobiliser/mobilisations/${mobilisation.slug}`);
  revalidatePath('/carte');
  revalidatePath('/');
  return { ok: true };
}

// ============================================================
// Helpers internes
// ============================================================

async function genererSlugUnique(titre: string, supabase: ClientSupabase): Promise<string> {
  const base = slugifierTitreMobilisation(titre);
  if (base === '') {
    return `mobilisation-${Date.now()}`;
  }

  let candidat = base;
  for (let i = 2; i <= 1000; i += 1) {
    const { count } = await supabase
      .from('mobilisation')
      .select('id', { count: 'exact', head: true })
      .eq('slug', candidat);

    if ((count ?? 0) === 0) {
      return candidat;
    }
    candidat = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}
