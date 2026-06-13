import { getSupabaseServer } from '@/lib/supabase';
import type { Media, TypeMedia } from '@/types/database';

/**
 * Couche de requêtes Maintenant Médias (chantier 7.1).
 */

export interface MediaEnrichi extends Media {
  auteurice_prenom: string | null;
  auteurice_nom: string | null;
}

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

async function hydrater(supabase: ClientSupabase, medias: Media[]): Promise<MediaEnrichi[]> {
  if (medias.length === 0) return [];
  const ids = [
    ...new Set(medias.map((m) => m.auteurice_id).filter((id): id is string => id !== null)),
  ];
  const { data } = await supabase.from('personne').select('id, prenom, nom').in('id', ids);
  const idx = new Map((data ?? []).map((p) => [p.id, { prenom: p.prenom, nom: p.nom }]));
  return medias.map((m) => {
    const p = m.auteurice_id !== null ? idx.get(m.auteurice_id) : undefined;
    return {
      ...m,
      auteurice_prenom: p?.prenom ?? null,
      auteurice_nom: p?.nom ?? null,
    };
  });
}

export async function listerMediasPublies(type?: TypeMedia, limite = 50): Promise<MediaEnrichi[]> {
  const supabase = await getSupabaseServer();
  let q = supabase
    .from('media')
    .select('*')
    .eq('statut', 'publie')
    .order('publie_le', { ascending: false })
    .limit(limite);
  if (type !== undefined) q = q.eq('type', type);
  const { data } = await q;
  return hydrater(supabase, (data ?? []) as Media[]);
}

/**
 * Flux de la page Maintenant Médias (revue 2026-06-12) : tous les
 * contenus publiés (articles maison ET brèves de la revue de presse),
 * antichronologique, filtrables par tag.
 */
export async function listerFluxMedias(tag?: string, limite = 150): Promise<MediaEnrichi[]> {
  const supabase = await getSupabaseServer();
  // Tri par ORDRE D'ARRIVÉE dans la revue (created_at), pas par date de
  // publication de l'article (revue 2026-06-13, Ben : « flux vivant »).
  // Un podcast publié il y a 5 h mais importé à l'instant doit remonter en
  // tête : sinon le flux paraît figé alors qu'il s'alimente chaque heure.
  let q = supabase
    .from('media')
    .select('*')
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
    .limit(limite);
  if (tag !== undefined && tag !== '') q = q.contains('tags', [tag]);
  const { data } = await q;
  return hydrater(supabase, (data ?? []) as Media[]);
}

/**
 * Contenus MAISON publiés (tout sauf les brèves importées) : toujours
 * affichés sur la page Médias, quelle que soit leur date (revue
 * 2026-06-12, Ben : « il faut mettre tous les articles que l'admin
 * choisira de sélectionner »).
 */
export async function listerMediasMaison(limite = 40): Promise<MediaEnrichi[]> {
  const supabase = await getSupabaseServer();
  // MAISON = produit par la rédaction : provenance_externe NULL. Le filtre
  // `type != breve` ne suffit plus depuis la revue de presse multi-format
  // (2026-06-13) : podcasts/vidéos/lives/dessins importés ont aussi un
  // type != breve mais une provenance externe, et noyaient les vrais
  // articles maison dans le bandeau « La rédaction » (bug signalé par Ben).
  const { data } = await supabase
    .from('media')
    .select('*')
    .eq('statut', 'publie')
    .is('provenance_externe', null)
    .order('publie_le', { ascending: false })
    .limit(limite);
  return hydrater(supabase, (data ?? []) as Media[]);
}

/** Media publié par id (article épinglé à la une de la page Médias). */
export async function mediaPublieParId(id: string): Promise<MediaEnrichi | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('media')
    .select('*')
    .eq('id', id)
    .eq('statut', 'publie')
    .maybeSingle();
  if (data === null) return null;
  const [h] = await hydrater(supabase, [data as Media]);
  return h ?? null;
}

export async function mediaParSlug(slug: string): Promise<MediaEnrichi | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('media').select('*').eq('slug', slug).maybeSingle();
  if (data === null) return null;
  const [h] = await hydrater(supabase, [data as Media]);
  return h ?? null;
}
