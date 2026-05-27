/**
 * Normalisation de chaîne pour recherche (V2.4.86).
 *
 * Retire accents + lowercase + retire ponctuation pour matcher de
 * manière permissive. Utile côté client pour les autocompletes et
 * pré-filtres avant requête serveur (et pour `recherche-globale.ts`
 * en complément du `ilike` SQL).
 *
 * Pur, testable, sans dépendance externe.
 */

/**
 * Normalise une chaîne : NFD + retire diacritiques + lowercase +
 * collapse les espaces multiples.
 *
 * @example normaliserRecherche('Édition spéciale n°1') → 'edition speciale n°1'
 * @example normaliserRecherche('  Salut   le monde  ') → 'salut le monde'
 */
export function normaliserRecherche(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');
}

/**
 * Retourne `true` si `aiguille` (normalisée) est contenue dans
 * `texte` (normalisé). Recherche permissive : « ele » matche
 * « élémentaire ».
 *
 * @example contientTexte('école élémentaire', 'ELE') → true
 * @example contientTexte('école élémentaire', 'xy') → false
 */
export function contientTexte(texte: string, aiguille: string): boolean {
  const a = normaliserRecherche(aiguille);
  if (a === '') return true;
  return normaliserRecherche(texte).includes(a);
}

/**
 * Tri permissif : compare 2 strings ignorant accents et casse.
 * Utilisable comme comparator pour `Array.sort`.
 *
 * @example ['École', 'Aéro', 'Zoo'].sort(comparerPermissif) → ['Aéro', 'École', 'Zoo']
 */
export function comparerPermissif(a: string, b: string): number {
  return normaliserRecherche(a).localeCompare(normaliserRecherche(b), 'fr-FR');
}
