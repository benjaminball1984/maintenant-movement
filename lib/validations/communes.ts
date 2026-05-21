import { z } from 'zod';
import { tokenTurnstileSchema } from './auth';

/**
 * Validations Zod du sous-espace Communes libres + Fédérations +
 * Confédérations (chantier 5.2).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §7B`.
 */

// ============================================================
// Adhésion d'une personne à une commune (1 clic)
// ============================================================

export const rejoindreCommuneSchema = z
  .object({
    commune_id: z.string().uuid(),
    /**
     * `confirme` doit être true quand on est au palier 2 ou 3 (modale
     * de confirmation). Pour le palier 1 (1ère commune), peut rester
     * false. La Server Action enforce.
     */
    confirme: z.boolean().optional(),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesRejoindreCommune = z.infer<typeof rejoindreCommuneSchema>;

export const quitterCommuneSchema = z
  .object({
    commune_id: z.string().uuid(),
  })
  .strict();

export type DonneesQuitterCommune = z.infer<typeof quitterCommuneSchema>;

// ============================================================
// Création libre d'une commune (cf. spec §7B « commune libre
// d'Orgemont », exception à « pas de coquilles vides »).
// ============================================================

export const creerCommuneLibreSchema = z
  .object({
    nom: z
      .string()
      .trim()
      .min(3, 'Le nom doit comporter au moins 3 caractères.')
      .max(200, 'Le nom doit faire 200 caractères maximum.'),
    description_courte: z
      .string()
      .trim()
      .max(500, 'La description doit faire 500 caractères maximum.')
      .optional()
      .or(z.literal('')),
    /**
     * Code postal principal pour la géolocalisation. Pas obligatoire :
     * une « commune libre » peut être virtuelle (ex : ZAD itinérante,
     * quartier inter-communal). Cf. spec §7B « Territoires libres ».
     */
    code_postal_principal: z
      .string()
      .trim()
      .regex(/^\d{5}$/, 'Code postal invalide.')
      .optional()
      .or(z.literal('')),
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

export type DonneesCreerCommuneLibre = z.infer<typeof creerCommuneLibreSchema>;

// ============================================================
// Création d'une fédération (cf. spec §7B « fédération libre »).
// ============================================================

export const creerFederationSchema = z
  .object({
    nom: z
      .string()
      .trim()
      .min(3, 'Le nom doit comporter au moins 3 caractères.')
      .max(200, 'Le nom doit faire 200 caractères maximum.'),
    type: z.enum(['geographique', 'thematique', 'mixte']),
    description_courte: z.string().trim().max(500).optional().or(z.literal('')),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesCreerFederation = z.infer<typeof creerFederationSchema>;

// ============================================================
// Création d'une confédération.
// ============================================================

export const creerConfederationSchema = z
  .object({
    nom: z
      .string()
      .trim()
      .min(3, 'Le nom doit comporter au moins 3 caractères.')
      .max(200, 'Le nom doit faire 200 caractères maximum.'),
    description_courte: z.string().trim().max(500).optional().or(z.literal('')),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesCreerConfederation = z.infer<typeof creerConfederationSchema>;

// ============================================================
// Rattachement commune ↔ fédération (subsidiarité par accord mutuel).
// ============================================================

export const rattacherFederationSchema = z
  .object({
    commune_id: z.string().uuid(),
    federation_id: z.string().uuid(),
  })
  .strict();

export type DonneesRattacherFederation = z.infer<typeof rattacherFederationSchema>;

export const rattacherConfederationSchema = z
  .object({
    federation_id: z.string().uuid(),
    confederation_id: z.string().uuid(),
  })
  .strict();

export type DonneesRattacherConfederation = z.infer<typeof rattacherConfederationSchema>;

// ============================================================
// Tirage au sort Assemblée Confédérale.
// ============================================================

/**
 * Tire `nb_binomes` (généralement 1) binôme(s) parmi les candidat·es
 * éligibles pour une entité donnée. Réservée admin national.
 */
export const tirerAuSortAssembleeSchema = z
  .object({
    entite_type: z.enum(['commune', 'federation', 'confederation']),
    entite_id: z.string().uuid(),
    nb_binomes: z.number().int().min(1).max(10).default(1),
  })
  .strict();

export type DonneesTirerAuSortAssemblee = z.infer<typeof tirerAuSortAssembleeSchema>;
