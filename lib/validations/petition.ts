import {
  MESSAGES_VALIDATION_PETITION_DEFAUT,
  type MessagesValidationPetition,
} from '@/lib/messages-validation';
import { estUrlImageDurable } from '@/lib/validation-url';
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
 *
 * V2.6.134 — On peut désormais signer **au nom d'une organisation**. Les
 * champs d'identité de la personne restent demandés dans les deux cas :
 * une organisation signe toujours par la main de quelqu'un·e, et c'est cette
 * personne qu'on recontacte. S'ajoutent alors le nom de l'organisation, sa
 * famille, son territoire et la fonction de la personne signataire.
 */

/**
 * Les quatre familles d'organisations nommées par l'appel lui-même
 * (« ouvert à la signature des assemblées, collectifs, syndicats et
 * organisations »). Sert à la fois au schéma Zod, au `<select>` de la
 * modale et à la contrainte SQL `signature_type_coherent`.
 */
export const CATEGORIES_ORGANISATION = [
  'assemblee',
  'collectif',
  'syndicat',
  'organisation',
] as const;

export type CategorieOrganisation = (typeof CATEGORIES_ORGANISATION)[number];

/** Libellés affichés des familles d'organisations, dans l'ordre du texte. */
export const LIBELLES_CATEGORIE_ORGANISATION: Record<CategorieOrganisation, string> = {
  assemblee: 'Assemblée',
  collectif: 'Collectif',
  syndicat: 'Syndicat',
  organisation: 'Organisation',
};

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

      // --- Signature au nom d'une organisation (V2.6.134) ---------------
      // Champ optionnel plutôt que `.default()` : une signature qui ne
      // l'envoie pas se comporte exactement comme avant (individu), et le
      // schéma garde le même type en entrée et en sortie — react-hook-form
      // exige cette symétrie.
      type_signataire: z
        .enum(['individu', 'organisation'], messages.typeSignataireInvalide)
        .optional(),
      organisation_nom: z.string().trim().max(200, messages.organisationNomMax).optional(),
      // Chaîne vide tolérée : c'est la valeur du `<select>` tant que rien
      // n'est choisi. Le `superRefine` ci-dessous la refuse pour une
      // organisation, avec un message clair.
      organisation_categorie: z.enum(CATEGORIES_ORGANISATION).optional().or(z.literal('')),
      organisation_territoire: z
        .string()
        .trim()
        .max(120, messages.organisationTerritoireMax)
        .optional(),
      signataire_fonction: z.string().trim().max(120, messages.signataireFonctionMax).optional(),
      // Absent = affichage accepté : c'est le sens d'une co-signature, et la
      // case est cochée d'office dans la modale.
      organisation_affichage_public: z.boolean().optional(),

      token_turnstile: z.string().min(1, messages.turnstileRequis),
    })
    .strict()
    .superRefine((donnees, ctx) => {
      if (donnees.type_signataire !== 'organisation') return;

      if (donnees.organisation_nom === undefined || donnees.organisation_nom === '') {
        ctx.addIssue({
          code: 'custom',
          message: messages.organisationNomRequis,
          path: ['organisation_nom'],
        });
      }
      if (donnees.organisation_categorie === undefined || donnees.organisation_categorie === '') {
        ctx.addIssue({
          code: 'custom',
          message: messages.organisationCategorieRequise,
          path: ['organisation_categorie'],
        });
      }
    });
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
    /** V2.5.53 : version HTML riche optionnelle (sanitizée au save). */
    texte_html: z.string().max(50000).optional().or(z.literal('')),
    destinataire: z
      .string()
      .trim()
      .min(5, messages.destinataireMin)
      .max(200, messages.destinataireMax),
    // Refus des CDN éphémères (Facebook/Instagram) : ces liens signés
    // expirent en quelques jours, l'image casserait silencieusement.
    image_url: z
      .string()
      .url(messages.imageUrl)
      .refine(estUrlImageDurable, messages.imageUrlEphemere)
      .optional()
      .or(z.literal('')),
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
