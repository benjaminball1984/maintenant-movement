/**
 * Constantes + type-guards partagés pour les filtres sur les
 * pages de réservation (V2.3.23 propriétaire + V2.3.24 demandeur +
 * V2.3.40 ajout filtre type d'offre).
 *
 * Le slug `tous` représente l'absence de filtre (filtre par défaut).
 */

import type { OffreTypeReservation, StatutReservation } from '@/lib/reservation';

export const STATUTS_FILTRES_RESERVATION: ReadonlyArray<{
  slug: 'tous' | StatutReservation;
  libelle: string;
}> = [
  { slug: 'tous', libelle: 'Tous' },
  { slug: 'proposee', libelle: 'En attente' },
  { slug: 'acceptee', libelle: 'Acceptées' },
  { slug: 'refusee', libelle: 'Refusées' },
  { slug: 'realisee', libelle: 'Réalisées' },
  { slug: 'confirmee', libelle: 'Confirmées' },
  { slug: 'annulee', libelle: 'Annulées' },
  { slug: 'litige', libelle: 'En litige' },
];

const STATUTS_VALIDES: ReadonlyArray<StatutReservation> = [
  'proposee',
  'acceptee',
  'refusee',
  'realisee',
  'confirmee',
  'annulee',
  'litige',
];

/**
 * Type-guard qui valide le `searchParams.statut` côté Server Component.
 * Accepte les chaînes correspondant exactement à un `StatutReservation`.
 */
export function estFiltreStatutValide(s: string | string[] | undefined): s is StatutReservation {
  return typeof s === 'string' && (STATUTS_VALIDES as readonly string[]).includes(s);
}

// ============================================================
// V2.3.40 : filtres par type d'offre
// ============================================================

export const TYPES_FILTRES_OFFRE: ReadonlyArray<{
  slug: 'tous' | OffreTypeReservation;
  libelle: string;
}> = [
  { slug: 'tous', libelle: 'Tous types' },
  { slug: 'transport_covoiturage', libelle: 'Covoiturage' },
  { slug: 'hebergement', libelle: 'Hébergement' },
  { slug: 'pret', libelle: 'Prêt' },
  { slug: 'service_sel', libelle: 'SEL' },
  { slug: 'location_mutualisee', libelle: 'Location mutualisée' },
  { slug: 'autre', libelle: 'Autre' },
];

const TYPES_VALIDES: ReadonlyArray<OffreTypeReservation> = [
  'transport_covoiturage',
  'hebergement',
  'pret',
  'service_sel',
  'location_mutualisee',
  'autre',
];

export function estFiltreTypeValide(s: string | string[] | undefined): s is OffreTypeReservation {
  return typeof s === 'string' && (TYPES_VALIDES as readonly string[]).includes(s);
}
