import { getSupabaseServer } from '@/lib/supabase';

export interface LigneCommuneAdmin {
  id: string;
  slug: string;
  nom: string;
  codeInsee: string | null;
  codePostalPrincipal: string | null;
  departement: string | null;
  region: string | null;
  statutCreation: string;
  createdAt: string;
}

export interface OptionsListeCommunes {
  motCle?: string;
  statut?: 'tous' | 'libre' | 'pre_creee';
  departement?: string;
  limite?: number;
  /** Offset 0-indexé (pour pagination). Par défaut 0. */
  debutIdx?: number;
}

export interface ResultatListeCommunes {
  lignes: LigneCommuneAdmin[];
  total: number;
}

/**
 * Liste les communes pour la console admin (V2.4.33).
 *
 * Filtres :
 * - motCle : ilike sur nom / code_insee / code_postal_principal
 * - statut : 'tous' | 'libre' (statut_creation != 'pre_creee') | 'pre_creee'
 * - departement : eq sur le code département
 *
 * Limite 100 par défaut.
 */
export async function listerCommunesAdmin(
  options: OptionsListeCommunes = {},
): Promise<LigneCommuneAdmin[]> {
  const r = await listerCommunesAdminPagine(options);
  return r.lignes;
}

/**
 * Variante paginée : retourne aussi le total exact (pour Pagination UI).
 */
export async function listerCommunesAdminPagine(
  options: OptionsListeCommunes = {},
): Promise<ResultatListeCommunes> {
  const supabase = await getSupabaseServer();
  const debut = options.debutIdx ?? 0;
  const taille = options.limite ?? 100;
  let query = supabase
    .from('commune')
    .select(
      'id, slug, nom, code_insee, code_postal_principal, departement, region, statut_creation, created_at',
      { count: 'exact' },
    )
    .order('nom', { ascending: true })
    .range(debut, debut + taille - 1);

  if (options.statut === 'libre') {
    query = query.neq('statut_creation', 'pre_creee');
  } else if (options.statut === 'pre_creee') {
    query = query.eq('statut_creation', 'pre_creee');
  }

  if (options.departement !== undefined && options.departement.trim() !== '') {
    query = query.eq('departement', options.departement.trim());
  }

  if (options.motCle !== undefined && options.motCle.trim() !== '') {
    const motif = `%${options.motCle.trim()}%`;
    query = query.or(
      `nom.ilike.${motif},code_insee.ilike.${motif},code_postal_principal.ilike.${motif}`,
    );
  }

  const { data, count } = await query;
  const lignes = (data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    nom: c.nom,
    codeInsee: c.code_insee,
    codePostalPrincipal: c.code_postal_principal,
    departement: c.departement,
    region: c.region,
    statutCreation: c.statut_creation,
    createdAt: c.created_at,
  }));
  return { lignes, total: count ?? 0 };
}

export async function compterCommunes(): Promise<{
  total: number;
  libres: number;
  preCreees: number;
}> {
  const supabase = await getSupabaseServer();
  const [totalRes, libresRes] = await Promise.all([
    supabase.from('commune').select('id', { count: 'exact', head: true }),
    supabase
      .from('commune')
      .select('id', { count: 'exact', head: true })
      .neq('statut_creation', 'pre_creee'),
  ]);
  const total = totalRes.count ?? 0;
  const libres = libresRes.count ?? 0;
  return { total, libres, preCreees: total - libres };
}
