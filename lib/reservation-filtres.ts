/**
 * Constante + type-guard partagés pour les filtres par statut sur les
 * pages de réservation (V2.3.23 propriétaire + V2.3.24 demandeur).
 *
 * Le slug `tous` représente l'absence de filtre (filtre par défaut).
 * Les autres slugs sont les statuts D8 V2.2.2 stricts.
 */

import type { StatutReservation } from '@/lib/reservation';

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
