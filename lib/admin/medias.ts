import { getSupabaseServer } from '@/lib/supabase';

export interface LigneMediaAdmin {
  id: string;
  slug: string;
  titre: string;
  type: string;
  statut: string;
  publieLe: string | null;
  auteuriceId: string | null;
  provenanceExterne: string | null;
  vignetteUrl: string | null;
  createdAt: string;
}

export interface OptionsListeMedias {
  motCle?: string;
  statut?: 'tous' | 'publie' | 'brouillon' | 'retire';
  type?: string;
  limite?: number;
}

/**
 * Liste les médias pour la console admin (V2.4.54).
 *
 * Filtres : motCle (titre/corps), statut, type (edito/tribune/article/
 * breve/dessin/podcast/video/live/newsletter).
 */
export async function listerMediasAdmin(
  options: OptionsListeMedias = {},
): Promise<LigneMediaAdmin[]> {
  const supabase = await getSupabaseServer();
  let query = supabase
    .from('media')
    .select(
      'id, slug, titre, type, statut, publie_le, auteurice_id, provenance_externe, vignette_url, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(options.limite ?? 100);

  if (options.statut !== undefined && options.statut !== 'tous') {
    query = query.eq('statut', options.statut);
  }

  if (options.type !== undefined && options.type.trim() !== '') {
    query = query.eq('type', options.type.trim());
  }

  if (options.motCle !== undefined && options.motCle.trim() !== '') {
    const motif = `%${options.motCle.trim()}%`;
    query = query.or(`titre.ilike.${motif},corps.ilike.${motif}`);
  }

  const { data } = await query;
  return (data ?? []).map((m) => ({
    id: m.id,
    slug: m.slug,
    titre: m.titre,
    type: m.type,
    statut: m.statut,
    publieLe: m.publie_le,
    auteuriceId: m.auteurice_id,
    provenanceExterne: m.provenance_externe,
    vignetteUrl: m.vignette_url,
    createdAt: m.created_at,
  }));
}
