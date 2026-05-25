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
const raisonModeration = z
  .string()
  .trim()
  .min(10, 'Indique une raison d’au moins 10 caractères.')
  .max(500, '500 caractères maximum.');

export const retirerMomentSchema = z.object({
  moment_id: z.string().uuid('Moment invalide.'),
  raison: raisonModeration,
});
export type DonneesRetirerMoment = z.infer<typeof retirerMomentSchema>;

export const retirerSondageSchema = z.object({
  sondage_id: z.string().uuid('Sondage invalide.'),
  raison: raisonModeration,
});
export type DonneesRetirerSondage = z.infer<typeof retirerSondageSchema>;

export const retirerServiceSelSchema = z.object({
  service_id: z.string().uuid('Service invalide.'),
  raison: raisonModeration,
});
export type DonneesRetirerServiceSel = z.infer<typeof retirerServiceSelSchema>;

export const reafficherOrganisationSchema = z.object({
  organisation_id: z.string().uuid('Organisation invalide.'),
});
export type DonneesReafficherOrganisation = z.infer<typeof reafficherOrganisationSchema>;
