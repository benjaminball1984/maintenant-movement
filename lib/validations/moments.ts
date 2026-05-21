import { z } from 'zod';
import { tokenTurnstileSchema } from './auth';

/**
 * Validations Zod des Moments solidaires (chantier 5.3).
 * Cf. `docs/specs/01_ARCHITECTURE.md §7C`.
 */

export const creerMomentSolidaireSchema = z
  .object({
    titre: z
      .string()
      .trim()
      .min(5, 'Le titre doit comporter au moins 5 caractères.')
      .max(200, 'Le titre doit faire 200 caractères maximum.'),
    description: z
      .string()
      .trim()
      .min(30, 'La description doit comporter au moins 30 caractères.')
      .max(3000, 'La description doit faire 3000 caractères maximum.'),
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
    lieu: z.string().trim().min(3, 'Le lieu est requis.').max(200),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    commence_le: z.string().datetime({ message: 'Date de début invalide (ISO 8601).' }),
    termine_le: z
      .string()
      .datetime({ message: 'Date de fin invalide (ISO 8601).' })
      .optional()
      .or(z.literal('')),
    commune_id: z.string().uuid().optional().or(z.literal('')),
    cause_locale: z.string().trim().max(200).optional().or(z.literal('')),
    capacite_max: z.number().int().min(1).max(10_000).nullable().optional(),
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
  )
  .refine(
    (d) => {
      if (d.termine_le === '' || d.termine_le === undefined) return true;
      return new Date(d.commence_le) <= new Date(d.termine_le);
    },
    { message: 'La date de fin doit suivre la date de début.', path: ['termine_le'] },
  );

export type DonneesCreerMomentSolidaire = z.infer<typeof creerMomentSolidaireSchema>;

export const participerMomentSchema = z
  .object({
    moment_id: z.string().uuid(),
    prenom: z.string().trim().max(100).optional().or(z.literal('')),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Le format de l'email semble incorrect.")
      .optional()
      .or(z.literal('')),
    telephone: z.string().trim().max(30).optional().or(z.literal('')),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesParticiperMoment = z.infer<typeof participerMomentSchema>;

export const ajouterTupperwareSchema = z
  .object({
    moment_id: z.string().uuid(),
    porteureuse_prenom: z.string().trim().min(1, 'Prénom requis.').max(100),
    porteureuse_email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Le format de l'email semble incorrect.")
      .optional()
      .or(z.literal('')),
    porteureuse_telephone: z.string().trim().max(30).optional().or(z.literal('')),
    contenu: z.string().trim().max(200).optional().or(z.literal('')),
  })
  .strict();

export type DonneesAjouterTupperware = z.infer<typeof ajouterTupperwareSchema>;

export const marquerTupperwareRenduSchema = z
  .object({
    tupperware_id: z.string().uuid(),
  })
  .strict();

export type DonneesMarquerTupperwareRendu = z.infer<typeof marquerTupperwareRenduSchema>;
