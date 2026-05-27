import {
  MESSAGES_VALIDATION_MODERATION_DEFAUT,
  type MessagesValidationModeration,
} from '@/lib/messages-validation';
import { z } from 'zod';

/**
 * Schémas des actions de modération admin ajoutées au chantier 13.2
 * (« modération active »). Centralise les entités qui n'avaient pas encore
 * d'action de modération côté admin : Moments, Sondages, services SEL, et
 * le réaffichage d'une organisation partenaire.
 *
 * Le retrait demande toujours une raison (tracée dans `journal_admin`,
 * voire dans une colonne dédiée quand l'entité en a une).
 */

/** Raison de modération commune : 10 à 500 caractères. */
function raisonModeration(messages: MessagesValidationModeration) {
  return z.string().trim().min(10, messages.raisonMin).max(500, messages.raisonMax);
}

export function creerRetirerMomentSchema(
  messages: MessagesValidationModeration = MESSAGES_VALIDATION_MODERATION_DEFAUT,
) {
  return z.object({
    moment_id: z.string().uuid(messages.momentUuid),
    raison: raisonModeration(messages),
  });
}
export const retirerMomentSchema = creerRetirerMomentSchema();
export type DonneesRetirerMoment = z.infer<typeof retirerMomentSchema>;

export function creerRetirerSondageSchema(
  messages: MessagesValidationModeration = MESSAGES_VALIDATION_MODERATION_DEFAUT,
) {
  return z.object({
    sondage_id: z.string().uuid(messages.sondageUuid),
    raison: raisonModeration(messages),
  });
}
export const retirerSondageSchema = creerRetirerSondageSchema();
export type DonneesRetirerSondage = z.infer<typeof retirerSondageSchema>;

export function creerRetirerServiceSelSchema(
  messages: MessagesValidationModeration = MESSAGES_VALIDATION_MODERATION_DEFAUT,
) {
  return z.object({
    service_id: z.string().uuid(messages.serviceUuid),
    raison: raisonModeration(messages),
  });
}
export const retirerServiceSelSchema = creerRetirerServiceSelSchema();
export type DonneesRetirerServiceSel = z.infer<typeof retirerServiceSelSchema>;

export function creerReafficherOrganisationSchema(
  messages: MessagesValidationModeration = MESSAGES_VALIDATION_MODERATION_DEFAUT,
) {
  return z.object({
    organisation_id: z.string().uuid(messages.organisationUuid),
  });
}
export const reafficherOrganisationSchema = creerReafficherOrganisationSchema();
export type DonneesReafficherOrganisation = z.infer<typeof reafficherOrganisationSchema>;
