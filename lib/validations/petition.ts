import { z } from 'zod';
import { codePostalFrancaisSchema, tokenTurnstileSchema } from './auth';

/**
 * Schéma de signature d'une pétition (modale page d'accueil + page pétition).
 *
 * Cf. `01_ARCHITECTURE.md §3` (« Parcours pétition - modale ») :
 *   Nom, prénom, code postal, email, téléphone optionnel.
 *   Cases : newsletter + autorisation de contact par la personne créatrice.
 *
 * Signature **anonyme** (non connectée) autorisée : la modale ne requiert
 * pas d'authentification. Tag de la signature avec l'ID de la pétition
 * et l'origine pour la newsletter (taggage à 3 axes, cf. spec §10).
 */
export const signerPetitionSchema = z
  .object({
    petition_id: z.string().uuid('Identifiant de pétition invalide.'),
    nom: z.string().trim().min(1, 'Le nom est requis.').max(100),
    prenom: z.string().trim().min(1, 'Le prénom est requis.').max(100),
    email: z.string().trim().toLowerCase().email("Le format de l'email semble incorrect."),
    code_postal: codePostalFrancaisSchema,
    telephone: z
      .string()
      .trim()
      .regex(/^(\+33|0)[1-9](\d{2}){4}$/, 'Format de téléphone français invalide.')
      .optional()
      .or(z.literal('')),
    accepte_newsletter: z.boolean(),
    accepte_contact_createurice: z.boolean(),
    token_turnstile: tokenTurnstileSchema,
  })
  .strict();

export type DonneesSignerPetition = z.infer<typeof signerPetitionSchema>;
