import {
  MESSAGES_VALIDATION_AUTRES_MOYENS_DEFAUT,
  type MessagesValidationAutresMoyens,
} from '@/lib/messages-validation';
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
 */
export function creerAjouterOrganisationPartenaireSchema(
  messages: MessagesValidationAutresMoyens = MESSAGES_VALIDATION_AUTRES_MOYENS_DEFAUT,
) {
  return z
    .object({
      nom: z.string().trim().min(3, messages.nomMin).max(200, messages.nomMax),
      description_courte: z
        .string()
        .trim()
        .max(500, messages.descriptionMax)
        .optional()
        .or(z.literal('')),
      url: z.string().trim().url(messages.urlInvalide),
      categorie_slug: z
        .string()
        .trim()
        .regex(/^[a-z0-9-]+$/, messages.categorieSlugInvalide)
        .max(60)
        .optional()
        .or(z.literal('')),
    })
    .strict();
}
export const ajouterOrganisationPartenaireSchema = creerAjouterOrganisationPartenaireSchema();

export type DonneesAjouterOrganisationPartenaire = z.infer<
  typeof ajouterOrganisationPartenaireSchema
>;

/**
 * Schéma de validation pour le retrait d'une organisation partenaire de
 * la liste publique. Une raison explicite (>= 10 caractères) est exigée
 * pour pouvoir tracer la décision en `journal_admin`.
 */
export function creerRetirerOrganisationSchema(
  messages: MessagesValidationAutresMoyens = MESSAGES_VALIDATION_AUTRES_MOYENS_DEFAUT,
) {
  return z
    .object({
      organisation_id: z.string().uuid(),
      raison_retrait: z.string().trim().min(10, messages.retraitRaisonMin).max(500),
    })
    .strict();
}
export const retirerOrganisationSchema = creerRetirerOrganisationSchema();

export type DonneesRetirerOrganisation = z.infer<typeof retirerOrganisationSchema>;
