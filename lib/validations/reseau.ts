import {
  MESSAGES_VALIDATION_RESEAU_DEFAUT,
  type MessagesValidationReseau,
} from '@/lib/messages-validation';
import { z } from 'zod';

/**
 * Schémas de validation du réseau social (chantier 7.5).
 *
 * Cf. docs/specs/01_ARCHITECTURE.md §4E. Les tailles correspondent aux
 * contraintes SQL de la migration 039 (post 5000, commentaire 2000,
 * message 5000).
 */

/** Création d'une publication. Turnstile comme pour les autres créations de contenu. */
export function creerPostFactory(
  messages: MessagesValidationReseau = MESSAGES_VALIDATION_RESEAU_DEFAUT,
) {
  return z.object({
    texte: z.string().trim().min(1, messages.postTexteMin).max(5000, messages.postTexteMax),
    image_url: z.string().trim().url(messages.postImageUrl).max(2048).optional().or(z.literal('')),
    token_turnstile: z.string().min(1, messages.postTurnstileRequis),
  });
}
export const creerPostSchema = creerPostFactory();
export type DonneesCreerPost = z.infer<typeof creerPostSchema>;

/** Ajout d'un commentaire sous une publication (personne connectée). */
export function creerCommentaireFactory(
  messages: MessagesValidationReseau = MESSAGES_VALIDATION_RESEAU_DEFAUT,
) {
  return z.object({
    post_id: z.string().uuid(messages.publicationUuid),
    texte: z.string().trim().min(1, messages.commentaireMin).max(2000, messages.commentaireMax),
  });
}
export const creerCommentaireSchema = creerCommentaireFactory();
export type DonneesCreerCommentaire = z.infer<typeof creerCommentaireSchema>;

/** Envoi d'un message direct (messagerie interne). */
export function creerEnvoyerMessageSchema(
  messages: MessagesValidationReseau = MESSAGES_VALIDATION_RESEAU_DEFAUT,
) {
  return z.object({
    destinataire_id: z.string().uuid(messages.destinataireUuid),
    texte: z.string().trim().min(1, messages.messageMin).max(5000, messages.messageMax),
  });
}
export const envoyerMessageSchema = creerEnvoyerMessageSchema();
export type DonneesEnvoyerMessage = z.infer<typeof envoyerMessageSchema>;

/** Action sur une cible identifiée par UUID (suivre, soutenir, retirer). */
export function creerCibleUuidSchema(
  messages: MessagesValidationReseau = MESSAGES_VALIDATION_RESEAU_DEFAUT,
) {
  return z.object({
    cible_id: z.string().uuid(messages.cibleUuid),
  });
}
export const cibleUuidSchema = creerCibleUuidSchema();
export type DonneesCibleUuid = z.infer<typeof cibleUuidSchema>;

/** Action sur une ligne d'amitié identifiée par UUID (accepter, refuser, retirer). */
export function creerAmitieIdSchema(
  messages: MessagesValidationReseau = MESSAGES_VALIDATION_RESEAU_DEFAUT,
) {
  return z.object({
    amitie_id: z.string().uuid(messages.cibleUuid),
  });
}
export const amitieIdSchema = creerAmitieIdSchema();
export type DonneesAmitieId = z.infer<typeof amitieIdSchema>;

/** Retrait de modération (a posteriori) : cible + motif obligatoire. */
export function creerRetraitReseauSchema(
  messages: MessagesValidationReseau = MESSAGES_VALIDATION_RESEAU_DEFAUT,
) {
  return z.object({
    cible_id: z.string().uuid(messages.cibleUuid),
    raison: z
      .string()
      .trim()
      .min(10, messages.retraitRaisonMin)
      .max(500, messages.retraitRaisonMax),
  });
}
export const retraitReseauSchema = creerRetraitReseauSchema();
export type DonneesRetraitReseau = z.infer<typeof retraitReseauSchema>;
