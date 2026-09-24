/**
 * Liens nommés dans le texte d'un contenu média (2026-09-24).
 *
 * Le corps d'un article reste du texte brut. On y accepte une seule notation,
 * `[mot](https://…)`, pour qu'un mot devienne cliquable sur la fiche de
 * l'article (premier cas : « parue dans Regards et dans Basta! », où chaque
 * nom de journal mène à sa tribune). Partout où le texte est montré sans ses
 * liens (extraits des listes, une de l'accueil, flux RSS, aperçus de partage),
 * on garde le mot et on retire l'adresse, pour ne jamais afficher de crochets.
 */

/** Un lien nommé : le mot en groupe 1, l'adresse http(s) en groupe 2. */
export const MOTIF_LIEN_NOMME = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;

/** Le texte sans les adresses des liens nommés : « [Regards](https://…) » devient « Regards ». */
export function texteSansLiens(texte: string): string {
  return texte.replace(MOTIF_LIEN_NOMME, '$1');
}
