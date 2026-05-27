import { getSupabaseServer } from '@/lib/supabase';

export interface LigneMomentAdmin {
  id: string;
  slug: string;
  titre: string;
  type: string;
  sousType: string | null;
  lieu: string;
  commenceLe: string;
  termineLe: string | null;
  statut: string;
  createurice_id: string;
  createdAt: string;
}

export interface OptionsListeMoments {
  motCle?: string;
  statut?: 'tous' | 'annonce' | 'en_cours' | 'termine' | 'annule' | 'retire';
  type?: string; // 'porte_a_porte', 'maraude', ...
  limite?: number;
}

/**
 * Liste les moments solidaires pour la console admin (V2.4.51).
 *
 * Filtres :
 * - motCle : ilike sur titre / lieu
 * - statut : 'tous' | 'annonce' | 'en_cours' | 'termine' | 'annule' | 'retire'
 * - type : type de moment (porte_a_porte, maraude, etc.)
 *
 * Limite 100 par défaut, triés par date de début décroissante.
 */
export async function listerMomentsAdmin(
  options: OptionsListeMoments = {},
): Promise<LigneMomentAdmin[]> {
  const supabase = await getSupabaseServer();
  let query = supabase
    .from('moment_solidaire')
    .select(
      'id, slug, titre, type, sous_type, lieu, commence_le, termine_le, statut, createurice_id, created_at',
    )
    .order('commence_le', { ascending: false })
    .limit(options.limite ?? 100);

  if (options.statut !== undefined && options.statut !== 'tous') {
    query = query.eq('statut', options.statut);
  }

  if (options.type !== undefined && options.type.trim() !== '') {
    query = query.eq('type', options.type.trim());
  }

  if (options.motCle !== undefined && options.motCle.trim() !== '') {
    const motif = `%${options.motCle.trim()}%`;
    query = query.or(`titre.ilike.${motif},lieu.ilike.${motif}`);
  }

  const { data } = await query;
  return (data ?? []).map((m) => ({
    id: m.id,
    slug: m.slug,
    titre: m.titre,
    type: m.type,
    sousType: m.sous_type,
    lieu: m.lieu,
    commenceLe: m.commence_le,
    termineLe: m.termine_le,
    statut: m.statut,
    createurice_id: m.createurice_id,
    createdAt: m.created_at,
  }));
}
