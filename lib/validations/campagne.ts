import { z } from 'zod';
import { tokenTurnstileSchema } from './auth';

/**
 * Validations Zod du sous-espace Campagnes (chantier 3.2).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §5B` :
 *   - Modération a priori (calque du flux Pétitions).
 *   - Modules combinables : pétition + mobilisation + cagnotte + sondage
 *     + page éditoriale (cf. migration 017 `module_campagne`).
 */

// ============================================================
// Création d'une campagne (auth requise + modération a priori)
// ============================================================

export const creerCampagneSchema = z
  .object({
    titre: z
      .string()
      .trim()
      .min(5, 'Le titre doit comporter au moins 5 caractères.')
      .max(200, 'Le titre doit faire 200 caractères maximum.'),
    texte: z
      .string()
      .trim()
      .min(100, 'Le texte doit comporter au moins 100 caractères.')
      .max(5000, 'Le texte doit faire 5000 caractères maximum.'),
    image_url: z.string().url("URL d'image invalide.").optional().or(z.literal('')),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesCreerCampagne = z.infer<typeof creerCampagneSchema>;

// ============================================================
// Modération a priori (publier | rejeter)
// ============================================================

export const modererCampagneSchema = z
  .object({
    campagne_id: z.string().uuid(),
    decision: z.enum(['publiee', 'rejetee']),
    raison_rejet: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.decision !== 'rejetee' ||
      (data.raison_rejet !== undefined && data.raison_rejet.length >= 10),
    {
      message:
        'Une raison de rejet d’au moins 10 caractères est requise pour rejeter une campagne.',
      path: ['raison_rejet'],
    },
  );

export type DonneesModererCampagne = z.infer<typeof modererCampagneSchema>;

// ============================================================
// Attachement d'un module à une campagne
// ============================================================

/**
 * Deux formes possibles selon `type_module` :
 *   - 'page_editoriale'  → `contenu_editorial` requis, `cible_id` absent.
 *   - autres types       → `cible_id` UUID requis, `contenu_editorial` absent.
 *
 * Le DB enforce la même cohérence via la contrainte CHECK `module_payload_coherent`.
 */
export const attacherModuleSchema = z
  .object({
    campagne_id: z.string().uuid(),
    type_module: z.enum(['petition', 'mobilisation', 'cagnotte', 'sondage', 'page_editoriale']),
    cible_id: z.string().uuid().optional(),
    contenu_editorial: z.string().trim().max(10_000).optional(),
    ordre: z.number().int().min(1).max(50).default(1),
  })
  .strict()
  .refine(
    (d) => {
      if (d.type_module === 'page_editoriale') {
        return (
          d.contenu_editorial !== undefined &&
          d.contenu_editorial.length >= 20 &&
          d.cible_id === undefined
        );
      }
      return d.cible_id !== undefined && d.contenu_editorial === undefined;
    },
    {
      message:
        'Le payload est incohérent : page_editoriale requiert un texte d’au moins 20 caractères, les autres types requièrent un cible_id.',
      path: ['type_module'],
    },
  );

export type DonneesAttacherModule = z.infer<typeof attacherModuleSchema>;

// ============================================================
// Détachement d'un module
// ============================================================

export const detacherModuleSchema = z
  .object({
    module_id: z.string().uuid(),
  })
  .strict();

export type DonneesDetacherModule = z.infer<typeof detacherModuleSchema>;
