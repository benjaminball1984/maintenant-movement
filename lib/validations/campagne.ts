import {
  MESSAGES_VALIDATION_CAMPAGNE_DEFAUT,
  type MessagesValidationCampagne,
} from '@/lib/messages-validation';
import { z } from 'zod';

/**
 * Validations Zod du sous-espace Campagnes (chantier 3.2).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §5B` :
 *   - Modération a priori (calque du flux Pétitions).
 *   - Modules combinables : pétition + mobilisation + cagnotte + sondage
 *     + page éditoriale (cf. migration 017 `module_campagne`).
 */

// ============================================================
// Création d'une campagne (auth requise + modération a priori)
// ============================================================

/**
 * Schéma de création d'une campagne (auth requise).
 *
 * Champs :
 * - `titre` : 5-200 caractères, devient base du slug public.
 * - `texte` : 100-5000 caractères, contenu narratif de la campagne.
 * - `image_url` : URL absolue optionnelle d'une image de bandeau.
 * - `token_turnstile` : preuve anti-bot Cloudflare.
 *
 * Flux : statut initial `en_attente`, modération a priori, publication
 * uniquement après décision admin (cf. schéma `modererCampagneSchema`).
 */
export function creerCampagneFactory(
  messages: MessagesValidationCampagne = MESSAGES_VALIDATION_CAMPAGNE_DEFAUT,
) {
  return z
    .object({
      titre: z.string().trim().min(5, messages.titreMin).max(200, messages.titreMax),
      texte: z.string().trim().min(100, messages.texteMin).max(5000, messages.texteMax),
      image_url: z.string().url(messages.imageUrl).optional().or(z.literal('')),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict();
}
export const creerCampagneSchema = creerCampagneFactory();

export type DonneesCreerCampagne = z.infer<typeof creerCampagneSchema>;

// ============================================================
// Modération a priori (publier | rejeter)
// ============================================================

/**
 * Schéma de modération a priori d'une campagne (réservé admin).
 *
 * Champs :
 * - `campagne_id` : UUID de la campagne à statuer.
 * - `decision` : `publiee` (visible publiquement) ou `rejetee` (archivée).
 * - `raison_rejet` : exigée si `decision === 'rejetee'`, minimum 10
 *   caractères pour journalisation en `journal_admin`.
 */
export function creerModererCampagneSchema(
  messages: MessagesValidationCampagne = MESSAGES_VALIDATION_CAMPAGNE_DEFAUT,
) {
  return z
    .object({
      campagne_id: z.string().uuid(),
      decision: z.enum(['publiee', 'rejetee']),
      raison_rejet: z.string().trim().max(500).optional(),
    })
    .strict()
    .refine(
      (data) =>
        data.decision !== 'rejetee' ||
        (data.raison_rejet !== undefined && data.raison_rejet.length >= 10),
      {
        message: messages.raisonRejetRequise,
        path: ['raison_rejet'],
      },
    );
}
export const modererCampagneSchema = creerModererCampagneSchema();

export type DonneesModererCampagne = z.infer<typeof modererCampagneSchema>;

// ============================================================
// Attachement d'un module à une campagne
// ============================================================

/**
 * Deux formes possibles selon `type_module` :
 *   - 'page_editoriale'  → `contenu_editorial` requis, `cible_id` absent.
 *   - autres types       → `cible_id` UUID requis, `contenu_editorial` absent.
 *
 * Le DB enforce la même cohérence via la contrainte CHECK `module_payload_coherent`.
 */
export function creerAttacherModuleSchema(
  messages: MessagesValidationCampagne = MESSAGES_VALIDATION_CAMPAGNE_DEFAUT,
) {
  return z
    .object({
      campagne_id: z.string().uuid(),
      type_module: z.enum(['petition', 'mobilisation', 'cagnotte', 'sondage', 'page_editoriale']),
      cible_id: z.string().uuid().optional(),
      contenu_editorial: z.string().trim().max(10_000).optional(),
      ordre: z.number().int().min(1).max(50).default(1),
    })
    .strict()
    .refine(
      (d) => {
        if (d.type_module === 'page_editoriale') {
          return (
            d.contenu_editorial !== undefined &&
            d.contenu_editorial.length >= 20 &&
            d.cible_id === undefined
          );
        }
        return d.cible_id !== undefined && d.contenu_editorial === undefined;
      },
      {
        message: messages.modulePayloadIncoherent,
        path: ['type_module'],
      },
    );
}
export const attacherModuleSchema = creerAttacherModuleSchema();

export type DonneesAttacherModule = z.infer<typeof attacherModuleSchema>;

// ============================================================
// Détachement d'un module
// ============================================================

/**
 * Schéma de détachement d'un module d'une campagne. Action réservée à
 * la créatrice ou à un·e admin (l'autorisation est vérifiée côté Server
 * Action, pas dans le schéma).
 */
export const detacherModuleSchema = z
  .object({
    module_id: z.string().uuid(),
  })
  .strict();

export type DonneesDetacherModule = z.infer<typeof detacherModuleSchema>;
