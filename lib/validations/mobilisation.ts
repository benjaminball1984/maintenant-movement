import { z } from 'zod';
import { codePostalFrancaisSchema, tokenTurnstileSchema } from './auth';

/**
 * Validations Zod du sous-espace Mobilisations (chantier 3.2).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §5C` :
 *   - Modération a posteriori (publication immédiate).
 *   - Géolocalisé (lieu en libellé + lat/lng optionnels).
 *   - « Je participe » d'un clic, anonyme par défaut.
 */

// ============================================================
// Création d'une mobilisation (auth requise)
// ============================================================

/**
 * Limites :
 *   - titre 5-200 chars
 *   - description 50-3000 chars (concis : la mobilisation tient en une page)
 *   - lieu 3-200 chars (libellé humain, ex : « Place de la République »)
 *   - latitude/longitude optionnels (couple : les deux ou aucun)
 *   - date_debut requis, date_fin optionnel (>= date_debut)
 */
export const creerMobilisationSchema = z
  .object({
    titre: z
      .string()
      .trim()
      .min(5, 'Le titre doit comporter au moins 5 caractères.')
      .max(200, 'Le titre doit faire 200 caractères maximum.'),
    description: z
      .string()
      .trim()
      .min(50, 'La description doit comporter au moins 50 caractères.')
      .max(3000, 'La description doit faire 3000 caractères maximum.'),
    lieu: z
      .string()
      .trim()
      .min(3, 'Le lieu est requis.')
      .max(200, 'Le lieu doit faire 200 caractères maximum.'),
    latitude: z
      .number()
      .min(-90, 'Latitude invalide.')
      .max(90, 'Latitude invalide.')
      .nullable()
      .optional(),
    longitude: z
      .number()
      .min(-180, 'Longitude invalide.')
      .max(180, 'Longitude invalide.')
      .nullable()
      .optional(),
    image_url: z.string().url("URL d'image invalide.").optional().or(z.literal('')),
    /**
     * Datetime ISO 8601 (string). On préfère un string côté Server Action
     * pour éviter les bizarreries de sérialisation Date<->JSON ; la
     * Server Action parse en `new Date(...)` au moment d'écrire.
     */
    date_debut: z
      .string()
      .datetime({ message: 'Date de début invalide (format ISO 8601 attendu).' }),
    date_fin: z
      .string()
      .datetime({ message: 'Date de fin invalide (format ISO 8601 attendu).' })
      .optional()
      .or(z.literal('')),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict()
  // Cohérence géo : couple complet ou rien.
  .refine(
    (d) => {
      const aLat = d.latitude !== null && d.latitude !== undefined;
      const aLng = d.longitude !== null && d.longitude !== undefined;
      return aLat === aLng;
    },
    {
      message: 'Latitude et longitude doivent être fournies ensemble (ou aucune).',
      path: ['latitude'],
    },
  )
  // Cohérence calendrier : date_fin >= date_debut quand fournie.
  .refine(
    (d) => {
      if (d.date_fin === undefined || d.date_fin === '') return true;
      return new Date(d.date_fin).getTime() >= new Date(d.date_debut).getTime();
    },
    {
      message: 'La date de fin doit être postérieure ou égale à la date de début.',
      path: ['date_fin'],
    },
  );

export type DonneesCreerMobilisation = z.infer<typeof creerMobilisationSchema>;

// ============================================================
// Participation à une mobilisation (« je participe »)
// ============================================================

/**
 * Le clic « je participe » est volontairement minimaliste : le code
 * postal et l'accord notifications sont optionnels (spec §12 :
 * « code postal obligatoire sur tout formulaire SAUF le clic je
 * participe sur une mobilisation »).
 */
export const participerMobilisationSchema = z
  .object({
    mobilisation_id: z.string().uuid('Identifiant de mobilisation invalide.'),
    code_postal: codePostalFrancaisSchema.optional().or(z.literal('')),
    accepte_notifications: z.boolean().default(false),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesParticiperMobilisation = z.infer<typeof participerMobilisationSchema>;

// ============================================================
// Retrait a posteriori d'une mobilisation (modération)
// ============================================================

/**
 * Retrait par modé/admin ou par la créateurice elle-même. Raison
 * obligatoire (transparence + journalisation).
 */
export const retirerMobilisationSchema = z
  .object({
    mobilisation_id: z.string().uuid(),
    raison_retrait: z
      .string()
      .trim()
      .min(10, 'La raison du retrait doit comporter au moins 10 caractères.')
      .max(500, 'La raison du retrait doit faire 500 caractères maximum.'),
  })
  .strict();

export type DonneesRetirerMobilisation = z.infer<typeof retirerMobilisationSchema>;

// ============================================================
// Helper : slug URL-safe depuis un titre.
//
// Ré-utilise la même fonction que `petition` (cf. ADR : convention de
// slug uniforme entre entités). On l'expose ici pour ne pas créer de
// cycle d'import croisé entre validations.
// ============================================================

const REGEX_DIACRITIQUES = new RegExp(
  `[${String.fromCodePoint(0x0300)}-${String.fromCodePoint(0x036f)}]`,
  'g',
);

export function slugifierTitreMobilisation(titre: string): string {
  return titre
    .normalize('NFD')
    .replace(REGEX_DIACRITIQUES, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
