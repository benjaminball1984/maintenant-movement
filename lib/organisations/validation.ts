import { z } from 'zod';

/**
 * Validation et taxonomie des organisations (épopée réseau V2, chantier B.1).
 *
 * La liste `TYPES_ORGANISATION` reflète exactement le CHECK SQL
 * `organisation_type_valide` (migration 20260601100000). Toute évolution doit
 * se faire des deux côtés.
 */

/** Types d'organisation (liste fermée + « autre »). */
export const TYPES_ORGANISATION = [
  'collectif',
  'association',
  'syndicat',
  'mouvement',
  'fondation',
  'ong',
  'cooperative',
  'entreprise',
  'groupe',
  'autre',
] as const;

export type TypeOrganisation = (typeof TYPES_ORGANISATION)[number];

/** Libellés humains des types (pour l'UI). */
export const LIBELLE_TYPE_ORGANISATION: Record<TypeOrganisation, string> = {
  collectif: 'Collectif',
  association: 'Association',
  syndicat: 'Syndicat',
  mouvement: 'Mouvement',
  fondation: 'Fondation',
  ong: 'ONG',
  cooperative: 'Coopérative',
  entreprise: 'Entreprise',
  groupe: 'Groupe',
  autre: 'Autre',
};

/**
 * Schéma de création d'une organisation. L'attestation sur l'honneur (case à
 * cocher) est obligatoire : la personne déclare être habilitée à représenter
 * l'organisation (anti-usurpation, le badge officiel reste accordé à part).
 */
export const creerOrganisationSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(2, 'Le nom doit faire au moins 2 caractères.')
    .max(120, 'Le nom est trop long (120 caractères maximum).'),
  type_organisation: z.enum(TYPES_ORGANISATION),
  description: z
    .string()
    .trim()
    .max(2000, 'La description est trop longue (2000 caractères maximum).')
    .optional()
    .or(z.literal('')),
  image_url: z
    .string()
    .trim()
    .url('Le lien de l’image semble invalide.')
    .max(2048)
    .optional()
    .or(z.literal('')),
  attestation: z.literal(true, {
    message: 'Tu dois attester être habilité·e à représenter cette organisation.',
  }),
});

export type DonneesCreerOrganisation = z.infer<typeof creerOrganisationSchema>;

/** Mise à jour de la page d'une organisation (gestionnaire ou admin). */
export const mettreAJourOrganisationSchema = z.object({
  id: z.string().uuid(),
  nom: z.string().trim().min(2, 'Le nom doit faire au moins 2 caractères.').max(120),
  type_organisation: z.enum(TYPES_ORGANISATION),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  image_url: z
    .string()
    .trim()
    .url('Le lien de l’image semble invalide.')
    .max(2048)
    .optional()
    .or(z.literal('')),
});

export type DonneesMettreAJourOrganisation = z.infer<typeof mettreAJourOrganisationSchema>;

/** Cooptation d'un·e gestionnaire par son numéro réseau M+7. */
export const coopterGestionnaireSchema = z.object({
  org_id: z.string().uuid(),
  numero: z
    .string()
    .trim()
    .regex(/^M[A-Z]{7}$/, 'Le numéro réseau doit ressembler à « MABCDEFG ».'),
});

export type DonneesCoopterGestionnaire = z.infer<typeof coopterGestionnaireSchema>;
