'use server';

import { getSession } from '@/lib/auth/session';
import {
  type OffreTypeReservation,
  changerStatutReservation,
  creerReservation,
  transitionAutorisee,
} from '@/lib/reservation';
import { genererMessageAmorce } from '@/lib/reservation-amorce';
import { getSupabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions de réservation (cycle V2 D8, chantier V2.3.5).
 *
 * Branche le composant transversal `Réservation` (V2.2.2) aux sous-espaces
 * existants : transport (covoiturage), hébergement, prêt, SEL,
 * location mutualisée.
 *
 * Vérifications côté serveur :
 * - Session active.
 * - L'offre existe et accepte les réservations.
 * - L'appelant n'est pas le créateur de l'offre (pas d'auto-réservation).
 * - Créneau cohérent (début dans le futur, fin ≥ début).
 *
 * Le helper `lib/reservation.ts:creerReservation` exécute l'insert ; la
 * RLS Supabase est la deuxième ligne de défense.
 */

export interface CreerReservationOptions {
  offreType: OffreTypeReservation;
  offreId: string;
  creneauDebut: string; // ISO string
  creneauFin?: string | null;
  quantite?: number;
  noteLibre?: string;
  /** Chemin à revalider (page de l'offre). */
  cheminRevalidation?: string;
}

export type ResultatReservation =
  | { ok: true; reservationId: string }
  | { ok: false; message: string };

export async function creerReservationAction(
  options: CreerReservationOptions,
): Promise<ResultatReservation> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise pour réserver.' };
  }

  // Cohérence du créneau (deuxième ligne après la validation client).
  const debut = new Date(options.creneauDebut);
  const fin = options.creneauFin ? new Date(options.creneauFin) : undefined;
  if (Number.isNaN(debut.getTime())) {
    return { ok: false, message: 'Date de début invalide.' };
  }
  if (fin !== undefined && (Number.isNaN(fin.getTime()) || fin < debut)) {
    return { ok: false, message: 'Date de fin invalide ou antérieure au début.' };
  }
  if (debut.getTime() < Date.now() - 60_000) {
    return { ok: false, message: 'Le créneau doit être dans le futur.' };
  }
  const quantite = options.quantite ?? 1;
  if (quantite < 1 || quantite > 100) {
    return { ok: false, message: 'La quantité doit être entre 1 et 100.' };
  }

  // Récupère le titre et le prénom pour le message d'amorce.
  const { titreOffre, createurId } = await chargerContexteOffre(options.offreType, options.offreId);

  if (titreOffre === null) {
    return { ok: false, message: 'Offre introuvable.' };
  }
  if (createurId === session.userId) {
    return { ok: false, message: 'Tu ne peux pas réserver ta propre offre.' };
  }

  const prenom = session.personne?.prenom ?? '';

  const messageAmorce = genererMessageAmorce({
    offreType: options.offreType,
    titreOffre,
    prenomDemandeur: prenom,
    creneauDebut: debut,
    creneauFin: fin,
    quantite,
    noteLibre: options.noteLibre,
  });

  const resultat = await creerReservation({
    offreType: options.offreType,
    offreId: options.offreId,
    demandeurPersonneId: session.userId,
    creneauDebut: debut,
    creneauFin: fin,
    quantite,
    messageAmorce,
  });

  if (!resultat.ok) {
    return { ok: false, message: resultat.message };
  }

  // V2.3.12 : envoyer aussi le message d'amorce dans la messagerie
  // interne (DM `message_reseau`). Tient la promesse UX faite à
  // l'utilisateur dans BoutonReserverOffre (« le message sera envoyé via
  // la messagerie interne »). En cas d'échec, on n'annule pas la
  // réservation (le message peut être renvoyé manuellement plus tard).
  if (createurId !== null) {
    await envoyerMessageAmorceInterne({
      expediteurId: session.userId,
      destinataireId: createurId,
      messageAmorce,
    });
  }

  if (options.cheminRevalidation !== undefined) {
    revalidatePath(options.cheminRevalidation);
  }
  return { ok: true, reservationId: resultat.reservation.id };
}

/**
 * Envoie un DM `message_reseau` (V1 chantier 7.5) avec le contenu du
 * message d'amorce. Fire-and-forget pour ne pas faire échouer la
 * réservation si l'envoi du message tombe (par exemple en mode dev sans
 * réseau social actif).
 */
async function envoyerMessageAmorceInterne(options: {
  expediteurId: string;
  destinataireId: string;
  messageAmorce: string;
}): Promise<void> {
  try {
    const supabase = await getSupabaseServer();
    await supabase.from('message_reseau').insert({
      expediteur_id: options.expediteurId,
      destinataire_id: options.destinataireId,
      texte: options.messageAmorce,
    });
  } catch (erreur) {
    // Silencieux : la réservation est créée, le message peut être
    // renvoyé manuellement par le demandeur depuis la messagerie.
    console.warn('[creerReservationAction] envoi message_reseau échoué :', erreur);
  }
}

/**
 * Charge le titre et l'id du créateur d'une offre selon son type.
 * FK polymorphe gérée applicativement (cf. doctrine V2.2.2 sur la
 * table `reservation`).
 */
async function chargerContexteOffre(
  offreType: OffreTypeReservation,
  offreId: string,
): Promise<{ titreOffre: string | null; createurId: string | null }> {
  const supabase = await getSupabaseServer();
  switch (offreType) {
    case 'transport_covoiturage':
    case 'hebergement':
    case 'pret': {
      const { data } = await supabase
        .from('offre_entraide')
        .select('titre, createurice_id')
        .eq('id', offreId)
        .maybeSingle();
      return {
        titreOffre: data?.titre ?? null,
        createurId: data?.createurice_id ?? null,
      };
    }
    case 'service_sel': {
      const { data } = await supabase
        .from('service_sel')
        .select('titre, createurice_id')
        .eq('id', offreId)
        .maybeSingle();
      return {
        titreOffre: data?.titre ?? null,
        createurId: data?.createurice_id ?? null,
      };
    }
    case 'location_mutualisee': {
      const { data } = await supabase
        .from('location_mutualisee')
        .select('titre, organisateur_personne_id')
        .eq('id', offreId)
        .maybeSingle();
      return {
        titreOffre: data?.titre ?? null,
        createurId: data?.organisateur_personne_id ?? null,
      };
    }
    default:
      return { titreOffre: null, createurId: null };
  }
}

// ============================================================
// Actions côté propriétaire d'offre (V2.3.13)
// ============================================================

export type ResultatActionProprietaire = { ok: true } | { ok: false; message: string };

/**
 * Helper interne : vérifie que la personne connectée est bien
 * propriétaire de l'offre référencée par la réservation. Retourne le
 * statut actuel pour la suite de la logique.
 */
async function chargerReservationCommeProprietaire(
  reservationId: string,
  sessionUserId: string,
): Promise<
  | {
      ok: true;
      statut: 'proposee' | 'acceptee' | 'refusee' | 'realisee' | 'confirmee' | 'annulee' | 'litige';
    }
  | { ok: false; message: string }
> {
  const supabase = await getSupabaseServer();
  const { data: reservation } = await supabase
    .from('reservation')
    .select('id, offre_type, offre_id, statut')
    .eq('id', reservationId)
    .maybeSingle();
  if (reservation === null) {
    return { ok: false, message: 'Réservation introuvable.' };
  }
  const { createurId } = await chargerContexteOffre(
    reservation.offre_type as OffreTypeReservation,
    reservation.offre_id,
  );
  if (createurId !== sessionUserId) {
    return { ok: false, message: 'Tu n’es pas propriétaire de cette offre.' };
  }
  return {
    ok: true,
    statut: reservation.statut as
      | 'proposee'
      | 'acceptee'
      | 'refusee'
      | 'realisee'
      | 'confirmee'
      | 'annulee'
      | 'litige',
  };
}

interface OptionsActionProprietaire {
  reservationId: string;
  motif?: string;
  cheminRevalidation?: string;
}

async function executerTransitionProprietaire(
  options: OptionsActionProprietaire,
  cible: 'acceptee' | 'refusee' | 'realisee',
): Promise<ResultatActionProprietaire> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }
  const verif = await chargerReservationCommeProprietaire(options.reservationId, session.userId);
  if (!verif.ok) return verif;
  if (!transitionAutorisee(verif.statut, cible)) {
    return {
      ok: false,
      message: `Transition « ${verif.statut} → ${cible} » non autorisée par la machine à états D8.`,
    };
  }
  const resultat = await changerStatutReservation({
    reservationId: options.reservationId,
    nouveauStatut: cible,
    motif: options.motif?.trim() !== '' ? options.motif?.trim() : undefined,
    auteurId: session.userId,
  });
  if (!resultat.ok) return { ok: false, message: resultat.message };
  if (options.cheminRevalidation !== undefined) {
    revalidatePath(options.cheminRevalidation);
  }
  return { ok: true };
}

export async function accepterReservationAction(
  options: OptionsActionProprietaire,
): Promise<ResultatActionProprietaire> {
  return executerTransitionProprietaire(options, 'acceptee');
}

export async function refuserReservationAction(
  options: OptionsActionProprietaire,
): Promise<ResultatActionProprietaire> {
  return executerTransitionProprietaire(options, 'refusee');
}

export async function marquerReservationRealiseeAction(
  options: OptionsActionProprietaire,
): Promise<ResultatActionProprietaire> {
  return executerTransitionProprietaire(options, 'realisee');
}

// ============================================================
// Confirmation par le demandeur après réalisation (V2.3.14)
// ============================================================

export type ResultatConfirmation = { ok: true } | { ok: false; message: string };

/**
 * Confirme côté demandeur qu'une réservation marquée « réalisée » par
 * le propriétaire correspond bien à ce qui s'est passé. Transition D8
 * `realisee → confirmee` : c'est la fin du cycle de la réservation,
 * elle est figée.
 *
 * Règles :
 * - Seul le demandeur peut confirmer sa propre réservation (les admins
 *   passent par leurs propres outils).
 * - Transition autorisée par la machine à états D8 (`transitionAutorisee`) :
 *   uniquement depuis `realisee`. Les autres états remontent un message
 *   d'erreur explicite.
 * - Action irréversible : une fois `confirmee`, la machine à états D8
 *   n'autorise plus aucune transition (le seul recours est `realisee →
 *   litige` côté demandeur, fait avant la confirmation).
 *
 * La RLS `reservation_update_demandeur` (V2.2.2) autorise déjà l'écriture
 * par le demandeur ; on duplique le check applicatif pour un retour
 * d'erreur lisible.
 */
export async function confirmerReservationAction(options: {
  reservationId: string;
  motif?: string;
  cheminRevalidation?: string;
}): Promise<ResultatConfirmation> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const supabase = await getSupabaseServer();
  const { data: existant, error: erreurLecture } = await supabase
    .from('reservation')
    .select('id, demandeur_personne_id, statut')
    .eq('id', options.reservationId)
    .maybeSingle();

  if (erreurLecture !== null || existant === null) {
    return { ok: false, message: 'Réservation introuvable.' };
  }
  if (existant.demandeur_personne_id !== session.userId) {
    return { ok: false, message: 'Tu n’as pas l’autorisation de confirmer cette réservation.' };
  }
  const statutActuel = existant.statut as
    | 'proposee'
    | 'acceptee'
    | 'refusee'
    | 'realisee'
    | 'confirmee'
    | 'annulee'
    | 'litige';
  if (!transitionAutorisee(statutActuel, 'confirmee')) {
    return {
      ok: false,
      message: `Une réservation au statut « ${statutActuel} » ne peut pas être confirmée (uniquement depuis « réalisée »).`,
    };
  }

  const resultat = await changerStatutReservation({
    reservationId: options.reservationId,
    nouveauStatut: 'confirmee',
    motif: options.motif?.trim() !== '' ? options.motif?.trim() : undefined,
    auteurId: session.userId,
  });

  if (!resultat.ok) {
    return { ok: false, message: resultat.message };
  }

  if (options.cheminRevalidation !== undefined) {
    revalidatePath(options.cheminRevalidation);
  }
  return { ok: true };
}

// ============================================================
// Annulation d'une réservation par le demandeur (V2.3.11)
// ============================================================

export type ResultatAnnulation = { ok: true } | { ok: false; message: string };

/**
 * Annule une réservation dont la personne connectée est demandeuse.
 *
 * Règles :
 * - Seul le demandeur peut annuler sa propre réservation depuis cette
 *   Server Action (les admins passent par leurs propres outils).
 * - Transition autorisée selon la machine à états D8 (cf.
 *   `transitionAutorisee`) : `proposee → annulee` et `acceptee → annulee`
 *   sont les deux cas. Les autres états (refusée, déjà annulée, réalisée,
 *   confirmée, litige) ne peuvent pas être annulés ici.
 * - `motif` facultatif mais recommandé (transparence pour le propriétaire
 *   de l'offre).
 *
 * La RLS `reservation_update_demandeur` (V2.2.2) autorise déjà
 * l'écriture par le demandeur ; on duplique le check côté applicatif
 * pour un retour d'erreur lisible.
 */
export async function annulerReservationAction(options: {
  reservationId: string;
  motif?: string;
  cheminRevalidation?: string;
}): Promise<ResultatAnnulation> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const supabase = await getSupabaseServer();
  const { data: existant, error: erreurLecture } = await supabase
    .from('reservation')
    .select('id, demandeur_personne_id, statut')
    .eq('id', options.reservationId)
    .maybeSingle();

  if (erreurLecture !== null || existant === null) {
    return { ok: false, message: 'Réservation introuvable.' };
  }
  if (existant.demandeur_personne_id !== session.userId) {
    return { ok: false, message: 'Tu n’as pas l’autorisation d’annuler cette réservation.' };
  }
  const statutActuel = existant.statut as
    | 'proposee'
    | 'acceptee'
    | 'refusee'
    | 'realisee'
    | 'confirmee'
    | 'annulee'
    | 'litige';
  if (!transitionAutorisee(statutActuel, 'annulee')) {
    return {
      ok: false,
      message: `Une réservation au statut « ${statutActuel} » ne peut plus être annulée.`,
    };
  }

  const resultat = await changerStatutReservation({
    reservationId: options.reservationId,
    nouveauStatut: 'annulee',
    motif: options.motif?.trim() !== '' ? options.motif?.trim() : undefined,
    auteurId: session.userId,
  });

  if (!resultat.ok) {
    return { ok: false, message: resultat.message };
  }

  if (options.cheminRevalidation !== undefined) {
    revalidatePath(options.cheminRevalidation);
  }
  return { ok: true };
}
