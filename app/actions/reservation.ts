'use server';

import { getSession } from '@/lib/auth/session';
import { type OffreTypeReservation, creerReservation } from '@/lib/reservation';
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

  if (options.cheminRevalidation !== undefined) {
    revalidatePath(options.cheminRevalidation);
  }
  return { ok: true, reservationId: resultat.reservation.id };
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
