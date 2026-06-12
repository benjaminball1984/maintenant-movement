import {
  MESSAGES_VALIDATION_SONDAGES_DEFAUT,
  type MessagesValidationSondages,
} from '@/lib/messages-validation';
import { estUrlImageDurable } from '@/lib/validation-url';
import { z } from 'zod';

/**
 * Validations Zod des Sondages (chantier 7.4).
 * Cf. `docs/specs/01_ARCHITECTURE.md §4D`.
 */

export function creerSondageFactory(
  messages: MessagesValidationSondages = MESSAGES_VALIDATION_SONDAGES_DEFAUT,
) {
  return z
    .object({
      titre: z.string().trim().min(5, messages.titreMin).max(200, messages.titreMax),
      question: z.string().trim().min(10, messages.questionMin).max(500, messages.questionMax),
      options: z
        .array(z.string().trim().min(1, messages.optionVide).max(200))
        .min(2, messages.optionsMin)
        .max(20, messages.optionsMax),
      /**
       * Images optionnelles des options : tableau PARALLÈLE à `options`
       * (même longueur, null pour une option sans image). Absent = aucune
       * option illustrée. Cohérence des longueurs vérifiée plus bas.
       */
      options_images: z
        .array(z.string().url().refine(estUrlImageDurable, messages.imageUrlEphemere).nullable())
        .max(20, messages.optionsMax)
        .optional(),
      // Refus des CDN éphémères (Facebook/Instagram) : liens signés qui expirent.
      image_url: z
        .string()
        .url()
        .refine(estUrlImageDurable, messages.imageUrlEphemere)
        .optional()
        .or(z.literal('')),
      // NB : plus de champ `mode` (revue 2026-06-12) : l'affichage bascule
      // automatiquement en pondéré dès 300 répondant·es, le visiteur choisit
      // sa vue. La colonne reste en base (historique) avec son défaut.
      commune_id: z.string().uuid().optional().or(z.literal('')),
      latitude: z.number().min(-90).max(90).nullable().optional(),
      longitude: z.number().min(-180).max(180).nullable().optional(),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict()
    .refine(
      (d) => {
        const aLat = d.latitude !== null && d.latitude !== undefined;
        const aLng = d.longitude !== null && d.longitude !== undefined;
        return aLat === aLng;
      },
      {
        message: messages.latLngEnsemble,
        path: ['latitude'],
      },
    )
    .refine((d) => d.options_images === undefined || d.options_images.length === d.options.length, {
      message: messages.optionsImagesIncoherentes,
      path: ['options_images'],
    });
}
export const creerSondageSchema = creerSondageFactory();

export type DonneesCreerSondage = z.infer<typeof creerSondageSchema>;

export function creerVoterSondageSchema(
  messages: MessagesValidationSondages = MESSAGES_VALIDATION_SONDAGES_DEFAUT,
) {
  return z
    .object({
      sondage_id: z.string().uuid(),
      option_index: z
        .number()
        .int(messages.optionIndexEntier)
        .min(0, messages.optionIndexInvalide)
        .max(19, messages.optionIndexInvalide),
      /**
       * Variables sociodémo optionnelles (mode pondéré).
       * La personne peut refuser de les renseigner.
       */
      code_postal: z
        .string()
        .trim()
        .regex(/^\d{5}$/, messages.codePostalFormat)
        .optional()
        .or(z.literal('')),
      // `''` accepté : le sélecteur du formulaire envoie une chaîne vide
      // quand la personne ne déclare pas sa tranche (converti en null côté action).
      tranche_age: z
        .enum(['moins_18', '18_24', '25_34', '35_49', '50_64', '65_plus'])
        .optional()
        .or(z.literal('')),
      pronom: z.string().trim().max(30).optional().or(z.literal('')),
      genre_declare: z.string().trim().max(100).optional().or(z.literal('')),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict();
}
export const voterSondageSchema = creerVoterSondageSchema();

export type DonneesVoterSondage = z.infer<typeof voterSondageSchema>;
