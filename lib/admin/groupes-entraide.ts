import { getSupabaseServer } from '@/lib/supabase';

export interface LigneGroupeEntraideAdmin {
  id: string;
  slug: string;
  nom: string;
  zoneGeographique: string;
  descriptionCourte: string;
  statut: string;
  outilPretActive: boolean;
  outilMarcheActive: boolean;
  outilSelActive: boolean;
  createurice_id: string;
  createdAt: string;
}

export interface OptionsListeGroupesEntraide {
  motCle?: string;
  statut?: 'tous' | 'publie' | 'en_moderation' | 'retire';
  limite?: number;
}

/**
 * Liste les groupes d'entraide pour la console admin (V2.4.45).
 *
 * Filtres :
 * - motCle : ilike sur nom / zone_geographique
 * - statut : 'tous' | 'publie' | 'en_moderation' | 'retire'
 *
 * Limite 100 par défaut.
 */
export async function listerGroupesEntraideAdmin(
  options: OptionsListeGroupesEntraide = {},
): Promise<LigneGroupeEntraideAdmin[]> {
  const supabase = await getSupabaseServer();
  let query = supabase
    .from('groupe_entraide_local')
    .select(
      'id, slug, nom, zone_geographique, description_courte, statut, outil_pret_active, outil_marche_active, outil_sel_active, createurice_id, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(options.limite ?? 100);

  if (options.statut !== undefined && options.statut !== 'tous') {
    query = query.eq('statut', options.statut);
  }

  if (options.motCle !== undefined && options.motCle.trim() !== '') {
    const motif = `%${options.motCle.trim()}%`;
    query = query.or(`nom.ilike.${motif},zone_geographique.ilike.${motif}`);
  }

  const { data } = await query;
  return (data ?? []).map((g) => ({
    id: g.id,
    slug: g.slug,
    nom: g.nom,
    zoneGeographique: g.zone_geographique,
    descriptionCourte: g.description_courte,
    statut: g.statut,
    outilPretActive: g.outil_pret_active,
    outilMarcheActive: g.outil_marche_active,
    outilSelActive: g.outil_sel_active,
    createurice_id: g.createurice_id,
    createdAt: g.created_at,
  }));
}
