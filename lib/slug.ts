/**
 * Helpers de génération de slug (V2.4.28).
 *
 * Extrait des slugify locaux qui se répétaient dans les actions Décider
 * (V2.4.12) et Journal (V2.4.13). Pur, testable, sans dépendance Node.
 *
 * Règles :
 * - NFD (décompose les accents en lettre + diacritique)
 * - retire les diacritiques (`\p{Diacritic}` en mode `u`)
 * - tout en minuscules
 * - remplace les caractères non alphanumériques par `-`
 * - retire les `-` en début / fin
 * - limite à `maxLongueur` (défaut 80)
 *
 * NB : aucune logique d'anti-collision ici. C'est la responsabilité de
 * l'appelant (souvent en BDD via contrainte UNIQUE + suffixe timestamp).
 */
export function slugifier(texte: string, maxLongueur = 80): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, maxLongueur);
}

/**
 * Génère un slug avec suffixe court basé sur Date.now() pour éviter une
 * collision détectée par l'appelant. Le suffixe utilise les 4 derniers
 * caractères en base 36 (~36^4 = 1.6 M, assez pour éviter les collisions
 * rapprochées dans la même seconde).
 */
export function slugifierAvecSuffixeTemps(texte: string, maxLongueur = 80): string {
  const base = slugifier(texte, maxLongueur - 5);
  const suffixe = Date.now().toString(36).slice(-4);
  return `${base}-${suffixe}`;
}

/**
 * Valide qu'une chaîne est déjà un slug bien formé (V2.4.56).
 *
 * Règles :
 * - 1 à 80 caractères
 * - uniquement [a-z0-9-]
 * - pas de tirets multiples consécutifs
 * - pas de tiret en début ou fin
 *
 * Utile pour valider les slugs reçus en entrée (params URL, formulaires)
 * sans avoir à les regénérer.
 */
export function estSlugValide(slug: string): boolean {
  if (slug.length < 1 || slug.length > 80) return false;
  if (slug.startsWith('-') || slug.endsWith('-')) return false;
  if (slug.includes('--')) return false;
  return /^[a-z0-9-]+$/.test(slug);
}
