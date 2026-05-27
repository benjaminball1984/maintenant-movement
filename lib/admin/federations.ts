import { getSupabaseServer } from '@/lib/supabase';

export interface LigneFederationAdmin {
  id: string;
  slug: string;
  nom: string;
  type: string;
  descriptionCourte: string | null;
  nbCommunes: number;
  createdAt: string;
}

export interface OptionsListeFederations {
  motCle?: string;
  type?: 'tous' | 'geographique' | 'thematique' | 'mixte';
  limite?: number;
}

/**
 * Liste les fédérations pour la console admin (V2.4.35).
 *
 * Filtres :
 * - motCle : ilike sur nom
 * - type : 'tous' | 'geographique' | 'thematique' | 'mixte'
 *
 * Le compteur de communes rattachées est récupéré en une requête
 * agrégée séparée (count groupé par federation_id), pour ne pas
 * faire N+1.
 */
export async function listerFederationsAdmin(
  options: OptionsListeFederations = {},
): Promise<LigneFederationAdmin[]> {
  const supabase = await getSupabaseServer();
  let query = supabase
    .from('federation')
    .select('id, slug, nom, type, description_courte, created_at')
    .order('nom', { ascending: true })
    .limit(options.limite ?? 100);

  if (options.type !== undefined && options.type !== 'tous') {
    query = query.eq('type', options.type);
  }

  if (options.motCle !== undefined && options.motCle.trim() !== '') {
    query = query.ilike('nom', `%${options.motCle.trim()}%`);
  }

  const { data: federations } = await query;
  if (federations === null) return [];

  // Compteur de communes : on lit toutes les appartenances pour les
  // fédérations chargées (1 requête, regroupée en mémoire).
  const ids = federations.map((f) => f.id);
  const { data: appartenances } = await supabase
    .from('appartenance_federation')
    .select('federation_id')
    .in('federation_id', ids);

  const nbParFederation = new Map<string, number>();
  for (const a of appartenances ?? []) {
    nbParFederation.set(a.federation_id, (nbParFederation.get(a.federation_id) ?? 0) + 1);
  }

  return federations.map((f) => ({
    id: f.id,
    slug: f.slug,
    nom: f.nom,
    type: f.type,
    descriptionCourte: f.description_courte,
    nbCommunes: nbParFederation.get(f.id) ?? 0,
    createdAt: f.created_at,
  }));
}
