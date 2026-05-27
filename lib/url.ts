/**
 * Helpers d'URL (V2.4.59).
 *
 * Centralise la construction d'URLs absolues / relatives / canoniques
 * partout dans le code (emails, OG metadata, sitemap, RSS, partages).
 *
 * Pur, testable. Le « site URL » est passé en paramètre pour rester
 * testable sans dépendance à l'env.
 */

/**
 * Compose une URL absolue à partir d'une base et d'un chemin.
 *
 * - Normalise les doubles slashs accidentels au milieu (`//` → `/`).
 * - Conserve les query strings et fragments.
 * - Si `chemin` est déjà absolu (commence par `http`), retourné tel quel.
 *
 * @example urlAbsolue('https://example.com/', '/foo') → 'https://example.com/foo'
 * @example urlAbsolue('https://example.com', 'foo') → 'https://example.com/foo'
 * @example urlAbsolue('https://example.com/', 'https://autre.com/bar') → 'https://autre.com/bar'
 */
export function urlAbsolue(siteUrl: string, chemin: string): string {
  if (chemin.startsWith('http://') || chemin.startsWith('https://')) return chemin;
  const base = siteUrl.replace(/\/$/, '');
  const path = chemin.startsWith('/') ? chemin : `/${chemin}`;
  // Normalise les // accidentels après le scheme.
  return `${base}${path}`.replace(/([^:])\/{2,}/g, '$1/');
}

/**
 * Compose un lien de partage URL-encodé pour un texte donné.
 *
 * @example lienPartageMailto('https://maintenant.fr/p/123', 'Cette pétition')
 *   → 'mailto:?subject=Cette%20pétition&body=https%3A%2F%2F...'
 */
export function lienPartageMailto(url: string, sujet: string): string {
  const sp = new URLSearchParams();
  sp.set('subject', sujet);
  sp.set('body', url);
  return `mailto:?${sp.toString()}`;
}

/**
 * Compose un lien de partage Mastodon (intent universel).
 */
export function lienPartageMastodon(url: string, texte: string): string {
  const sp = new URLSearchParams();
  sp.set('text', `${texte}\n${url}`);
  return `https://mastodon.social/share?${sp.toString()}`;
}

/**
 * Extrait le domaine (host) d'une URL absolue, sans le scheme ni le port.
 *
 * @example extraireDomaine('https://www.example.com:8080/foo') → 'www.example.com'
 */
export function extraireDomaine(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
