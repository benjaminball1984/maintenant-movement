/**
 * Validation pure du formulaire de création / mise à jour d'un groupe
 * d'entraide local (cycle V2 V2.3.2). Extraite pour être testable sans
 * Supabase.
 */

import { z } from 'zod';

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export const creerGroupeEntraideSchema = z.object({
  nom: z.string().trim().min(3, 'Le nom doit faire au moins 3 caractères.').max(200),
  description_courte: z
    .string()
    .trim()
    .min(10, 'La description courte doit faire au moins 10 caractères.')
    .max(500),
  description: z
    .string()
    .trim()
    .min(10, 'La description doit faire au moins 10 caractères.')
    .max(5000),
  zone_geographique: z.string().trim().min(2, 'La zone géographique est obligatoire.').max(200),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
});

export type DonneesCreerGroupeEntraide = z.infer<typeof creerGroupeEntraideSchema>;

/**
 * Génère un slug à partir d'un nom : minuscules, tirets, sans accents,
 * borné à 80 caractères. Identique au pattern utilisé pour les pétitions
 * (`lib/petitions/slugifier.ts`), reproduit ici localement pour ne pas
 * créer de dépendance croisée.
 */
export function slugifierNomGroupe(nom: string): string {
  return (
    nom
      .toLowerCase()
      .normalize('NFD')
      // `\p{Mn}` = Mark, Nonspacing : retire les diacritiques séparés par
      // le NFD précédent. Plus sûr qu'une plage ̀-ͯ directe
      // (Biome refuse les character classes avec combining chars).
      .replace(/\p{Mn}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
  );
}

/**
 * Vérifie qu'un slug est conforme au CHECK SQL.
 */
export function slugValide(slug: string): boolean {
  return SLUG_REGEX.test(slug) && slug.length >= 3 && slug.length <= 80;
}

/**
 * Coordonnées géographiques cohérentes : soit les deux remplies dans
 * leurs bornes, soit les deux null.
 */
export function coordonneesValides(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  const latRenseignee = latitude !== null && latitude !== undefined;
  const lngRenseignee = longitude !== null && longitude !== undefined;
  if (latRenseignee !== lngRenseignee) return false;
  if (!latRenseignee || !lngRenseignee) return true;
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}
