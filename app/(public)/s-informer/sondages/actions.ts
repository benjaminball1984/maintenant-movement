'use server';

import { journaliser } from '@/lib/admin/national/journal';
import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { getTurnstileService } from '@/lib/turnstile';
import { slugifierTitreMobilisation } from '@/lib/validations/mobilisation';
import { retirerSondageSchema } from '@/lib/validations/moderation';
import {
  type DonneesCreerSondage,
  type DonneesVoterSondage,
  creerSondageSchema,
  voterSondageSchema,
} from '@/lib/validations/sondages';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions des Sondages (chantier 7.4).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §4D` : vote connecté obligatoire,
 * 2 modes (classique = vote brut ; pondéré = méthode des quotas dès
 * 300 répondant·es).
 */

export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

export async function creerSondage(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string }>> {
  const parse = creerSondageSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerSondage = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour créer un sondage.' };
  }

  const supabase = await getSupabaseServer();
  const slug = await genererSlugUniqueSondage(donnees.titre, supabase);

  const { error } = await supabase.from('sondage').insert({
    slug,
    titre: donnees.titre,
    question: donnees.question,
    options: donnees.options,
    image_url:
      donnees.image_url === '' || donnees.image_url === undefined ? null : donnees.image_url,
    mode: donnees.mode,
    commune_id:
      donnees.commune_id === '' || donnees.commune_id === undefined ? null : donnees.commune_id,
    latitude: donnees.latitude ?? null,
    longitude: donnees.longitude ?? null,
    createurice_id: session.userId,
  });
  if (error !== null) {
    return { ok: false, message: `Création impossible : ${error.message}` };
  }

  revalidatePath('/s-informer/sondages');
  return { ok: true, slug };
}

export async function voterSondage(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = voterSondageSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesVoterSondage = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Vote connecté obligatoire (cf. doctrine §4D).' };
  }

  const supabase = await getSupabaseServer();
  const { data: sondage } = await supabase
    .from('sondage')
    .select('id, options, statut')
    .eq('id', donnees.sondage_id)
    .maybeSingle();
  if (sondage === null) {
    return { ok: false, message: 'Sondage introuvable.' };
  }
  if (sondage.statut !== 'ouvert') {
    return { ok: false, message: 'Ce sondage n’est plus ouvert au vote.' };
  }
  if (donnees.option_index >= sondage.options.length) {
    return { ok: false, message: 'Option hors plage pour ce sondage.' };
  }

  const { error } = await supabase.from('reponse_sondage').insert({
    sondage_id: sondage.id,
    personne_id: session.userId,
    option_index: donnees.option_index,
    code_postal:
      donnees.code_postal === '' || donnees.code_postal === undefined ? null : donnees.code_postal,
    tranche_age: donnees.tranche_age ?? null,
    pronom: donnees.pronom === '' || donnees.pronom === undefined ? null : donnees.pronom,
    genre_declare:
      donnees.genre_declare === '' || donnees.genre_declare === undefined
        ? null
        : donnees.genre_declare,
  });
  if (error !== null) {
    if (error.code === '23505') {
      return { ok: false, message: 'Tu as déjà voté pour ce sondage.' };
    }
    return { ok: false, message: `Vote impossible : ${error.message}` };
  }

  revalidatePath('/s-informer/sondages');
  return { ok: true };
}

// ============================================================
// Retrait d'un sondage (modération a posteriori, admin)
// ============================================================
export async function retirerSondage(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = retirerSondageSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();

  // Droit de modération sur l'onglet Sondages (ou admin général).
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) {
    const { data: estMod } = await supabase.rpc('est_moderateurice', {
      onglet_demande: 'sondages',
    });
    if (estMod !== true) {
      return { ok: false, message: 'Droit de modération requis.' };
    }
  }

  const { data: avant } = await supabase
    .from('sondage')
    .select('id, statut')
    .eq('id', donnees.sondage_id)
    .maybeSingle();
  if (avant === null) {
    return { ok: false, message: 'Sondage introuvable.' };
  }
  if (avant.statut === 'retire') {
    return { ok: false, message: 'Ce sondage est déjà retiré.' };
  }

  const { error } = await supabase
    .from('sondage')
    .update({ statut: 'retire' })
    .eq('id', donnees.sondage_id);
  if (error !== null) {
    return { ok: false, message: `Retrait impossible : ${error.message}` };
  }

  await journaliser({
    action: 'sondage.retire',
    cibleTable: 'sondage',
    cibleId: donnees.sondage_id,
    ancienEtat: { statut: avant.statut },
    nouvelEtat: { statut: 'retire', raison: donnees.raison },
  });

  revalidatePath('/s-informer/sondages');
  revalidatePath('/admin/moderation/sondages');
  return { ok: true };
}

async function genererSlugUniqueSondage(titre: string, supabase: ClientSupabase): Promise<string> {
  const base = slugifierTitreMobilisation(titre);
  if (base === '') return `sondage-${Date.now()}`;
  let candidat = base;
  for (let i = 2; i <= 1000; i += 1) {
    const { count } = await supabase
      .from('sondage')
      .select('id', { count: 'exact', head: true })
      .eq('slug', candidat);
    if ((count ?? 0) === 0) return candidat;
    candidat = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}
