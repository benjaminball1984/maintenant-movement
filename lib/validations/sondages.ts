import { z } from 'zod';
import { codePostalFrancaisSchema, tokenTurnstileSchema } from './auth';

/**
 * Validations Zod des Sondages (chantier 7.4).
 * Cf. `docs/specs/01_ARCHITECTURE.md §4D`.
 */

export const creerSondageSchema = z
  .object({
    titre: z
      .string()
      .trim()
      .min(5, 'Le titre doit comporter au moins 5 caractères.')
      .max(200, 'Le titre doit faire 200 caractères maximum.'),
    question: z
      .string()
      .trim()
      .min(10, 'La question doit comporter au moins 10 caractères.')
      .max(500, 'La question doit faire 500 caractères maximum.'),
    options: z
      .array(z.string().trim().min(1, 'Option vide.').max(200))
      .min(2, 'Au moins 2 options.')
      .max(10, 'Maximum 10 options.'),
    image_url: z.string().url().optional().or(z.literal('')),
    mode: z.enum(['classique', 'pondere']),
    commune_id: z.string().uuid().optional().or(z.literal('')),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict()
  .refine(
    (d) => {
      const aLat = d.latitude !== null && d.latitude !== undefined;
      const aLng = d.longitude !== null && d.longitude !== undefined;
      return aLat === aLng;
    },
    {
      message: 'Latitude et longitude doivent être fournies ensemble.',
      path: ['latitude'],
    },
  );

export type DonneesCreerSondage = z.infer<typeof creerSondageSchema>;

export const voterSondageSchema = z
  .object({
    sondage_id: z.string().uuid(),
    option_index: z
      .number()
      .int('L’option doit être un index entier.')
      .min(0, 'Option invalide.')
      .max(9, 'Option invalide.'),
    /**
     * Variables sociodémo optionnelles (mode pondéré).
     * La personne peut refuser de les renseigner.
     */
    code_postal: codePostalFrancaisSchema.optional().or(z.literal('')),
    tranche_age: z.enum(['moins_18', '18_24', '25_34', '35_49', '50_64', '65_plus']).optional(),
    pronom: z.string().trim().max(30).optional().or(z.literal('')),
    genre_declare: z.string().trim().max(100).optional().or(z.literal('')),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesVoterSondage = z.infer<typeof voterSondageSchema>;
