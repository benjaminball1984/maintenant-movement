/**
 * Helpers de troncature de texte pour aperçu (V2.4.43).
 *
 * Plusieurs stratégies selon le besoin :
 * - `tronquerCaracteres` : coupe à N caractères, sans couper de mot.
 * - `tronquerMots` : coupe à N mots.
 * - `apercu` : alias historique de `tronquerCaracteres` pour
 *   compatibilité avec les utilitaires existants (V1).
 *
 * Pur, testable. Ajoute `…` (caractère ellipsis) si tronqué.
 */

const ELLIPSIS = '…';

/**
 * Tronque à N caractères max sans couper un mot (recherche le dernier
 * espace dans la fenêtre). Si le texte est plus court, retourne tel quel.
 *
 * @example tronquerCaracteres('Lorem ipsum dolor sit amet', 10) → 'Lorem…'
 */
export function tronquerCaracteres(texte: string, maxCar = 240): string {
  const t = texte.trim();
  if (t.length <= maxCar) return t;
  // Cherche le dernier espace dans les `maxCar` premiers caractères.
  const fenetre = t.slice(0, maxCar);
  const dernierEspace = fenetre.lastIndexOf(' ');
  const coupe = dernierEspace >= maxCar * 0.5 ? fenetre.slice(0, dernierEspace) : fenetre;
  return `${coupe}${ELLIPSIS}`;
}

/**
 * Tronque à N mots max. Si le texte est plus court, retourne tel quel.
 *
 * @example tronquerMots('un deux trois quatre cinq', 3) → 'un deux trois…'
 */
export function tronquerMots(texte: string, maxMots = 50): string {
  const mots = texte
    .trim()
    .split(/\s+/)
    .filter((m) => m !== '');
  if (mots.length <= maxMots) return texte.trim();
  return `${mots.slice(0, maxMots).join(' ')}${ELLIPSIS}`;
}

/** Alias historique de `tronquerCaracteres`. */
export const apercu = tronquerCaracteres;
