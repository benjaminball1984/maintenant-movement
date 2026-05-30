import {
  MESSAGES_VALIDATION_PETITION_DEFAUT,
  type MessagesValidationPetition,
} from '@/lib/messages-validation';
import { z } from 'zod';

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
export function creerSignerPetitionSchema(
  messages: MessagesValidationPetition = MESSAGES_VALIDATION_PETITION_DEFAUT,
) {
  return z
    .object({
      petition_id: z.string().uuid(messages.petitionUuidInvalide),
      nom: z.string().trim().min(1, messages.nomRequis).max(100),
      prenom: z.string().trim().min(1, messages.prenomRequis).max(100),
      email: z.string().trim().toLowerCase().email(messages.emailFormat),
      code_postal: z
        .string()
        .trim()
        .regex(/^\d{5}$/, messages.codePostalFormat),
      telephone: z
        .string()
        .trim()
        .regex(/^(\+33|0)[1-9](\d{2}){4}$/, messages.telephoneFormat)
        .optional()
        .or(z.literal('')),
      accepte_newsletter: z.boolean(),
      accepte_contact_createurice: z.boolean(),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict();
}
export const signerPetitionSchema = creerSignerPetitionSchema();

export type DonneesSignerPetition = z.infer<typeof signerPetitionSchema>;

// ============================================================
// Création de pétition (auth requise + modération a priori)
// ============================================================

/**
 * Champs collectés à la création d'une pétition (cf. spec §5A) :
 *   titre, image (URL), texte, destinataire, objectif chiffré.
 *
 * Le slug est dérivé du titre côté serveur (Server Action). La
 * créatrice est la personne authentifiée (`auth.uid()`). Le statut
 * initial est forcé à `en_moderation`.
 *
 * Limites :
 *   - titre 5-200 chars (court mais explicite)
 *   - texte 100-10000 chars (argumentaire substantiel)
 *   - destinataire 5-200 chars (institution, élu·e, entreprise...)
 *   - objectif 100 à 1 000 000 signataires (pas de pétition d'1 signature ou trop pharaonique)
 */
/**
 * Champs de contenu communs à la création et à l'édition d'une pétition.
 * Extraits ici pour rester DRY : un seul endroit définit les règles de
 * titre / texte / destinataire / image / objectif.
 */
function champsContenuPetition(messages: MessagesValidationPetition) {
  return {
    titre: z.string().trim().min(5, messages.titreMin).max(200, messages.titreMax),
    texte: z.string().trim().min(100, messages.texteMin).max(10000, messages.texteMax),
    /** V2.5.53 — version HTML riche optionnelle (sanitizée au save). */
    texte_html: z.string().max(50000).optional().or(z.literal('')),
    destinataire: z
      .string()
      .trim()
      .min(5, messages.destinataireMin)
      .max(200, messages.destinataireMax),
    image_url: z.string().url(messages.imageUrl).optional().or(z.literal('')),
    objectif: z
      .number()
      .int(messages.objectifEntier)
      .min(100, messages.objectifMin)
      .max(10_000_000, messages.objectifMax),
  } as const;
}

export function creerPetitionFactory(
  messages: MessagesValidationPetition = MESSAGES_VALIDATION_PETITION_DEFAUT,
) {
  return z
    .object({
      ...champsContenuPetition(messages),
      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict();
}
export const creerPetitionSchema = creerPetitionFactory();

export type DonneesCreerPetition = z.infer<typeof creerPetitionSchema>;

// ============================================================
// Édition d'une pétition par l'équipe (admin / modération)
// ============================================================

/**
 * Date optionnelle au format `AAAA-MM-JJ` (input HTML `type="date"`), ou
 * chaîne vide pour « pas de date ». La Server Action convertit la chaîne
 * vide en `null` avant l'écriture en base.
 */
function dateOptionnelleSchema(messages: MessagesValidationPetition) {
  return z.string().date(messages.dateFormat).or(z.literal('')).optional();
}

/**
 * Édition complète d'une pétition par l'équipe : tout le contenu, plus les
 * deux dates métier (lancement et échéance, cf. migration 035).
 *
 * Pas de Turnstile ici : l'action est réservée aux personnes déjà
 * authentifiées ET porteuses d'un droit admin/modération (vérifié côté
 * Server Action + RLS). La cohérence des dates (échéance >= lancement)
 * reflète la contrainte SQL `petition_dates_coherentes`, pour offrir un
 * message clair avant même de toucher la base.
 */
export function creerEditerPetitionSchema(
  messages: MessagesValidationPetition = MESSAGES_VALIDATION_PETITION_DEFAUT,
) {
  return z
    .object({
      petition_id: z.string().uuid(),
      ...champsContenuPetition(messages),
      date_lancement: dateOptionnelleSchema(messages),
      date_echeance: dateOptionnelleSchema(messages),
    })
    .strict()
    .refine(
      (data) =>
        !data.date_lancement || !data.date_echeance || data.date_echeance >= data.date_lancement,
      {
        message: messages.dateCoherence,
        path: ['date_echeance'],
      },
    );
}
export const editerPetitionSchema = creerEditerPetitionSchema();

export type DonneesEditerPetition = z.infer<typeof editerPetitionSchema>;

// ============================================================
// Modération a priori
// ============================================================

/**
 * Action de modération sur une pétition `en_moderation`.
 *
 * Si `decision = 'rejetee'`, `raison_rejet` est requise (transparence
 * envers la créatrice). Sinon, raison_rejet est ignorée.
 */
export function creerModererPetitionSchema(
  messages: MessagesValidationPetition = MESSAGES_VALIDATION_PETITION_DEFAUT,
) {
  return z
    .object({
      petition_id: z.string().uuid(),
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
export const modererPetitionSchema = creerModererPetitionSchema();

export type DonneesModererPetition = z.infer<typeof modererPetitionSchema>;

// ============================================================
// Helper : génère un slug URL-safe depuis un titre.
//
// Pose le slug initial. La Server Action vérifiera l'unicité et
// suffixera avec un compteur (`-2`, `-3`...) si collision.
// ============================================================

/**
 * Plage Unicode des diacritiques combinants (U+0300 à U+036F).
 * Écrite via `String.fromCodePoint` puis recombinée en regex pour
 * éviter d'écrire des combining marks bruts dans la source (Biome
 * `noMisleadingCharacterClass` les refuse) tout en restant lisible.
 */
const REGEX_DIACRITIQUES = new RegExp(
  `[${String.fromCodePoint(0x0300)}-${String.fromCodePoint(0x036f)}]`,
  'g',
);

export function slugifierTitre(titre: string): string {
  return titre
    .normalize('NFD')
    .replace(REGEX_DIACRITIQUES, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
