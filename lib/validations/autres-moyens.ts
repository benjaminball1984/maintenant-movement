import { z } from 'zod';

/**
 * Validations Zod du sous-espace « D'autres moyens d'agir » (chantier 5.4).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §7D` : page sobre, liste de
 * redirections sans endossement. Ajout réservé admin / modérateurice
 * (présomption d'utilité), pas de soumission par les usager·ères.
 */

/**
 * Schéma de validation pour l'ajout d'une organisation partenaire à la
 * liste publique « D'autres moyens d'agir ».
 *
 * Champs :
 * - `nom` : nom officiel de l'organisation (3-200 caractères).
 * - `description_courte` : 0-500 caractères, présentation neutre.
 * - `url` : URL absolue valide vers le site officiel.
 * - `categorie_slug` : slug d'une catégorie existante (slug minuscule,
 *   chiffres et tirets).
 *
 * Action réservée admin / modérateurice (présomption d'utilité, pas
 * d'endossement politique).
 */
export const ajouterOrganisationPartenaireSchema = z
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
    url: z.string().trim().url('URL invalide.'),
    categorie_slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/, 'Slug de catégorie invalide.')
      .max(60)
      .optional()
      .or(z.literal('')),
  })
  .strict();

export type DonneesAjouterOrganisationPartenaire = z.infer<
  typeof ajouterOrganisationPartenaireSchema
>;

/**
 * Schéma de validation pour le retrait d'une organisation partenaire de
 * la liste publique. Une raison explicite (>= 10 caractères) est exigée
 * pour pouvoir tracer la décision en `journal_admin`.
 */
export const retirerOrganisationSchema = z
  .object({
    organisation_id: z.string().uuid(),
    raison_retrait: z
      .string()
      .trim()
      .min(10, 'La raison du retrait doit faire au moins 10 caractères.')
      .max(500),
  })
  .strict();

export type DonneesRetirerOrganisation = z.infer<typeof retirerOrganisationSchema>;
