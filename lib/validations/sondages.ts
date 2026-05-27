import {
  MESSAGES_VALIDATION_SONDAGES_DEFAUT,
  type MessagesValidationSondages,
} from '@/lib/messages-validation';
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
        .max(10, messages.optionsMax),
      image_url: z.string().url().optional().or(z.literal('')),
      mode: z.enum(['classique', 'pondere']),
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
    );
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
        .max(9, messages.optionIndexInvalide),
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
      tranche_age: z.enum(['moins_18', '18_24', '25_34', '35_49', '50_64', '65_plus']).optional(),
      pronom: z.string().trim().max(30).optional().or(z.literal('')),
      genre_declare: z.string().trim().max(100).optional().or(z.literal('')),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict();
}
export const voterSondageSchema = creerVoterSondageSchema();

export type DonneesVoterSondage = z.infer<typeof voterSondageSchema>;
