import {
  MESSAGES_VALIDATION_MOBILISATION_DEFAUT,
  type MessagesValidationMobilisation,
} from '@/lib/messages-validation';
import { z } from 'zod';

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
export function creerMobilisationFactory(
  messages: MessagesValidationMobilisation = MESSAGES_VALIDATION_MOBILISATION_DEFAUT,
) {
  return (
    z
      .object({
        titre: z.string().trim().min(5, messages.titreMin).max(200, messages.titreMax),
        description: z
          .string()
          .trim()
          .min(50, messages.descriptionMin)
          .max(3000, messages.descriptionMax),
        /** V2.5.52 — version HTML riche optionnelle (sanitizée au save). */
        description_html: z.string().max(50000).optional().or(z.literal('')),
        lieu: z.string().trim().min(3, messages.lieuRequis).max(200, messages.lieuMax),
        latitude: z
          .number()
          .min(-90, messages.latitudeFormat)
          .max(90, messages.latitudeFormat)
          .nullable()
          .optional(),
        longitude: z
          .number()
          .min(-180, messages.longitudeFormat)
          .max(180, messages.longitudeFormat)
          .nullable()
          .optional(),
        image_url: z.string().url(messages.imageUrl).optional().or(z.literal('')),
        /**
         * Datetime ISO 8601 (string). On préfère un string côté Server Action
         * pour éviter les bizarreries de sérialisation Date<->JSON ; la
         * Server Action parse en `new Date(...)` au moment d'écrire.
         */
        date_debut: z.string().datetime({ message: messages.dateDebutFormat }),
        date_fin: z
          .string()
          .datetime({ message: messages.dateFinFormat })
          .optional()
          .or(z.literal('')),
        token_turnstile: z.string().min(1, messages.turnstileRequis),
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
          message: messages.latLngEnsemble,
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
          message: messages.dateCoherence,
          path: ['date_fin'],
        },
      )
  );
}
export const creerMobilisationSchema = creerMobilisationFactory();

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
export function creerParticiperMobilisationSchema(
  messages: MessagesValidationMobilisation = MESSAGES_VALIDATION_MOBILISATION_DEFAUT,
) {
  return z
    .object({
      mobilisation_id: z.string().uuid(messages.mobilisationUuid),
      code_postal: z
        .string()
        .trim()
        .regex(/^\d{5}$/, messages.codePostalFormat)
        .optional()
        .or(z.literal('')),
      accepte_notifications: z.boolean().default(false),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict();
}
export const participerMobilisationSchema = creerParticiperMobilisationSchema();

export type DonneesParticiperMobilisation = z.infer<typeof participerMobilisationSchema>;

// ============================================================
// Retrait a posteriori d'une mobilisation (modération)
// ============================================================

/**
 * Retrait par modé/admin ou par la créateurice elle-même. Raison
 * obligatoire (transparence + journalisation).
 */
export function creerRetirerMobilisationSchema(
  messages: MessagesValidationMobilisation = MESSAGES_VALIDATION_MOBILISATION_DEFAUT,
) {
  return z
    .object({
      mobilisation_id: z.string().uuid(),
      raison_retrait: z
        .string()
        .trim()
        .min(10, messages.retraitRaisonMin)
        .max(500, messages.retraitRaisonMax),
    })
    .strict();
}
export const retirerMobilisationSchema = creerRetirerMobilisationSchema();

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
