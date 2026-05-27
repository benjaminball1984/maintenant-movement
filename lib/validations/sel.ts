import {
  MESSAGES_VALIDATION_SEL_DEFAUT,
  type MessagesValidationSel,
} from '@/lib/messages-validation';
import { z } from 'zod';

/**
 * Validations Zod du sous-espace SEL (chantier 4.2).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §6E` : services entre particulier·ères
 * (« service ») ou pour les collectifs (« volontariat »). PAS « travail ».
 * Conversion 1 minute = 1 99-coin.
 */

export function creerServiceSelFactory(
  messages: MessagesValidationSel = MESSAGES_VALIDATION_SEL_DEFAUT,
) {
  return z
    .object({
      titre: z.string().trim().min(5, messages.titreMin).max(200, messages.titreMax),
      description: z.string().trim().min(30, messages.descriptionMin).max(3000),
      categorie: z.enum(['service', 'volontariat']),
      sens: z.enum(['propose', 'cherche']),
      duree_minutes_estimee: z
        .number()
        .int(messages.dureeEntier)
        .min(15, messages.dureeMin)
        .max(480, messages.dureeMax),
      lieu: z.string().trim().min(3, messages.lieuRequis).max(200),
      latitude: z.number().min(-90).max(90).nullable().optional(),
      longitude: z.number().min(-180).max(180).nullable().optional(),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict()
    .refine(
      (d) => {
        const aLat = d.latitude !== null && d.latitude !== undefined;
        const aLng = d.longitude !== null && d.longitude !== undefined;
        return aLat === aLng;
      },
      { message: messages.latLngEnsemble, path: ['latitude'] },
    );
}
export const creerServiceSelSchema = creerServiceSelFactory();

export type DonneesCreerServiceSel = z.infer<typeof creerServiceSelSchema>;

// ============================================================
// Réservation d'une prestation
// ============================================================

/**
 * Quand quelqu'un·e clique « réserver ce service », on crée une
 * prestation `en_attente` avec les deux personnes. Selon le `sens` du
 * service (propose ou cherche), la personne qui réserve est prestataire
 * ou bénéficiaire.
 */
export function creerReserverPrestationSchema(
  messages: MessagesValidationSel = MESSAGES_VALIDATION_SEL_DEFAUT,
) {
  return z
    .object({
      service_id: z.string().uuid(),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict();
}
export const reserverPrestationSchema = creerReserverPrestationSchema();

export type DonneesReserverPrestation = z.infer<typeof reserverPrestationSchema>;

// ============================================================
// Déclaration de réalisation
// ============================================================

/**
 * Le prestataire déclare avoir réalisé la prestation, avec la durée
 * réelle. Démarre le compteur de modération 2 h.
 */
export function creerDeclarerRealiseeSchema(
  messages: MessagesValidationSel = MESSAGES_VALIDATION_SEL_DEFAUT,
) {
  return z
    .object({
      prestation_id: z.string().uuid(),
      duree_minutes_reelle: z
        .number()
        .int()
        .min(1, messages.dureeReelleMin)
        .max(480, messages.dureeReelleMax),
    })
    .strict();
}
export const declarerRealiseeSchema = creerDeclarerRealiseeSchema();

export type DonneesDeclarerRealisee = z.infer<typeof declarerRealiseeSchema>;

// ============================================================
// Contestation par le bénéficiaire
// ============================================================

export const contesterPrestationSchema = z
  .object({
    prestation_id: z.string().uuid(),
    raison: z.string().trim().min(10).max(1000),
  })
  .strict();

export type DonneesContesterPrestation = z.infer<typeof contesterPrestationSchema>;

// ============================================================
// Annulation avant exécution
// ============================================================

export const annulerPrestationSchema = z
  .object({
    prestation_id: z.string().uuid(),
  })
  .strict();

export type DonneesAnnulerPrestation = z.infer<typeof annulerPrestationSchema>;
