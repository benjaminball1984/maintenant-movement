import { z } from 'zod';
import { tokenTurnstileSchema } from './auth';

/**
 * Validations Zod du sous-espace Maintenant Médias (chantier 7.1).
 * Cf. `docs/specs/01_ARCHITECTURE.md §4A`.
 */

export const creerMediaSchema = z
  .object({
    titre: z
      .string()
      .trim()
      .min(5, 'Le titre doit comporter au moins 5 caractères.')
      .max(200, 'Le titre doit faire 200 caractères maximum.'),
    corps: z
      .string()
      .trim()
      .min(30, 'Le corps doit comporter au moins 30 caractères.')
      .max(50_000, 'Corps trop long (50000 caractères max).'),
    type: z.enum([
      'edito',
      'tribune',
      'article',
      'breve',
      'dessin',
      'podcast',
      'video',
      'live',
      'newsletter',
    ]),
    media_url: z.string().url().optional().or(z.literal('')),
    vignette_url: z.string().url().optional().or(z.literal('')),
    tags: z.array(z.string().trim().max(60)).max(20).optional(),
    provenance_externe: z.string().trim().max(200).optional().or(z.literal('')),
    source_url: z.string().url().optional().or(z.literal('')),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict()
  .refine(
    (d) => {
      // Si provenance_externe renseignée → source_url requise.
      if (d.provenance_externe !== undefined && d.provenance_externe !== '') {
        return d.source_url !== undefined && d.source_url !== '';
      }
      return true;
    },
    {
      message:
        'Quand une provenance externe est renseignée, une URL source est obligatoire (transparence).',
      path: ['source_url'],
    },
  );

export type DonneesCreerMedia = z.infer<typeof creerMediaSchema>;

export const publierMediaSchema = z
  .object({
    media_id: z.string().uuid(),
  })
  .strict();

export type DonneesPublierMedia = z.infer<typeof publierMediaSchema>;

export const retirerMediaSchema = z
  .object({
    media_id: z.string().uuid(),
    raison_retrait: z
      .string()
      .trim()
      .min(10, 'La raison du retrait doit comporter au moins 10 caractères.')
      .max(500),
  })
  .strict();

export type DonneesRetirerMedia = z.infer<typeof retirerMediaSchema>;
