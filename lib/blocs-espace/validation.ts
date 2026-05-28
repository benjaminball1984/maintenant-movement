/**
 * Validation Zod des contenus de bloc personnalisable (V2.5.5).
 *
 * Le schéma SQL stocke `contenu_json jsonb` sans typage strict côté
 * Postgres. Toute la validation se fait côté applicatif au moment
 * d'écrire (Server Action) ou de lire (helper `decoder`).
 *
 * Si la lecture retombe sur un contenu mal formé (par exemple à cause
 * d'une migration ratée ou d'un INSERT manuel), `decoderBloc` renvoie
 * `null` plutôt que de planter le rendu. Le bloc fautif est ignoré
 * silencieusement (loggué côté serveur pour signalement).
 */

import { z } from 'zod';
import type { BlocEspaceDecode, TypeBloc } from './types';

const URL_VALIDE = z
  .string()
  .min(1, "L'URL est requise")
  .max(500, "L'URL est trop longue (max 500 caractères)")
  .refine(
    (s) => /^https?:\/\//.test(s) || s.startsWith('/'),
    "L'URL doit commencer par http(s):// ou / pour un lien interne",
  );

export const SchemaContenuTexte = z.object({
  texte: z
    .string()
    .min(1, 'Le texte est requis')
    .max(5000, 'Le texte est trop long (max 5000 caractères)'),
});

export const SchemaContenuImage = z.object({
  url: URL_VALIDE,
  alt: z
    .string()
    .min(1, 'Le texte alternatif est requis (accessibilité)')
    .max(300, 'Le texte alternatif est trop long (max 300 caractères)'),
  legende: z.string().max(500).optional(),
});

export const SchemaContenuLien = z.object({
  url: URL_VALIDE,
  libelle: z
    .string()
    .min(1, 'Le libellé du lien est requis')
    .max(200, 'Le libellé est trop long (max 200 caractères)'),
  externe: z.boolean().optional(),
});

export const SchemaContenuBouton = z.object({
  url: URL_VALIDE,
  libelle: z
    .string()
    .min(1, 'Le libellé du bouton est requis')
    .max(80, 'Le libellé est trop long (max 80 caractères)'),
  variante: z.enum(['primary', 'ghost', 'outline']).optional(),
});

const SCHEMA_PAR_TYPE = {
  texte: SchemaContenuTexte,
  image: SchemaContenuImage,
  lien: SchemaContenuLien,
  bouton: SchemaContenuBouton,
} as const;

/**
 * Valide qu'un type de bloc est l'un des 4 supportés. Garde-fou pour
 * `decoderBloc` et pour la Server Action de création.
 */
export function estTypeBloc(s: unknown): s is TypeBloc {
  return s === 'texte' || s === 'image' || s === 'lien' || s === 'bouton';
}

/**
 * Décode (en union typée) une ligne `bloc_espace` brute lue de la base.
 * Renvoie `null` si le type est inconnu ou le contenu mal formé : le
 * bloc fautif sera ignoré au rendu.
 */
export function decoderBloc(ligne: {
  type: string;
  contenu_json: unknown;
}): BlocEspaceDecode | null {
  if (!estTypeBloc(ligne.type)) return null;
  const schema = SCHEMA_PAR_TYPE[ligne.type];
  const parsed = schema.safeParse(ligne.contenu_json);
  if (!parsed.success) return null;
  // L'union discriminée se construit par branchement explicite : le
  // TypeScript narrow le type `parsed.data` selon `ligne.type`.
  switch (ligne.type) {
    case 'texte':
      return { type: 'texte', contenu: parsed.data as z.infer<typeof SchemaContenuTexte> };
    case 'image':
      return { type: 'image', contenu: parsed.data as z.infer<typeof SchemaContenuImage> };
    case 'lien':
      return { type: 'lien', contenu: parsed.data as z.infer<typeof SchemaContenuLien> };
    case 'bouton':
      return { type: 'bouton', contenu: parsed.data as z.infer<typeof SchemaContenuBouton> };
  }
}
