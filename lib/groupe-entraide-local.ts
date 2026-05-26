/**
 * Helpers pour `groupe_entraide_local` (cycle V2, fiche
 * `docs/cdc-v2/CDC-Maintenant-V2/03-Sentraider/groupe-entraide-local-V2.md`,
 * chantier V2.3.2).
 *
 * Sous-espace porte d'entrée NON-POLITIQUE : variante de l'espace
 * agrégateur avec un sous-ensemble d'outils activés (entraide, moments,
 * mobilisations, sans pétitions/Décider par défaut).
 */

import { getSupabaseServer } from '@/lib/supabase';

export type StatutGroupeEntraide = 'en_moderation' | 'publie' | 'suspendu' | 'ferme';
export type RoleGroupe = 'membre' | 'animateur';

export interface GroupeEntraideLocal {
  id: string;
  slug: string;
  nom: string;
  descriptionCourte: string;
  description: string;
  zoneGeographique: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  statut: StatutGroupeEntraide;
  createuriceId: string;
  outilPretActive: boolean;
  outilMarcheActive: boolean;
  outilSelActive: boolean;
  outilFruitsActive: boolean;
  outilHebergementActive: boolean;
  outilTransportActive: boolean;
  outilMomentsActive: boolean;
  outilMobilisationsActive: boolean;
  outilPetitionsActive: boolean;
  outilDeciderActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListerOptions {
  /** Filtre par statut. Par défaut, seuls les groupes publiés. */
  statut?: StatutGroupeEntraide | 'tous';
  limite?: number;
}

/** Liste les groupes (RLS filtre déjà aux publiés pour le public). */
export async function listerGroupesEntraide(
  options: ListerOptions = {},
): Promise<GroupeEntraideLocal[]> {
  const supabase = await getSupabaseServer();
  let requete = supabase.from('groupe_entraide_local').select('*');
  if (options.statut === undefined) {
    requete = requete.eq('statut', 'publie');
  } else if (options.statut !== 'tous') {
    requete = requete.eq('statut', options.statut);
  }
  const { data, error } = await requete
    .order('created_at', { ascending: false })
    .limit(options.limite ?? 50);
  if (error !== null || data === null) return [];
  return data.map(ligneEnGroupe);
}

export async function groupeEntraideParSlug(slug: string): Promise<GroupeEntraideLocal | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('groupe_entraide_local')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error !== null || data === null) return null;
  return ligneEnGroupe(data);
}

export interface MembreGroupe {
  appartenanceId: string;
  personneId: string;
  roleGroupe: RoleGroupe;
  rejointLe: string;
}

export async function listerMembresGroupe(groupeId: string): Promise<MembreGroupe[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('appartenance_groupe_entraide_local')
    .select('id, personne_id, role_groupe, rejoint_le')
    .eq('groupe_id', groupeId)
    .eq('est_active', true)
    .order('rejoint_le', { ascending: true });
  if (error !== null || data === null) return [];
  return data.map((l) => ({
    appartenanceId: l.id,
    personneId: l.personne_id,
    roleGroupe: l.role_groupe as RoleGroupe,
    rejointLe: l.rejoint_le,
  }));
}

export async function estMembreDuGroupe(groupeId: string, personneId: string): Promise<boolean> {
  const supabase = await getSupabaseServer();
  const { count, error } = await supabase
    .from('appartenance_groupe_entraide_local')
    .select('id', { count: 'exact', head: true })
    .eq('groupe_id', groupeId)
    .eq('personne_id', personneId)
    .eq('est_active', true);
  if (error !== null) return false;
  return (count ?? 0) > 0;
}

function ligneEnGroupe(ligne: {
  id: string;
  slug: string;
  nom: string;
  description_courte: string;
  description: string;
  zone_geographique: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  statut: string;
  createurice_id: string;
  outil_pret_active: boolean;
  outil_marche_active: boolean;
  outil_sel_active: boolean;
  outil_fruits_active: boolean;
  outil_hebergement_active: boolean;
  outil_transport_active: boolean;
  outil_moments_active: boolean;
  outil_mobilisations_active: boolean;
  outil_petitions_active: boolean;
  outil_decider_active: boolean;
  created_at: string;
  updated_at: string;
}): GroupeEntraideLocal {
  return {
    id: ligne.id,
    slug: ligne.slug,
    nom: ligne.nom,
    descriptionCourte: ligne.description_courte,
    description: ligne.description,
    zoneGeographique: ligne.zone_geographique,
    latitude: ligne.latitude,
    longitude: ligne.longitude,
    imageUrl: ligne.image_url,
    statut: ligne.statut as StatutGroupeEntraide,
    createuriceId: ligne.createurice_id,
    outilPretActive: ligne.outil_pret_active,
    outilMarcheActive: ligne.outil_marche_active,
    outilSelActive: ligne.outil_sel_active,
    outilFruitsActive: ligne.outil_fruits_active,
    outilHebergementActive: ligne.outil_hebergement_active,
    outilTransportActive: ligne.outil_transport_active,
    outilMomentsActive: ligne.outil_moments_active,
    outilMobilisationsActive: ligne.outil_mobilisations_active,
    outilPetitionsActive: ligne.outil_petitions_active,
    outilDeciderActive: ligne.outil_decider_active,
    createdAt: ligne.created_at,
    updatedAt: ligne.updated_at,
  };
}
