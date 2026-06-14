import {
  MESSAGES_VALIDATION_MEDIA_DEFAUT,
  type MessagesValidationMedia,
} from '@/lib/messages-validation';
import { z } from 'zod';

/**
 * Validations Zod du sous-espace Maintenant Médias (chantier 7.1).
 * Cf. `docs/specs/01_ARCHITECTURE.md §4A`.
 */

export function creerMediaFactory(
  messages: MessagesValidationMedia = MESSAGES_VALIDATION_MEDIA_DEFAUT,
) {
  return z
    .object({
      titre: z.string().trim().min(5, messages.titreMin).max(200, messages.titreMax),
      corps: z.string().trim().min(30, messages.corpsMin).max(50_000, messages.corpsMax),
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
      token_turnstile: z.string().min(1, messages.turnstileRequis),
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
        message: messages.provenanceSourceRequise,
        path: ['source_url'],
      },
    );
}
export const creerMediaSchema = creerMediaFactory();

export type DonneesCreerMedia = z.infer<typeof creerMediaSchema>;

export const publierMediaSchema = z
  .object({
    media_id: z.string().uuid(),
  })
  .strict();

export type DonneesPublierMedia = z.infer<typeof publierMediaSchema>;

/**
 * Édition d'un média par un·e admin (chantier V2.6.109, demande Ben :
 * « en mode admin il faut pouvoir modifier tous les contenus »). Tous les
 * champs de contenu sont éditables ; le `media_id` identifie la fiche.
 */
export function creerMettreAJourMediaSchema(
  messages: MessagesValidationMedia = MESSAGES_VALIDATION_MEDIA_DEFAUT,
) {
  return z
    .object({
      media_id: z.string().uuid(),
      titre: z.string().trim().min(5, messages.titreMin).max(200, messages.titreMax),
      corps: z.string().trim().min(10, messages.corpsMin).max(50_000, messages.corpsMax),
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
      vignette_url: z.string().url().optional().or(z.literal('')),
      media_url: z.string().url().optional().or(z.literal('')),
      tags: z.array(z.string().trim().max(60)).max(20).optional(),
      provenance_externe: z.string().trim().max(200).optional().or(z.literal('')),
      source_url: z.string().url().optional().or(z.literal('')),
    })
    .strict();
}
export const mettreAJourMediaSchema = creerMettreAJourMediaSchema();

export type DonneesMettreAJourMedia = z.infer<typeof mettreAJourMediaSchema>;

/**
 * Reclassement inline d'un média par un·e admin (demande Ben 2026-06-14 :
 * « pouvoir modifier les types, les tags et catégories en mode admin
 * directement sur chaque contenu »). Volontairement MINIMAL : seuls `type`
 * et `tags` sont touchés, pour ne JAMAIS risquer d'effacer le titre, le
 * corps, l'image ou la source en passant par le formulaire complet.
 */
export const reclasserMediaSchema = z
  .object({
    media_id: z.string().uuid(),
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
    tags: z.array(z.string().trim().max(60)).max(20),
  })
  .strict();

export type DonneesReclasserMedia = z.infer<typeof reclasserMediaSchema>;

export function creerRetirerMediaSchema(
  messages: MessagesValidationMedia = MESSAGES_VALIDATION_MEDIA_DEFAUT,
) {
  return z
    .object({
      media_id: z.string().uuid(),
      raison_retrait: z.string().trim().min(10, messages.retraitRaisonMin).max(500),
    })
    .strict();
}
export const retirerMediaSchema = creerRetirerMediaSchema();

export type DonneesRetirerMedia = z.infer<typeof retirerMediaSchema>;
