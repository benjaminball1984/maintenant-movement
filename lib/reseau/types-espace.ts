/**
 * Types client-safe pour les espaces publieurs dans le réseau social
 * (V2.5.22 — extraction depuis `lib/reseau/espace.ts`).
 *
 * Ce fichier ne contient AUCUN runtime : pas d'import de Supabase, pas de
 * `next/headers`. Sûr à importer depuis n'importe quel composant client
 * sans risquer de tirer la chaîne `cookies()` qui crashe le bundler.
 *
 * Les helpers runtime (`creerPostEspace`, `estMembreActifEspace`, etc.)
 * restent dans `lib/reseau/espace.ts` et continuent de réexporter ces
 * types pour la rétrocompatibilité.
 */

export type TypeEspacePostable =
  | 'commune'
  | 'federation'
  | 'confederation'
  | 'gt_thematique'
  | 'groupe_entraide_local'
  | 'campagne'
  | 'organisation';

/** Informations d'un espace nécessaires à l'affichage d'un post publié en son nom. */
export interface AttributionEspace {
  type: TypeEspacePostable;
  id: string;
  nom: string;
  slug: string;
  imageUrl: string | null;
  cheminPublic: string;
}
