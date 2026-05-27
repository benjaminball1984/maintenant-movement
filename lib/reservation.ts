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
  /**
   * Identifiant de la personne à l'origine du changement, journalisé
   * dans `reservation_journal` (V2.3.15, doctrine D8bis). Optionnel
   * pour rester rétro-compatible avec les transitions système (cron,
   * expiration automatique). Quand non fourni, le journal enregistre
   * `auteur_id = null`.
   */
  auteurId?: string;
}

/**
 * Change le statut d'une réservation. Les transitions autorisées sont
 * vérifiées côté applicatif (Server Action), pas dans cette fonction
 * qui se contente d'écrire. Helper `transitionAutorisee` exposé ci-dessous.
 *
 * Journalise la transition dans `reservation_journal` (V2.3.15) après le
 * UPDATE réussi : fire-and-forget, l'échec du journal n'invalide pas la
 * transition (le journal est une annexe de transparence, pas une source
 * de vérité).
 */
export async function changerStatutReservation(
  options: ChangerStatutOptions,
): Promise<ResultatReservation> {
  const supabase = await getSupabaseServer();

  // Statut avant pour le journal. Tolère l'absence (cas dégradé : on
  // journalise null → cible).
  const { data: avant } = await supabase
    .from('reservation')
    .select('statut')
    .eq('id', options.reservationId)
    .maybeSingle();
  const statutAvant = (avant?.statut ?? null) as StatutReservation | null;

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

  // Journal (V2.3.15) : seulement si la transition est effective.
  if (statutAvant !== null && statutAvant !== options.nouveauStatut) {
    await journaliserTransition({
      reservationId: options.reservationId,
      statutAvant,
      statutApres: options.nouveauStatut,
      motif: options.motif,
      auteurId: options.auteurId,
    });
  }

  return { ok: true, reservation: ligneEnReservation(data) };
}

/**
 * Insère une ligne dans `reservation_journal` (V2.3.15). Fire-and-forget :
 * tout échec d'insertion est loggé mais n'invalide pas la transition de
 * la réservation. Utilise le client serveur courant (service_role
 * contourne la policy `insert_blocked`).
 */
async function journaliserTransition(options: {
  reservationId: string;
  statutAvant: StatutReservation;
  statutApres: StatutReservation;
  motif?: string;
  auteurId?: string;
}): Promise<void> {
  try {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.from('reservation_journal').insert({
      reservation_id: options.reservationId,
      statut_avant: options.statutAvant,
      statut_apres: options.statutApres,
      motif: options.motif?.trim() !== '' ? (options.motif ?? null) : null,
      auteur_id: options.auteurId ?? null,
    });
    if (error !== null) {
      console.warn('[reservation_journal] insert échoué :', error.message);
    }
  } catch (erreur) {
    console.warn('[reservation_journal] exception :', erreur);
  }
}

export interface EntreeJournalReservation {
  id: string;
  reservationId: string;
  statutAvant: StatutReservation;
  statutApres: StatutReservation;
  motif: string | null;
  auteurId: string | null;
  changedAt: string;
}

/**
 * Lit le journal d'une réservation, trié par date croissante (de l'amorce
 * vers le présent). La RLS filtre côté lecture : demandeur + admins
 * autorisés. Le côté propriétaire d'offre passe par une Server Action
 * dédiée qui vérifie la propriété AVANT d'appeler ce helper.
 */
export async function listerJournalReservation(
  reservationId: string,
): Promise<EntreeJournalReservation[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('reservation_journal')
    .select('*')
    .eq('reservation_id', reservationId)
    .order('changed_at', { ascending: true });
  if (error !== null || data === null) return [];
  return data.map((l) => ({
    id: l.id,
    reservationId: l.reservation_id,
    statutAvant: l.statut_avant as StatutReservation,
    statutApres: l.statut_apres as StatutReservation,
    motif: l.motif,
    auteurId: l.auteur_id,
    changedAt: l.changed_at,
  }));
}

/**
 * Variante batch de `listerJournalReservation` : retourne un Map
 * `reservation_id → entrées triées`. Utile pour afficher l'historique
 * sur une liste de réservations sans faire N+1 requêtes.
 */
export async function listerJournauxReservations(
  reservationIds: string[],
): Promise<Map<string, EntreeJournalReservation[]>> {
  const resultat = new Map<string, EntreeJournalReservation[]>();
  if (reservationIds.length === 0) return resultat;
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('reservation_journal')
    .select('*')
    .in('reservation_id', reservationIds)
    .order('changed_at', { ascending: true });
  if (error !== null || data === null) return resultat;
  for (const l of data) {
    const entree: EntreeJournalReservation = {
      id: l.id,
      reservationId: l.reservation_id,
      statutAvant: l.statut_avant as StatutReservation,
      statutApres: l.statut_apres as StatutReservation,
      motif: l.motif,
      auteurId: l.auteur_id,
      changedAt: l.changed_at,
    };
    const liste = resultat.get(entree.reservationId);
    if (liste === undefined) resultat.set(entree.reservationId, [entree]);
    else liste.push(entree);
  }
  return resultat;
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

/**
 * Liste les réservations en statut `litige` pour la modération admin
 * (cycle V2 V2.3.17). RLS : seuls admins / modérateurs autres-moyens
 * lisent toutes les réservations ; pour les autres, retour vide.
 */
export async function listerReservationsEnLitige(): Promise<Reservation[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('reservation')
    .select('*')
    .eq('statut', 'litige')
    .order('updated_at', { ascending: true });
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
