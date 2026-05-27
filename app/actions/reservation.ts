'use server';

import { getSession } from '@/lib/auth/session';
import { poserNotification } from '@/lib/notification';
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
    // V2.3.25 : cloche pour le propriétaire d'offre.
    await poserNotification(
      {
        destinatairePersonneId: createurId,
        type: 'reservation_demande_recue',
        titre: 'Nouvelle demande de réservation',
        message: `Sur ton offre : ${titreOffre}`,
        href: '/profil/demandes-reservations',
        cibleId: resultat.reservation.id,
        cibleTable: 'reservation',
      },
      session.userId,
    );
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

  // V2.3.25 : cloche pour le demandeur.
  const supabase = await getSupabaseServer();
  const { data: ligne } = await supabase
    .from('reservation')
    .select('demandeur_personne_id')
    .eq('id', options.reservationId)
    .maybeSingle();
  const demandeurId = ligne?.demandeur_personne_id ?? null;
  if (demandeurId !== null) {
    const typeNotif =
      cible === 'acceptee'
        ? 'reservation_acceptee'
        : cible === 'refusee'
          ? 'reservation_refusee'
          : 'reservation_realisee';
    const titreNotif =
      cible === 'acceptee'
        ? 'Réservation acceptée'
        : cible === 'refusee'
          ? 'Réservation refusée'
          : 'Réservation marquée comme réalisée';
    await poserNotification(
      {
        destinatairePersonneId: demandeurId,
        type: typeNotif,
        titre: titreNotif,
        message: options.motif?.trim() !== '' ? options.motif?.trim() : undefined,
        href: '/profil/reservations',
        cibleId: options.reservationId,
        cibleTable: 'reservation',
      },
      session.userId,
    );
  }

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

/**
 * Signalement de litige côté propriétaire (V2.3.21, symétrique de
 * V2.3.16). Transition D8 `acceptee → litige` quand la prestation a
 * démarré mais qu'un problème grave bloque sa réalisation (demandeur
 * absent, comportement inapproprié, dégradation matérielle pour un prêt,
 * etc.).
 *
 * Motif obligatoire (10 à 1000 caractères) pour la modération.
 */
export async function signalerLitigeProprietaireAction(options: {
  reservationId: string;
  motif: string;
  cheminRevalidation?: string;
}): Promise<ResultatActionProprietaire> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const motifNettoye = options.motif.trim();
  if (motifNettoye.length < 10) {
    return { ok: false, message: 'Le motif doit faire au moins 10 caractères.' };
  }
  if (motifNettoye.length > 1000) {
    return { ok: false, message: 'Le motif est trop long (1000 caractères maximum).' };
  }

  const verif = await chargerReservationCommeProprietaire(options.reservationId, session.userId);
  if (!verif.ok) return verif;
  if (!transitionAutorisee(verif.statut, 'litige')) {
    return {
      ok: false,
      message: `Une réservation au statut « ${verif.statut} » ne peut pas faire l’objet d’un litige côté propriétaire (uniquement depuis « acceptée »).`,
    };
  }

  const resultat = await changerStatutReservation({
    reservationId: options.reservationId,
    nouveauStatut: 'litige',
    motif: motifNettoye,
    auteurId: session.userId,
  });
  if (!resultat.ok) return { ok: false, message: resultat.message };

  // V2.3.25 : cloche pour le demandeur (l'autre partie).
  const supabase = await getSupabaseServer();
  const { data: ligne } = await supabase
    .from('reservation')
    .select('demandeur_personne_id')
    .eq('id', options.reservationId)
    .maybeSingle();
  if (ligne?.demandeur_personne_id !== undefined && ligne?.demandeur_personne_id !== null) {
    await poserNotification(
      {
        destinatairePersonneId: ligne.demandeur_personne_id,
        type: 'reservation_litige_signale',
        titre: 'Litige signalé par le propriétaire',
        message: motifNettoye,
        href: '/profil/reservations',
        cibleId: options.reservationId,
        cibleTable: 'reservation',
      },
      session.userId,
    );
  }

  if (options.cheminRevalidation !== undefined) {
    revalidatePath(options.cheminRevalidation);
  }
  return { ok: true };
}

// ============================================================
// Résolution de litige par un·e admin (V2.3.17)
// ============================================================

export type ResultatResolutionLitige = { ok: true } | { ok: false; message: string };

const MOTIF_RESOLUTION_MIN = 10;
const MOTIF_RESOLUTION_MAX = 2000;

/**
 * Résout un litige côté admin : la réservation passe de `litige` à
 * `confirmee` (en faveur du propriétaire) ou `annulee` (en faveur du
 * demandeur). Action réservée aux admins.
 *
 * Contournement explicite de `transitionAutorisee` : la machine à états
 * D8 V2.2.2 considère `litige` comme terminal pour les acteurs
 * ordinaires. L'admin a le privilège documenté de débloquer. Le journal
 * D8bis (V2.3.15) garde la trace (statut_avant = `litige`, auteur_id =
 * admin) ce qui rend l'arbitrage observable des deux côtés.
 *
 * Motif obligatoire (10 à 2000 caractères) : c'est la décision admin
 * communiquée aux deux parties. À distinguer du motif initial du
 * signalement (V2.3.16) qui reste dans le journal.
 */
export async function resoudreLitigeReservationAction(options: {
  reservationId: string;
  decision: 'confirmee' | 'annulee';
  motif: string;
  cheminRevalidation?: string;
}): Promise<ResultatResolutionLitige> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const supabase = await getSupabaseServer();
  const { data: estAdmin } = await supabase.rpc('est_admin_general');
  if (estAdmin !== true) {
    return { ok: false, message: 'Action réservée aux admins.' };
  }

  const motifNettoye = options.motif.trim();
  if (motifNettoye.length < MOTIF_RESOLUTION_MIN) {
    return {
      ok: false,
      message: `Le motif d’arbitrage doit faire au moins ${MOTIF_RESOLUTION_MIN} caractères.`,
    };
  }
  if (motifNettoye.length > MOTIF_RESOLUTION_MAX) {
    return {
      ok: false,
      message: `Le motif d’arbitrage est trop long (${MOTIF_RESOLUTION_MAX} caractères maximum).`,
    };
  }

  const { data: existant } = await supabase
    .from('reservation')
    .select('id, statut')
    .eq('id', options.reservationId)
    .maybeSingle();

  if (existant === null) {
    return { ok: false, message: 'Réservation introuvable.' };
  }
  if (existant.statut !== 'litige') {
    return {
      ok: false,
      message: `Seules les réservations en statut « litige » peuvent être arbitrées (actuellement : ${existant.statut}).`,
    };
  }

  // Contournement explicite : on n'appelle pas `transitionAutorisee` ici
  // (l'admin a le privilège de débloquer un statut terminal). Le journal
  // D8bis trace la transition `litige → cible` avec auteur_id admin.
  const resultat = await changerStatutReservation({
    reservationId: options.reservationId,
    nouveauStatut: options.decision,
    motif: motifNettoye,
    auteurId: session.userId,
  });

  if (!resultat.ok) {
    return { ok: false, message: resultat.message };
  }

  // V2.3.25 : cloche pour les deux parties (arbitrage admin).
  const { data: ligne } = await supabase
    .from('reservation')
    .select('demandeur_personne_id, offre_type, offre_id')
    .eq('id', options.reservationId)
    .maybeSingle();
  if (ligne !== null) {
    const { createurId: proprietaireId } = await chargerContexteOffre(
      ligne.offre_type as OffreTypeReservation,
      ligne.offre_id,
    );
    const corps = `Arbitrage : ${options.decision === 'confirmee' ? 'prestation confirmée' : 'réservation annulée'}. Motif : ${motifNettoye}`;
    for (const personneId of [ligne.demandeur_personne_id, proprietaireId]) {
      if (personneId !== null) {
        await poserNotification(
          {
            destinatairePersonneId: personneId,
            type: 'reservation_litige_arbitre',
            titre: 'Arbitrage de ton litige de réservation',
            message: corps,
            href: '/profil/reservations',
            cibleId: options.reservationId,
            cibleTable: 'reservation',
          },
          session.userId,
        );
      }
    }
  }

  if (options.cheminRevalidation !== undefined) {
    revalidatePath(options.cheminRevalidation);
  }
  return { ok: true };
}

// ============================================================
// Signalement de litige par le demandeur (V2.3.16)
// ============================================================

export type ResultatLitige = { ok: true } | { ok: false; message: string };

const MOTIF_LITIGE_MIN = 10;
const MOTIF_LITIGE_MAX = 1000;

/**
 * Signale un litige côté demandeur sur une réservation marquée
 * « réalisée » par le propriétaire. Transition D8 `realisee → litige`.
 *
 * Règles :
 * - Seul le demandeur peut signaler (les admins passent par leurs
 *   propres outils).
 * - Transition autorisée par la machine à états D8 :
 *   `acceptee → litige` (depuis V2.2.2 le code D8 l'autorise aussi
 *   pendant l'exécution si la prestation est interrompue) ET
 *   `realisee → litige`. Pour l'instant on n'expose que `realisee` côté
 *   UI car c'est le cas d'usage le plus courant — la transition
 *   `acceptee → litige` reste possible côté admin.
 * - Motif obligatoire (10 à 1000 caractères) pour la modération à venir.
 * - Action terminale : une fois en litige, la réservation est bloquée
 *   jusqu'à arbitrage admin.
 *
 * À noter : pas encore de table `litige` dédiée. La machine à états D8
 * pose juste le statut ; le journal D8bis (V2.3.15) garde la trace de
 * la transition et du motif. La modération viendra dans un chantier
 * dédié (intégrant `notification`, file modérateurs, etc.).
 */
export async function signalerLitigeReservationAction(options: {
  reservationId: string;
  motif: string;
  cheminRevalidation?: string;
}): Promise<ResultatLitige> {
  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Connexion requise.' };
  }

  const motifNettoye = options.motif.trim();
  if (motifNettoye.length < MOTIF_LITIGE_MIN) {
    return {
      ok: false,
      message: `Le motif doit faire au moins ${MOTIF_LITIGE_MIN} caractères.`,
    };
  }
  if (motifNettoye.length > MOTIF_LITIGE_MAX) {
    return {
      ok: false,
      message: `Le motif est trop long (${MOTIF_LITIGE_MAX} caractères maximum).`,
    };
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
    return {
      ok: false,
      message: 'Tu n’as pas l’autorisation de signaler un litige sur cette réservation.',
    };
  }
  const statutActuel = existant.statut as
    | 'proposee'
    | 'acceptee'
    | 'refusee'
    | 'realisee'
    | 'confirmee'
    | 'annulee'
    | 'litige';
  if (!transitionAutorisee(statutActuel, 'litige')) {
    return {
      ok: false,
      message: `Une réservation au statut « ${statutActuel} » ne peut pas faire l’objet d’un litige.`,
    };
  }

  const resultat = await changerStatutReservation({
    reservationId: options.reservationId,
    nouveauStatut: 'litige',
    motif: motifNettoye,
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

  // V2.3.25 : cloche pour le propriétaire d'offre.
  const { data: r } = await supabase
    .from('reservation')
    .select('offre_type, offre_id')
    .eq('id', options.reservationId)
    .maybeSingle();
  if (r !== null) {
    const { createurId } = await chargerContexteOffre(
      r.offre_type as OffreTypeReservation,
      r.offre_id,
    );
    if (createurId !== null) {
      await poserNotification(
        {
          destinatairePersonneId: createurId,
          type: 'reservation_confirmee',
          titre: 'Réservation confirmée par le demandeur',
          message: 'Le cycle est clos avec succès.',
          href: '/profil/demandes-reservations',
          cibleId: options.reservationId,
          cibleTable: 'reservation',
        },
        session.userId,
      );
    }
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

  // V2.3.25 : cloche pour le propriétaire d'offre.
  const { data: r } = await supabase
    .from('reservation')
    .select('offre_type, offre_id')
    .eq('id', options.reservationId)
    .maybeSingle();
  if (r !== null) {
    const { createurId } = await chargerContexteOffre(
      r.offre_type as OffreTypeReservation,
      r.offre_id,
    );
    if (createurId !== null) {
      await poserNotification(
        {
          destinatairePersonneId: createurId,
          type: 'reservation_annulee',
          titre: 'Réservation annulée par le demandeur',
          message: options.motif?.trim() !== '' ? options.motif?.trim() : undefined,
          href: '/profil/demandes-reservations',
          cibleId: options.reservationId,
          cibleTable: 'reservation',
        },
        session.userId,
      );
    }
  }

  if (options.cheminRevalidation !== undefined) {
    revalidatePath(options.cheminRevalidation);
  }
  return { ok: true };
}
