/**
 * Helpers de capitalisation française (V2.4.65).
 *
 * Pur, testable, sans dépendance externe.
 */

/**
 * Met la première lettre en majuscule, le reste tel quel.
 *
 * @example capitaliser('bonjour') → 'Bonjour'
 * @example capitaliser('jean-pierre') → 'Jean-pierre' (pas Title Case, voir titreCase)
 * @example capitaliser('') → ''
 */
export function capitaliser(s: string): string {
  if (s.length === 0) return '';
  return s.charAt(0).toLocaleUpperCase('fr-FR') + s.slice(1);
}

/**
 * Met en Title Case (chaque mot capitalisé). Séparateurs reconnus :
 * espace, tiret, apostrophe (droite et typographique).
 *
 * @example titreCase('jean-pierre dupont') → 'Jean-Pierre Dupont'
 * @example titreCase('marie d’hauteville') → 'Marie D’Hauteville'
 * @example titreCase('') → ''
 */
export function titreCase(s: string): string {
  if (s.length === 0) return '';
  return s.replace(/(^|[\s\-'’])(\p{L})/gu, (_match, sep, lettre) => {
    return sep + (lettre as string).toLocaleUpperCase('fr-FR');
  });
}

/**
 * Décapitalise : met la première lettre en minuscule.
 *
 * @example decapitaliser('Bonjour') → 'bonjour'
 */
export function decapitaliser(s: string): string {
  if (s.length === 0) return '';
  return s.charAt(0).toLocaleLowerCase('fr-FR') + s.slice(1);
}
