import { z } from 'zod';

/**
 * Schémas de validation du réseau social (chantier 7.5).
 *
 * Cf. docs/specs/01_ARCHITECTURE.md §4E. Les tailles correspondent aux
 * contraintes SQL de la migration 039 (post 5000, commentaire 2000,
 * message 5000).
 */

/** Création d'une publication. Turnstile comme pour les autres créations de contenu. */
export const creerPostSchema = z.object({
  texte: z
    .string()
    .trim()
    .min(1, 'Écris quelque chose avant de publier.')
    .max(5000, 'Une publication fait au maximum 5000 caractères.'),
  image_url: z
    .string()
    .trim()
    .url('Le lien de l’image semble incorrect.')
    .max(2048)
    .optional()
    .or(z.literal('')),
  token_turnstile: z.string().min(1, 'Vérification anti-bot manquante.'),
});
export type DonneesCreerPost = z.infer<typeof creerPostSchema>;

/** Ajout d'un commentaire sous une publication (personne connectée). */
export const creerCommentaireSchema = z.object({
  post_id: z.string().uuid('Publication invalide.'),
  texte: z
    .string()
    .trim()
    .min(1, 'Le commentaire est vide.')
    .max(2000, 'Un commentaire fait au maximum 2000 caractères.'),
});
export type DonneesCreerCommentaire = z.infer<typeof creerCommentaireSchema>;

/** Envoi d'un message direct (messagerie interne). */
export const envoyerMessageSchema = z.object({
  destinataire_id: z.string().uuid('Destinataire invalide.'),
  texte: z
    .string()
    .trim()
    .min(1, 'Le message est vide.')
    .max(5000, 'Un message fait au maximum 5000 caractères.'),
});
export type DonneesEnvoyerMessage = z.infer<typeof envoyerMessageSchema>;

/** Action sur une cible identifiée par UUID (suivre, soutenir, retirer). */
export const cibleUuidSchema = z.object({
  cible_id: z.string().uuid('Identifiant invalide.'),
});
export type DonneesCibleUuid = z.infer<typeof cibleUuidSchema>;

/** Retrait de modération (a posteriori) : cible + motif obligatoire. */
export const retraitReseauSchema = z.object({
  cible_id: z.string().uuid('Identifiant invalide.'),
  raison: z
    .string()
    .trim()
    .min(10, 'Le motif de retrait doit faire au moins 10 caractères.')
    .max(500, 'Le motif est trop long.'),
});
export type DonneesRetraitReseau = z.infer<typeof retraitReseauSchema>;
