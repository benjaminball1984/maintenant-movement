'use server';

import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { getTurnstileService } from '@/lib/turnstile';
import {
  type DonneesCloturerOffre,
  type DonneesCreerOffreEntraide,
  type DonneesRetirerOffre,
  cloturerOffreSchema,
  creerOffreEntraideSchema,
  retirerOffreSchema,
} from '@/lib/validations/entraide';
import { slugifierTitreMobilisation } from '@/lib/validations/mobilisation';
import type { Json } from '@/types/database';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions du sous-espace S'entraider (chantier 4.1).
 *
 * Mêmes conventions que mobilisations (modération a posteriori,
 * pattern ResultatAction, défense en profondeur).
 */
export type ResultatAction<TPayload = unknown> =
  | ({ ok: true } & TPayload)
  | { ok: false; message: string };

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

const ROUTES_PAR_TYPE: Record<DonneesCreerOffreEntraide['type'], string> = {
  hebergement: '/s-entraider/hebergement',
  transport: '/s-entraider/transport',
  pret_objet: '/s-entraider/qui-prete-tout',
  fruits_terre: '/s-entraider/fruits-de-la-terre',
};

export async function creerOffreEntraide(
  donneesBrutes: unknown,
): Promise<ResultatAction<{ slug: string; type: DonneesCreerOffreEntraide['type'] }>> {
  const parse = creerOffreEntraideSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCreerOffreEntraide = parse.data;

  const turnstile = await getTurnstileService().verifier(donnees.token_turnstile);
  if (!turnstile.succes) {
    return {
      ok: false,
      message: 'La vérification anti-bot a échoué. Recharger la page et réessayer.',
    };
  }

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour publier une offre.' };
  }

  const supabase = await getSupabaseServer();
  const slug = await genererSlugUnique(donnees.titre, supabase);

  const { error } = await supabase.from('offre_entraide').insert({
    slug,
    titre: donnees.titre,
    description: donnees.description,
    type: donnees.type,
    sens: donnees.sens,
    lieu: donnees.lieu,
    latitude: donnees.latitude ?? null,
    longitude: donnees.longitude ?? null,
    image_url: donnees.image_url === '' ? null : (donnees.image_url ?? null),
    // Le typage Zod (`Record<string, unknown>`) est plus permissif que
    // `Json` (qui exclut undefined). On caste : la validation Zod a déjà
    // assuré que les valeurs sont sérialisables côté serveur.
    meta: (donnees.meta ?? {}) as Json,
    createurice_id: session.userId,
  });

  if (error !== null) {
    return { ok: false, message: `Publication impossible : ${error.message}` };
  }

  revalidatePath(ROUTES_PAR_TYPE[donnees.type]);
  revalidatePath('/s-entraider');
  revalidatePath('/carte');
  return { ok: true, slug, type: donnees.type };
}

export async function retirerOffre(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = retirerOffreSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesRetirerOffre = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();

  const { data: offre } = await supabase
    .from('offre_entraide')
    .select('id, createurice_id, statut, slug, type')
    .eq('id', donnees.offre_id)
    .maybeSingle();
  if (offre === null) {
    return { ok: false, message: 'Offre introuvable.' };
  }
  if (offre.statut === 'retiree') {
    return { ok: false, message: 'Cette offre est déjà retirée.' };
  }

  const estCreaturice = offre.createurice_id === session.userId;
  if (!estCreaturice) {
    const droit = await verifierDroit(supabase);
    if (!droit) return { ok: false, message: 'Droit de retrait requis.' };
  }

  const { error } = await supabase
    .from('offre_entraide')
    .update({
      statut: 'retiree',
      retire_par: session.userId,
      retire_le: new Date().toISOString(),
      raison_retrait: donnees.raison_retrait,
    })
    .eq('id', donnees.offre_id);

  if (error !== null) {
    return { ok: false, message: `Retrait impossible : ${error.message}` };
  }

  revalidatePath(ROUTES_PAR_TYPE[offre.type as DonneesCreerOffreEntraide['type']]);
  revalidatePath(`/s-entraider/offre/${offre.slug}`);
  return { ok: true };
}

export async function cloturerOffre(donneesBrutes: unknown): Promise<ResultatAction> {
  const parse = cloturerOffreSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees: DonneesCloturerOffre = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Authentification requise.' };
  }

  const supabase = await getSupabaseServer();

  const { data: offre } = await supabase
    .from('offre_entraide')
    .select('id, createurice_id, statut, slug, type')
    .eq('id', donnees.offre_id)
    .maybeSingle();
  if (offre === null) {
    return { ok: false, message: 'Offre introuvable.' };
  }
  if (offre.statut === 'cloturee') {
    return { ok: false, message: 'Cette offre est déjà clôturée.' };
  }

  const estCreaturice = offre.createurice_id === session.userId;
  if (!estCreaturice) {
    const droit = await verifierDroit(supabase);
    if (!droit) return { ok: false, message: 'Droit de clôture requis.' };
  }

  const { error } = await supabase
    .from('offre_entraide')
    .update({ statut: 'cloturee' })
    .eq('id', donnees.offre_id);

  if (error !== null) {
    return { ok: false, message: `Clôture impossible : ${error.message}` };
  }

  revalidatePath(ROUTES_PAR_TYPE[offre.type as DonneesCreerOffreEntraide['type']]);
  revalidatePath(`/s-entraider/offre/${offre.slug}`);
  return { ok: true };
}

async function genererSlugUnique(titre: string, supabase: ClientSupabase): Promise<string> {
  const base = slugifierTitreMobilisation(titre);
  if (base === '') {
    return `offre-${Date.now()}`;
  }
  let candidat = base;
  for (let i = 2; i <= 1000; i += 1) {
    const { count } = await supabase
      .from('offre_entraide')
      .select('id', { count: 'exact', head: true })
      .eq('slug', candidat);
    if ((count ?? 0) === 0) return candidat;
    candidat = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

async function verifierDroit(supabase: ClientSupabase): Promise<boolean> {
  const { data: estMod } = await supabase.rpc('est_moderateurice', {
    onglet_demande: 'entraide',
  });
  if (estMod === true) return true;
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  return estAdmin === true;
}
