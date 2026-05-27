import { getSupabaseServer } from '@/lib/supabase';

export interface LigneCampagneAdmin {
  id: string;
  slug: string;
  titre: string;
  statut: string;
  raisonRejet: string | null;
  createurice_id: string;
  imageUrl: string | null;
  createdAt: string;
  modereLe: string | null;
}

export interface OptionsListeCampagnes {
  motCle?: string;
  statut?: 'tous' | 'en_moderation' | 'publiee' | 'rejetee' | 'archivee';
  limite?: number;
}

/**
 * Liste les campagnes pour la console admin (V2.4.57).
 */
export async function listerCampagnesAdmin(
  options: OptionsListeCampagnes = {},
): Promise<LigneCampagneAdmin[]> {
  const supabase = await getSupabaseServer();
  let query = supabase
    .from('campagne')
    .select(
      'id, slug, titre, statut, raison_rejet, createurice_id, image_url, created_at, modere_le',
    )
    .order('created_at', { ascending: false })
    .limit(options.limite ?? 100);

  if (options.statut !== undefined && options.statut !== 'tous') {
    query = query.eq('statut', options.statut);
  }

  if (options.motCle !== undefined && options.motCle.trim() !== '') {
    query = query.ilike('titre', `%${options.motCle.trim()}%`);
  }

  const { data } = await query;
  return (data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    titre: c.titre,
    statut: c.statut,
    raisonRejet: c.raison_rejet,
    createurice_id: c.createurice_id,
    imageUrl: c.image_url,
    createdAt: c.created_at,
    modereLe: c.modere_le,
  }));
}
