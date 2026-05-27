import { getSupabaseServer } from '@/lib/supabase';

export interface LignePersonneAdmin {
  id: string;
  email: string | null;
  prenom: string | null;
  nom: string | null;
  statut: string;
  emailVerifie: boolean;
  derniereConnexionLe: string | null;
  createdAt: string;
  anonymiseLe: string | null;
  suppressionDemandeeLe: string | null;
}

export interface OptionsListePersonnes {
  motCle?: string;
  statut?: 'tous' | 'actif' | 'anonymise' | 'suppression_demandee';
  limite?: number;
  /** Offset 0-indexé (pour pagination). Par défaut 0. */
  debutIdx?: number;
}

export interface ResultatListePersonnes {
  lignes: LignePersonneAdmin[];
  total: number;
}

/**
 * Liste les personnes pour la console admin (V2.4.29).
 *
 * RLS Supabase doit autoriser la lecture de la table personne aux
 * admins (déjà acquis par les policies V1). Limite 100 lignes par page
 * pour ne pas surcharger.
 *
 * Filtres :
 * - motCle : ilike sur email / prenom / nom (OR via filtre chainé)
 * - statut : 'tous' | 'actif' (anonymise=null) | 'anonymise' | 'suppression_demandee'
 */
export async function listerPersonnesAdmin(
  options: OptionsListePersonnes = {},
): Promise<LignePersonneAdmin[]> {
  const r = await listerPersonnesAdminPagine(options);
  return r.lignes;
}

/**
 * Variante paginée : retourne aussi le total exact (pour Pagination UI).
 */
export async function listerPersonnesAdminPagine(
  options: OptionsListePersonnes = {},
): Promise<ResultatListePersonnes> {
  const supabase = await getSupabaseServer();
  const debut = options.debutIdx ?? 0;
  const taille = options.limite ?? 100;
  let query = supabase
    .from('personne')
    .select(
      'id, email, prenom, nom, statut, email_verifie, derniere_connexion_le, created_at, anonymise_le, suppression_demandee_le',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(debut, debut + taille - 1);

  if (options.statut === 'actif') {
    query = query.is('anonymise_le', null).is('suppression_demandee_le', null);
  } else if (options.statut === 'anonymise') {
    query = query.not('anonymise_le', 'is', null);
  } else if (options.statut === 'suppression_demandee') {
    query = query.not('suppression_demandee_le', 'is', null);
  }

  if (options.motCle !== undefined && options.motCle.trim() !== '') {
    const motif = `%${options.motCle.trim()}%`;
    query = query.or(`email.ilike.${motif},prenom.ilike.${motif},nom.ilike.${motif}`);
  }

  const { data, count } = await query;
  const lignes = (data ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    prenom: p.prenom,
    nom: p.nom,
    statut: p.statut,
    emailVerifie: p.email_verifie,
    derniereConnexionLe: p.derniere_connexion_le,
    createdAt: p.created_at,
    anonymiseLe: p.anonymise_le,
    suppressionDemandeeLe: p.suppression_demandee_le,
  }));
  return { lignes, total: count ?? 0 };
}
