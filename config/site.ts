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

/**
 * URL de base pour les liens absolus générés à l'exécution : redirections
 * d'authentification et liens des emails de confirmation.
 *
 * En développement, `NEXT_PUBLIC_SITE_URL` vaut `http://localhost:3000`
 * (cf. `.env.local`), pour que le lien de validation d'email revienne sur
 * la machine locale et non sur le site de production. En production, on
 * définit cette variable sur l'URL réelle, sinon on retombe sur l'URL
 * canonique `urlProd`.
 *
 * À distinguer de `SITE.urlProd`, qui reste l'URL canonique figée utilisée
 * pour le SEO (metadataBase, Open Graph, sitemap).
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? SITE.urlProd;
}
