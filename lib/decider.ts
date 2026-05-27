/**
 * Helpers Décider (V2.4.10).
 *
 * Cf. spec V1 §4F. 3 modes de décision :
 * - `consensus` : accord plein de toutes les personnes présentes.
 * - `levee_objections` : décision validée si aucune objection bloquante.
 * - `jugement_majoritaire` : Balinski-Laraki, 7 mentions, médiane retenue.
 */

import { getSupabaseServer } from '@/lib/supabase';

export type EspaceSalle =
  | 'commune'
  | 'federation'
  | 'confederation'
  | 'gt_thematique'
  | 'campagne'
  | 'groupe_entraide_local'
  | 'national';

export type ModeDecision = 'consensus' | 'levee_objections' | 'jugement_majoritaire';

export type StatutReunion = 'planifiee' | 'en_cours' | 'terminee' | 'annulee';

export const MENTIONS_JUGEMENT_MAJORITAIRE = [
  'Excellent',
  'Très bien',
  'Bien',
  'Assez bien',
  'Passable',
  'Insuffisant',
  'À rejeter',
] as const;

export type MentionJugement = (typeof MENTIONS_JUGEMENT_MAJORITAIRE)[number];

export interface SalleDecider {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
  espaceType: EspaceSalle;
  espaceId: string | null;
  typeVisibilite: 'membres' | 'fedeere' | 'public';
  livekitRoomName: string | null;
  createdAt: string;
}

export interface ReunionDecider {
  id: string;
  salleId: string;
  titre: string;
  ordreJourMd: string;
  debutLe: string;
  finLe: string | null;
  modeDecision: ModeDecision;
  statut: StatutReunion;
  enregistree: boolean;
  pvMd: string | null;
}

export async function listerSallesDecider(): Promise<SalleDecider[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('salle_decider')
    .select('*')
    .order('nom', { ascending: true });
  return (data ?? []).map((s) => ({
    id: s.id,
    slug: s.slug,
    nom: s.nom,
    description: s.description,
    espaceType: s.espace_type as EspaceSalle,
    espaceId: s.espace_id,
    typeVisibilite: s.type_visibilite as 'membres' | 'fedeere' | 'public',
    livekitRoomName: s.livekit_room_name,
    createdAt: s.created_at,
  }));
}

export async function chargerSalleParSlug(slug: string): Promise<SalleDecider | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('salle_decider').select('*').eq('slug', slug).maybeSingle();
  if (data === null) return null;
  return {
    id: data.id,
    slug: data.slug,
    nom: data.nom,
    description: data.description,
    espaceType: data.espace_type as EspaceSalle,
    espaceId: data.espace_id,
    typeVisibilite: data.type_visibilite as 'membres' | 'fedeere' | 'public',
    livekitRoomName: data.livekit_room_name,
    createdAt: data.created_at,
  };
}

export async function listerReunionsSalle(
  salleId: string,
  options: { aVenir?: boolean; limite?: number } = {},
): Promise<ReunionDecider[]> {
  const supabase = await getSupabaseServer();
  let query = supabase.from('reunion_decider').select('*').eq('salle_id', salleId);
  if (options.aVenir === true) {
    query = query
      .in('statut', ['planifiee', 'en_cours'])
      .gte('debut_le', new Date().toISOString())
      .order('debut_le', { ascending: true });
  } else {
    query = query.order('debut_le', { ascending: false });
  }
  query = query.limit(options.limite ?? 50);
  const { data } = await query;
  return (data ?? []).map((r) => ({
    id: r.id,
    salleId: r.salle_id,
    titre: r.titre,
    ordreJourMd: r.ordre_jour_md,
    debutLe: r.debut_le,
    finLe: r.fin_le,
    modeDecision: r.mode_decision as ModeDecision,
    statut: r.statut as StatutReunion,
    enregistree: r.enregistree,
    pvMd: r.pv_md,
  }));
}

export interface ReunionAvecSalle extends ReunionDecider {
  salleSlug: string;
  salleNom: string;
}

/**
 * Liste les prochaines réunions toutes salles confondues (V2.4.20).
 * Pour la home Décider.
 */
export async function listerProchainesReunionsToutesSalles(
  limite = 20,
): Promise<ReunionAvecSalle[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('reunion_decider')
    .select('*, salle:salle_decider(id, slug, nom)')
    .in('statut', ['planifiee', 'en_cours'])
    .gte('debut_le', new Date().toISOString())
    .order('debut_le', { ascending: true })
    .limit(limite);
  return (data ?? []).map((r) => {
    // biome-ignore lint/suspicious/noExplicitAny: jointure non typée précisément
    const salle = (r as any).salle as { slug: string; nom: string } | null;
    return {
      id: r.id,
      salleId: r.salle_id,
      titre: r.titre,
      ordreJourMd: r.ordre_jour_md,
      debutLe: r.debut_le,
      finLe: r.fin_le,
      modeDecision: r.mode_decision as ModeDecision,
      statut: r.statut as StatutReunion,
      enregistree: r.enregistree,
      pvMd: r.pv_md,
      salleSlug: salle?.slug ?? '',
      salleNom: salle?.nom ?? '',
    };
  });
}

/**
 * Liste les dernières réunions terminées avec PV publié (V2.4.21).
 * Sert à afficher les « Décisions récentes » sur la home Décider.
 */
export async function listerDernieresReunionsAvecPV(limite = 6): Promise<ReunionAvecSalle[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('reunion_decider')
    .select('*, salle:salle_decider(id, slug, nom)')
    .eq('statut', 'terminee')
    .not('pv_md', 'is', null)
    .neq('pv_md', '')
    .order('debut_le', { ascending: false })
    .limit(limite);
  return (data ?? []).map((r) => {
    // biome-ignore lint/suspicious/noExplicitAny: jointure non typée précisément
    const salle = (r as any).salle as { slug: string; nom: string } | null;
    return {
      id: r.id,
      salleId: r.salle_id,
      titre: r.titre,
      ordreJourMd: r.ordre_jour_md,
      debutLe: r.debut_le,
      finLe: r.fin_le,
      modeDecision: r.mode_decision as ModeDecision,
      statut: r.statut as StatutReunion,
      enregistree: r.enregistree,
      pvMd: r.pv_md,
      salleSlug: salle?.slug ?? '',
      salleNom: salle?.nom ?? '',
    };
  });
}

export async function chargerReunionParId(id: string): Promise<ReunionDecider | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('reunion_decider').select('*').eq('id', id).maybeSingle();
  if (data === null) return null;
  return {
    id: data.id,
    salleId: data.salle_id,
    titre: data.titre,
    ordreJourMd: data.ordre_jour_md,
    debutLe: data.debut_le,
    finLe: data.fin_le,
    modeDecision: data.mode_decision as ModeDecision,
    statut: data.statut as StatutReunion,
    enregistree: data.enregistree,
    pvMd: data.pv_md,
  };
}

export const LIBELLE_MODE: Record<ModeDecision, string> = {
  consensus: 'Consensus',
  levee_objections: 'Levée d’objections',
  jugement_majoritaire: 'Jugement majoritaire',
};

export const LIBELLE_STATUT: Record<StatutReunion, string> = {
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};
