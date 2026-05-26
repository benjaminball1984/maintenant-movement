/**
 * Validation pure du formulaire de création / engagement d'une location
 * mutualisée (cycle V2 §12, chantier V2.3.3). Extraite pour être testable
 * sans Supabase.
 *
 * Règles métier clés :
 * - `avertissement_juridique_accepte` doit être `true` (sinon refus).
 * - Canal forcé à euros (§12 : pas de 99-coin sur les locations
 *   mutualisées, l'organisateur serait piégé).
 * - `date_limite_engagement <= date_evenement`.
 * - `prix_par_part_centimes × nb_parts_max >= montant_total_centimes`
 *   (la collecte doit pouvoir atteindre le montant cible).
 */

import { z } from 'zod';

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const TYPE_LOCATION = [
  'transport_bus',
  'transport_car',
  'transport_minibus',
  'hebergement_salle',
  'hebergement_lieu',
  'autre',
] as const;

export const creerLocationMutualiseeSchema = z
  .object({
    titre: z.string().trim().min(3).max(200),
    description: z.string().trim().min(10).max(5000),
    type_location: z.enum(TYPE_LOCATION),
    prestataire: z.string().trim().min(2).max(500),
    lieu: z.string().trim().min(2).max(200),
    date_evenement: z.string().datetime(),
    date_limite_engagement: z.string().datetime(),
    montant_total_centimes: z.number().int().positive(),
    nb_parts_max: z.number().int().min(1).max(1000),
    prix_par_part_centimes: z.number().int().positive(),
    image_url: z.string().url().nullable().optional(),
    avertissement_juridique_accepte: z.boolean().refine((v) => v === true, {
      message:
        'L’avertissement juridique (responsabilité de tampon) doit être accepté avant de créer une location mutualisée.',
    }),
  })
  .refine((d) => new Date(d.date_limite_engagement) <= new Date(d.date_evenement), {
    message: 'La date limite d’engagement doit être avant ou égale à la date d’événement.',
    path: ['date_limite_engagement'],
  })
  .refine((d) => d.nb_parts_max * d.prix_par_part_centimes >= d.montant_total_centimes, {
    message:
      'La capacité totale (nb_parts × prix_par_part) doit pouvoir couvrir au moins le montant total visé.',
    path: ['nb_parts_max'],
  });

export type DonneesCreerLocationMutualisee = z.infer<typeof creerLocationMutualiseeSchema>;

export const engagementLocationSchema = z.object({
  location_id: z.string().uuid(),
  nb_parts: z.number().int().min(1).max(100),
});

export type DonneesEngagement = z.infer<typeof engagementLocationSchema>;

/**
 * Génère un slug à partir d'un titre (cf. `lib/groupe-entraide-local-validation.ts`).
 */
export function slugifierTitreLocation(titre: string): string {
  return titre
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function slugValide(slug: string): boolean {
  return SLUG_REGEX.test(slug) && slug.length >= 3 && slug.length <= 80;
}

/**
 * Calcule le montant attendu pour `nb_parts` parts au prix donné.
 */
export function montantAttenduEngagement(nbParts: number, prixParPartCentimes: number): number {
  return nbParts * prixParPartCentimes;
}
