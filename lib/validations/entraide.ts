import {
  MESSAGES_VALIDATION_ENTRAIDE_DEFAUT,
  type MessagesValidationEntraide,
} from '@/lib/messages-validation';
import { z } from 'zod';

/**
 * Validations Zod du sous-espace S'entraider (chantier 4.1).
 *
 * 4 sous-espaces partagent le même modèle d'offre :
 *   - Hébergement solidaire (`/s-entraider/hebergement`)
 *   - Transport solidaire (`/s-entraider/transport`)
 *   - Qui prête tout (`/s-entraider/qui-prete-tout`)
 *   - Fruits de la terre (`/s-entraider/fruits-de-la-terre`)
 *
 * Modèle unifié sur la table `offre_entraide` polymorphe avec
 * `type` discriminant. Les `meta` JSONB stockent les champs spécifiques
 * à chaque type sans contrainte stricte côté Zod v1 (l'UI les saisit en
 * paires clé/valeur libres). Une validation stricte par type viendra
 * dans un chantier polish si nécessaire.
 */

export function creerOffreEntraideFactory(
  messages: MessagesValidationEntraide = MESSAGES_VALIDATION_ENTRAIDE_DEFAUT,
) {
  return z
    .object({
      titre: z.string().trim().min(5, messages.titreMin).max(200, messages.titreMax),
      description: z
        .string()
        .trim()
        .min(30, messages.descriptionMin)
        .max(3000, messages.descriptionMax),
      type: z.enum(['hebergement', 'transport', 'pret_objet', 'fruits_terre']),
      sens: z.enum(['propose', 'cherche']),
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
       * Métadonnées libres (JSONB). Limité à 4 ko pour rester raisonnable.
       */
      meta: z.record(z.string(), z.unknown()).optional(),
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
export const creerOffreEntraideSchema = creerOffreEntraideFactory();

export type DonneesCreerOffreEntraide = z.infer<typeof creerOffreEntraideSchema>;

export function creerRetirerOffreSchema(
  messages: MessagesValidationEntraide = MESSAGES_VALIDATION_ENTRAIDE_DEFAUT,
) {
  return z
    .object({
      offre_id: z.string().uuid(),
      raison_retrait: z.string().trim().min(10, messages.retraitRaisonMin).max(500),
    })
    .strict();
}
export const retirerOffreSchema = creerRetirerOffreSchema();

export type DonneesRetirerOffre = z.infer<typeof retirerOffreSchema>;

export const cloturerOffreSchema = z
  .object({
    offre_id: z.string().uuid(),
  })
  .strict();

export type DonneesCloturerOffre = z.infer<typeof cloturerOffreSchema>;
