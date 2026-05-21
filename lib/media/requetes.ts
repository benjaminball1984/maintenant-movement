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
  return hydrater(supabase, data ?? []);
}

export async function mediaParSlug(slug: string): Promise<MediaEnrichi | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('media').select('*').eq('slug', slug).maybeSingle();
  if (data === null) return null;
  const [h] = await hydrater(supabase, [data]);
  return h ?? null;
}
