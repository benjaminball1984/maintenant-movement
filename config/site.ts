/**
 * Métadonnées du site Maintenant!.
 *
 * Source unique pour titre, URL canonique, description, locale.
 * Référencé par `app/layout.tsx` (metadata Next) et par toute génération
 * d'URL absolue (sitemap, mails, OG).
 */
export const SITE = {
  /** Nom officiel : `Maintenant!` avec capitale et point d'exclamation. */
  nom: 'Maintenant!',

  /** URL de production. */
  urlProd: 'https://maintenant-le-mouvement.org',

  /** Description courte utilisée pour OG, meta description, partage. */
  descriptionCourte:
    'La plateforme citoyenne des 99 %. Un mouvement politique populaire pour une vie digne et heureuse pour tous et toutes, dans un monde vivable.',

  /** Locale par défaut (le contenu éditorial est en français). */
  locale: 'fr',
} as const;
