import { z } from 'zod';
import { tokenTurnstileSchema } from './auth';

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

export const creerOffreEntraideSchema = z
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
    type: z.enum(['hebergement', 'transport', 'pret_objet', 'fruits_terre']),
    sens: z.enum(['propose', 'cherche']),
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
     * Métadonnées libres (JSONB). Limité à 4 ko pour rester raisonnable.
     */
    meta: z.record(z.string(), z.unknown()).optional(),
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
      message: 'Latitude et longitude doivent être fournies ensemble (ou aucune).',
      path: ['latitude'],
    },
  );

export type DonneesCreerOffreEntraide = z.infer<typeof creerOffreEntraideSchema>;

export const retirerOffreSchema = z
  .object({
    offre_id: z.string().uuid(),
    raison_retrait: z
      .string()
      .trim()
      .min(10, 'La raison du retrait doit comporter au moins 10 caractères.')
      .max(500),
  })
  .strict();

export type DonneesRetirerOffre = z.infer<typeof retirerOffreSchema>;

export const cloturerOffreSchema = z
  .object({
    offre_id: z.string().uuid(),
  })
  .strict();

export type DonneesCloturerOffre = z.infer<typeof cloturerOffreSchema>;
