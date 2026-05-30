/**
 * Couche de requêtes des organisations (épopée réseau V2, chantier B.1).
 *
 * Lecture seule, côté serveur. La RLS de `organisation` filtre déjà les pages
 * suspendues (seuls l'admin et le·la créateur·ice les voient).
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { TypeOrganisation } from './validation';

/** Organisation telle qu'affichée sur sa page / dans la liste. */
export interface OrganisationAffichee {
  id: string;
  slug: string;
  nom: string;
  typeOrganisation: TypeOrganisation;
  description: string | null;
  imageUrl: string | null;
  badgeOfficiel: boolean;
  statut: string;
  creePar: string | null;
}

function versAffichee(r: {
  id: string;
  slug: string;
  nom: string;
  type_organisation: string;
  description: string | null;
  image_url: string | null;
  badge_officiel: boolean;
  statut: string;
  cree_par: string | null;
}): OrganisationAffichee {
  return {
    id: r.id,
    slug: r.slug,
    nom: r.nom,
    typeOrganisation: r.type_organisation as TypeOrganisation,
    description: r.description,
    imageUrl: r.image_url,
    badgeOfficiel: r.badge_officiel,
    statut: r.statut,
    creePar: r.cree_par,
  };
}

const COLONNES =
  'id, slug, nom, type_organisation, description, image_url, badge_officiel, statut, cree_par';

/** Récupère une organisation par son slug, ou null. */
export async function organisationParSlug(slug: string): Promise<OrganisationAffichee | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('organisation')
    .select(COLONNES)
    .eq('slug', slug)
    .maybeSingle();
  return data === null ? null : versAffichee(data);
}

/**
 * Liste les organisations actives, badgées d'abord, puis par nom. Filtre
 * optionnel par texte (nom) et par type.
 */
export async function listerOrganisations(options?: {
  recherche?: string;
  type?: TypeOrganisation;
}): Promise<OrganisationAffichee[]> {
  const supabase = await getSupabaseServer();
  let requete = supabase
    .from('organisation')
    .select(COLONNES)
    .eq('statut', 'active')
    .order('badge_officiel', { ascending: false })
    .order('nom', { ascending: true });

  if (options?.recherche !== undefined && options.recherche.trim() !== '') {
    requete = requete.ilike('nom', `%${options.recherche.trim()}%`);
  }
  if (options?.type !== undefined) {
    requete = requete.eq('type_organisation', options.type);
  }

  const { data } = await requete;
  return (data ?? []).map(versAffichee);
}
