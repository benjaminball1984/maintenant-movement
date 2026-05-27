/**
 * Helpers pour la table `reservation` V2 (cycle V2 D8, chantier V2.2.2).
 *
 * Composant transversal réutilisable (façon Airbnb/BlaBlaCar). Les flux
 * applicatifs qui acceptent une réservation (transport covoit', hébergement,
 * prêt, SEL, location mutualisée) appellent ces helpers via leur propre
 * Server Action, après vérification que l'offre existe et que l'appelant
 * n'est pas le propriétaire de l'offre.
 *
 * Cf. migration `supabase/migrations/20260527040000_reservation.sql` pour
 * le schéma, les contraintes CHECK et les policies RLS.
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { OffreTypeReservation } from './reservation-amorce';

export type { OffreTypeReservation } from './reservation-amorce';

/**
 * Machine à états de la réservation (cf. D8 V2).
 */
export type StatutReservation =
  | 'proposee'
  | 'acceptee'
  | 'refusee'
  | 'realisee'
  | 'confirmee'
  | 'annulee'
  | 'litige';

export interface Reservation {
  id: string;
  offreType: OffreTypeReservation;
  offreId: string;
  demandeurPersonneId: string;
  creneauDebut: string;
  creneauFin: string | null;
  quantite: number;
  messageAmorce: string;
  statut: StatutReservation;
  motifDecision: string | null;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreerReservationOptions {
  offreType: OffreTypeReservation;
  offreId: string;
  demandeurPersonneId: string;
  creneauDebut: Date;
  creneauFin?: Date;
  quantite?: number;
  messageAmorce: string;
}

export type ResultatReservation =
  | { ok: true; reservation: Reservation }
  | { ok: false; message: string };

export async function creerReservation(
  options: CreerReservationOptions,
): Promise<ResultatReservation> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('reservation')
    .insert({
      offre_type: options.offreType,
      offre_id: options.offreId,
      demandeur_personne_id: options.demandeurPersonneId,
      creneau_debut: options.creneauDebut.toISOString(),
      creneau_fin: options.creneauFin?.toISOString() ?? null,
      quantite: options.quantite ?? 1,
      message_amorce: options.messageAmorce,
    })
    .select('*')
    .single();

  if (error !== null || data === null) {
    return { ok: false, message: error?.message ?? 'Création impossible.' };
  }

  return { ok: true, reservation: ligneEnReservation(data) };
}

export interface ChangerStatutOptions {
  reservationId: string;
  nouveauStatut: StatutReservation;
  motif?: string;
}

/**
 * Change le statut d'une réservation. Les transitions autorisées sont
 * vérifiées côté applicatif (Server Action), pas dans cette fonction
 * qui se contente d'écrire. Helper `transitionAutorisee` exposé ci-dessous.
 */
export async function changerStatutReservation(
  options: ChangerStatutOptions,
): Promise<ResultatReservation> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('reservation')
    .update({
      statut: options.nouveauStatut,
      motif_decision: options.motif ?? null,
    })
    .eq('id', options.reservationId)
    .select('*')
    .single();

  if (error !== null || data === null) {
    return { ok: false, message: error?.message ?? 'Mise à jour impossible.' };
  }
  return { ok: true, reservation: ligneEnReservation(data) };
}

/**
 * Indique si une transition d'état est autorisée selon la machine à états
 * D8 V2. À appeler côté Server Action AVANT `changerStatutReservation`.
 *
 *   proposee  → acceptee / refusee / annulee
 *   acceptee  → realisee / annulee / litige
 *   realisee  → confirmee / litige
 *   refusee, annulee, confirmee, litige : terminaux
 */
export function transitionAutorisee(actuel: StatutReservation, cible: StatutReservation): boolean {
  const TRANSITIONS: Record<StatutReservation, readonly StatutReservation[]> = {
    proposee: ['acceptee', 'refusee', 'annulee'],
    acceptee: ['realisee', 'annulee', 'litige'],
    realisee: ['confirmee', 'litige'],
    refusee: [],
    annulee: [],
    confirmee: [],
    litige: [],
  };
  return TRANSITIONS[actuel].includes(cible);
}

export async function listerReservationsParOffre(
  offreType: OffreTypeReservation,
  offreId: string,
): Promise<Reservation[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('reservation')
    .select('*')
    .eq('offre_type', offreType)
    .eq('offre_id', offreId)
    .order('created_at', { ascending: false });

  if (error !== null || data === null) return [];
  return data.map(ligneEnReservation);
}

export async function listerReservationsDuDemandeur(
  demandeurPersonneId: string,
): Promise<Reservation[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('reservation')
    .select('*')
    .eq('demandeur_personne_id', demandeurPersonneId)
    .order('created_at', { ascending: false });

  if (error !== null || data === null) return [];
  return data.map(ligneEnReservation);
}

/**
 * Liste les réservations REÇUES sur les offres dont la personne est
 * créatrice (cycle V2 V2.3.13). FK polymorphe gérée applicativement :
 * on charge en parallèle les ids des offres possédées (3 requêtes),
 * puis les `reservation` correspondantes (jusqu'à 3 requêtes), et on
 * concatène côté TS avec un tri décroissant par date.
 */
export async function listerReservationsRecuesParProprietaire(
  proprietairePersonneId: string,
): Promise<Reservation[]> {
  const supabase = await getSupabaseServer();

  const [offresEntraide, servicesSel, locationsMutu] = await Promise.all([
    supabase.from('offre_entraide').select('id').eq('createurice_id', proprietairePersonneId),
    supabase.from('service_sel').select('id').eq('createurice_id', proprietairePersonneId),
    supabase
      .from('location_mutualisee')
      .select('id')
      .eq('organisateur_personne_id', proprietairePersonneId),
  ]);

  const idsEntraide = (offresEntraide.data ?? []).map((o) => o.id);
  const idsSel = (servicesSel.data ?? []).map((s) => s.id);
  const idsLoc = (locationsMutu.data ?? []).map((l) => l.id);

  if (idsEntraide.length === 0 && idsSel.length === 0 && idsLoc.length === 0) {
    return [];
  }

  const reservations: Reservation[] = [];
  if (idsEntraide.length > 0) {
    const { data } = await supabase
      .from('reservation')
      .select('*')
      .in('offre_type', ['transport_covoiturage', 'hebergement', 'pret'])
      .in('offre_id', idsEntraide);
    for (const l of data ?? []) reservations.push(ligneEnReservation(l));
  }
  if (idsSel.length > 0) {
    const { data } = await supabase
      .from('reservation')
      .select('*')
      .eq('offre_type', 'service_sel')
      .in('offre_id', idsSel);
    for (const l of data ?? []) reservations.push(ligneEnReservation(l));
  }
  if (idsLoc.length > 0) {
    const { data } = await supabase
      .from('reservation')
      .select('*')
      .eq('offre_type', 'location_mutualisee')
      .in('offre_id', idsLoc);
    for (const l of data ?? []) reservations.push(ligneEnReservation(l));
  }

  reservations.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return reservations;
}

function ligneEnReservation(ligne: {
  id: string;
  offre_type: string;
  offre_id: string;
  demandeur_personne_id: string;
  creneau_debut: string;
  creneau_fin: string | null;
  quantite: number;
  message_amorce: string;
  statut: string;
  motif_decision: string | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}): Reservation {
  return {
    id: ligne.id,
    offreType: ligne.offre_type as OffreTypeReservation,
    offreId: ligne.offre_id,
    demandeurPersonneId: ligne.demandeur_personne_id,
    creneauDebut: ligne.creneau_debut,
    creneauFin: ligne.creneau_fin,
    quantite: ligne.quantite,
    messageAmorce: ligne.message_amorce,
    statut: ligne.statut as StatutReservation,
    motifDecision: ligne.motif_decision,
    transactionId: ligne.transaction_id,
    createdAt: ligne.created_at,
    updatedAt: ligne.updated_at,
  };
}
