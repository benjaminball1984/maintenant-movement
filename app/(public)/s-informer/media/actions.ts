'use server';

import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { getTurnstileService } from '@/lib/turnstile';
import {
  type DonneesCreerMedia,
  type DonneesPublierMedia,
  type DonneesRetirerMedia,
  creerMediaSchema,
  publierMediaSchema,
  retirerMediaSchema,
} from '@/lib/validations/media';
import { slugifierTitreMobilisation } from '@/lib/validations/mobilisation';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions de Maintenant Médias (chantier 7.1).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §4A`.
 *
 * Flux : créer en brouillon → publier (admin/modé pour éditos +
 * newsletters ; auteurice elle-même pour articles/tribunes/etc.).
 * Retrait par modération a posteriori.
 */

export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

export async function creerMedia(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string }>> {
  const parse = creerMediaSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerMedia = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return { ok: false, message: 'La vérification anti-bot a échoué.' };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();
  const slug = await genererSlugUniqueMedia(donnees.titre, supabase);

  const { error } = await supabase.from('media').insert({
    slug,
    titre: donnees.titre,
    corps: donnees.corps,
    type: donnees.type,
    auteurice_id: session.userId,
    provenance_externe:
      donnees.provenance_externe === '' || donnees.provenance_externe === undefined
        ? null
        : donnees.provenance_externe,
    source_url:
      donnees.source_url === '' || donnees.source_url === undefined ? null : donnees.source_url,
    media_url:
      donnees.media_url === '' || donnees.media_url === undefined ? null : donnees.media_url,
    vignette_url:
      donnees.vignette_url === '' || donnees.vignette_url === undefined
        ? null
        : donnees.vignette_url,
    tags: donnees.tags ?? null,
  });
  if (error !== null) {
    return { ok: false, message: `Création impossible : ${error.message}` };
  }

  revalidatePath('/s-informer/media');
  return { ok: true, slug };
}

export async function publierMedia(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = publierMediaSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesPublierMedia = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();

  const { data: media } = await supabase
    .from('media')
    .select('auteurice_id, type, statut')
    .eq('id', donnees.media_id)
    .maybeSingle();
  if (media === null) {
    return { ok: false, message: 'Média introuvable.' };
  }
  if (media.statut !== 'brouillon') {
    return { ok: false, message: 'Seul un brouillon peut être publié.' };
  }

  // Éditos + newsletters : équipe nationale uniquement.
  if (media.type === 'edito' || media.type === 'newsletter') {
    const { data: estNational } = await supabase.rpc('est_admin_national');
    if (estNational !== true) {
      return {
        ok: false,
        message: 'Seul l’admin national peut publier un édito ou une newsletter.',
      };
    }
  } else if (media.auteurice_id !== session.userId) {
    const droits = await aDroitsMedia(supabase);
    if (!droits) {
      return { ok: false, message: 'Tu ne peux pas publier ce média.' };
    }
  }

  const { error } = await supabase
    .from('media')
    .update({ statut: 'publie', publie_le: new Date().toISOString() })
    .eq('id', donnees.media_id);
  if (error !== null) {
    return { ok: false, message: `Publication impossible : ${error.message}` };
  }

  revalidatePath('/s-informer/media');
  return { ok: true };
}

export async function retirerMedia(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = retirerMediaSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesRetirerMedia = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }
  const supabase = await getSupabaseServer();
  const droits = await aDroitsMedia(supabase);
  if (!droits) {
    return { ok: false, message: 'Droit de modération média requis.' };
  }

  const { error } = await supabase
    .from('media')
    .update({
      statut: 'retire',
      retire_par: session.userId,
      retire_le: new Date().toISOString(),
      raison_retrait: donnees.raison_retrait,
    })
    .eq('id', donnees.media_id);
  if (error !== null) {
    return { ok: false, message: `Retrait impossible : ${error.message}` };
  }

  revalidatePath('/s-informer/media');
  return { ok: true };
}

async function aDroitsMedia(supabase: ClientSupabase): Promise<boolean> {
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin === true) return true;
  const { data: estMod } = await supabase.rpc('est_moderateurice', {
    onglet_demande: 'media',
  });
  return estMod === true;
}

async function genererSlugUniqueMedia(titre: string, supabase: ClientSupabase): Promise<string> {
  const base = slugifierTitreMobilisation(titre);
  if (base === '') return `media-${Date.now()}`;
  let candidat = base;
  for (let i = 2; i <= 1000; i += 1) {
    const { count } = await supabase
      .from('media')
      .select('id', { count: 'exact', head: true })
      .eq('slug', candidat);
    if ((count ?? 0) === 0) return candidat;
    candidat = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}
