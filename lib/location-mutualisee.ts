/**
 * Helpers pour `location_mutualisee` et `engagement_location_mutualisee`
 * (cycle V2 §12, chantier V2.3.3).
 *
 * Mécanisme transversal : un organisateur engage la location d'un bien
 * collectif (bus/car/salle/lieu) ; les participants paient leur part ;
 * la collecte atteint le seuil → départ. EUROS UNIQUEMENT (§12). L'argent
 * va à l'organisateur, qui paie le prestataire (avec responsabilité de
 * tampon — avertissement juridique obligatoire à la création).
 */

import { getSupabaseServer } from '@/lib/supabase';

export type TypeLocation =
  | 'transport_bus'
  | 'transport_car'
  | 'transport_minibus'
  | 'hebergement_salle'
  | 'hebergement_lieu'
  | 'autre';

export type StatutLocation = 'collecte_en_cours' | 'validee' | 'annulee' | 'realisee';

export type StatutEngagement = 'engage' | 'paye' | 'annule';

export interface LocationMutualisee {
  id: string;
  slug: string;
  organisateurPersonneId: string;
  typeLocation: TypeLocation;
  titre: string;
  description: string;
  prestataire: string;
  lieu: string;
  dateEvenement: string;
  dateLimiteEngagement: string;
  montantTotalCentimes: number;
  nbPartsMax: number;
  prixParPartCentimes: number;
  statut: StatutLocation;
  imageUrl: string | null;
  avertissementJuridiqueAccepte: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementLocation {
  id: string;
  locationId: string;
  participantPersonneId: string;
  nbParts: number;
  montantEngageCentimes: number;
  statut: StatutEngagement;
  stripePaymentIntentId: string | null;
  engageLe: string;
  payeLe: string | null;
  annuleLe: string | null;
}

export async function listerLocationsMutualisees(
  options: {
    statut?: StatutLocation | 'tous';
    limite?: number;
  } = {},
): Promise<LocationMutualisee[]> {
  const supabase = await getSupabaseServer();
  let requete = supabase.from('location_mutualisee').select('*');
  if (options.statut === undefined) {
    requete = requete.in('statut', ['collecte_en_cours', 'validee']);
  } else if (options.statut !== 'tous') {
    requete = requete.eq('statut', options.statut);
  }
  const { data, error } = await requete
    .order('date_evenement', { ascending: true })
    .limit(options.limite ?? 50);
  if (error !== null || data === null) return [];
  return data.map(ligneEnLocation);
}

export async function locationMutualiseeParSlug(slug: string): Promise<LocationMutualisee | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('location_mutualisee')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error !== null || data === null) return null;
  return ligneEnLocation(data);
}

/**
 * Compteur des parts engagées (statuts engage + paye, hors annule) sur
 * une location donnée. Utile pour la jauge de collecte côté UI.
 */
export async function compterPartsEngagees(locationId: string): Promise<number> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('engagement_location_mutualisee')
    .select('nb_parts')
    .eq('location_id', locationId)
    .in('statut', ['engage', 'paye']);
  if (error !== null || data === null) return 0;
  return data.reduce((somme, ligne) => somme + (ligne.nb_parts ?? 0), 0);
}

export async function listerEngagementsLocation(locationId: string): Promise<EngagementLocation[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('engagement_location_mutualisee')
    .select('*')
    .eq('location_id', locationId)
    .neq('statut', 'annule')
    .order('engage_le', { ascending: true });
  if (error !== null || data === null) return [];
  return data.map(ligneEnEngagement);
}

export async function engagementActifDuParticipant(
  locationId: string,
  participantId: string,
): Promise<EngagementLocation | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('engagement_location_mutualisee')
    .select('*')
    .eq('location_id', locationId)
    .eq('participant_personne_id', participantId)
    .neq('statut', 'annule')
    .maybeSingle();
  if (error !== null || data === null) return null;
  return ligneEnEngagement(data);
}

function ligneEnLocation(ligne: {
  id: string;
  slug: string;
  organisateur_personne_id: string;
  type_location: string;
  titre: string;
  description: string;
  prestataire: string;
  lieu: string;
  date_evenement: string;
  date_limite_engagement: string;
  montant_total_centimes: number;
  nb_parts_max: number;
  prix_par_part_centimes: number;
  statut: string;
  image_url: string | null;
  avertissement_juridique_accepte: boolean;
  created_at: string;
  updated_at: string;
}): LocationMutualisee {
  return {
    id: ligne.id,
    slug: ligne.slug,
    organisateurPersonneId: ligne.organisateur_personne_id,
    typeLocation: ligne.type_location as TypeLocation,
    titre: ligne.titre,
    description: ligne.description,
    prestataire: ligne.prestataire,
    lieu: ligne.lieu,
    dateEvenement: ligne.date_evenement,
    dateLimiteEngagement: ligne.date_limite_engagement,
    montantTotalCentimes: ligne.montant_total_centimes,
    nbPartsMax: ligne.nb_parts_max,
    prixParPartCentimes: ligne.prix_par_part_centimes,
    statut: ligne.statut as StatutLocation,
    imageUrl: ligne.image_url,
    avertissementJuridiqueAccepte: ligne.avertissement_juridique_accepte,
    createdAt: ligne.created_at,
    updatedAt: ligne.updated_at,
  };
}

function ligneEnEngagement(ligne: {
  id: string;
  location_id: string;
  participant_personne_id: string;
  nb_parts: number;
  montant_engage_centimes: number;
  statut: string;
  stripe_payment_intent_id: string | null;
  engage_le: string;
  paye_le: string | null;
  annule_le: string | null;
}): EngagementLocation {
  return {
    id: ligne.id,
    locationId: ligne.location_id,
    participantPersonneId: ligne.participant_personne_id,
    nbParts: ligne.nb_parts,
    montantEngageCentimes: ligne.montant_engage_centimes,
    statut: ligne.statut as StatutEngagement,
    stripePaymentIntentId: ligne.stripe_payment_intent_id,
    engageLe: ligne.engage_le,
    payeLe: ligne.paye_le,
    annuleLe: ligne.annule_le,
  };
}
