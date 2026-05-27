import {
  MESSAGES_VALIDATION_MOMENTS_DEFAUT,
  type MessagesValidationMoments,
} from '@/lib/messages-validation';
import { z } from 'zod';

/**
 * Validations Zod des Moments solidaires (chantier 5.3).
 * Cf. `docs/specs/01_ARCHITECTURE.md §7C`.
 */

export function creerMomentSolidaireFactory(
  messages: MessagesValidationMoments = MESSAGES_VALIDATION_MOMENTS_DEFAUT,
) {
  return z
    .object({
      titre: z.string().trim().min(5, messages.titreMin).max(200, messages.titreMax),
      description: z
        .string()
        .trim()
        .min(30, messages.descriptionMin)
        .max(3000, messages.descriptionMax),
      type: z.enum([
        'porte_a_porte',
        'maraude',
        'vide_grenier_solidaire',
        'soutien',
        'manifestation',
        'rencontre',
        'concert_solidaire',
        'repas_solidaire',
      ]),
      lieu: z.string().trim().min(3, messages.lieuRequis).max(200),
      latitude: z.number().min(-90).max(90).nullable().optional(),
      longitude: z.number().min(-180).max(180).nullable().optional(),
      commence_le: z.string().datetime({ message: messages.commenceLeFormat }),
      termine_le: z
        .string()
        .datetime({ message: messages.termineLeFormat })
        .optional()
        .or(z.literal('')),
      commune_id: z.string().uuid().optional().or(z.literal('')),
      cause_locale: z.string().trim().max(200).optional().or(z.literal('')),
      capacite_max: z.number().int().min(1).max(10_000).nullable().optional(),
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
    .refine(
      (d) => {
        if (d.termine_le === '' || d.termine_le === undefined) return true;
        return new Date(d.commence_le) <= new Date(d.termine_le);
      },
      { message: messages.dateCoherence, path: ['termine_le'] },
    );
}
export const creerMomentSolidaireSchema = creerMomentSolidaireFactory();

export type DonneesCreerMomentSolidaire = z.infer<typeof creerMomentSolidaireSchema>;

export function creerParticiperMomentSchema(
  messages: MessagesValidationMoments = MESSAGES_VALIDATION_MOMENTS_DEFAUT,
) {
  return z
    .object({
      moment_id: z.string().uuid(),
      prenom: z.string().trim().max(100).optional().or(z.literal('')),
      email: z
        .string()
        .trim()
        .toLowerCase()
        .email(messages.emailFormat)
        .optional()
        .or(z.literal('')),
      telephone: z.string().trim().max(30).optional().or(z.literal('')),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict();
}
export const participerMomentSchema = creerParticiperMomentSchema();

export type DonneesParticiperMoment = z.infer<typeof participerMomentSchema>;

export function creerAjouterTupperwareSchema(
  messages: MessagesValidationMoments = MESSAGES_VALIDATION_MOMENTS_DEFAUT,
) {
  return z
    .object({
      moment_id: z.string().uuid(),
      porteureuse_prenom: z.string().trim().min(1, messages.prenomRequis).max(100),
      porteureuse_email: z
        .string()
        .trim()
        .toLowerCase()
        .email(messages.emailFormat)
        .optional()
        .or(z.literal('')),
      porteureuse_telephone: z.string().trim().max(30).optional().or(z.literal('')),
      contenu: z.string().trim().max(200).optional().or(z.literal('')),
    })
    .strict();
}
export const ajouterTupperwareSchema = creerAjouterTupperwareSchema();

export type DonneesAjouterTupperware = z.infer<typeof ajouterTupperwareSchema>;

export const marquerTupperwareRenduSchema = z
  .object({
    tupperware_id: z.string().uuid(),
  })
  .strict();

export type DonneesMarquerTupperwareRendu = z.infer<typeof marquerTupperwareRenduSchema>;
