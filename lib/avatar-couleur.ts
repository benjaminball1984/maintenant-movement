/**
 * Couleur d'avatar déterministe (V2.4.78).
 *
 * Génère une couleur HSL stable à partir d'un identifiant (nom, email,
 * UUID). Pour les avatars « sans photo » des profils du réseau ou des
 * membres dans les listes.
 *
 * Palette : luminosité fixée à 50% et saturation 70% pour rester
 * lisible avec texte blanc en superposition (cf. `contrastTexte`
 * dans `lib/couleur-hex.ts` si besoin de raffiner).
 *
 * Pur, testable, déterministe (même entrée → même couleur).
 */

import { hashFnv1a } from './hash';

/**
 * Retourne une couleur HSL stable pour un identifiant donné.
 *
 * @example avatarHsl('alice@example.com') → 'hsl(214, 70%, 50%)'
 * @example avatarHsl('') → 'hsl(0, 70%, 50%)' (fallback rouge)
 */
export function avatarHsl(id: string): string {
  const hash = hashFnv1a(id);
  const teinte = hash % 360;
  return `hsl(${teinte}, 70%, 50%)`;
}

/**
 * Retourne les initiales à afficher dans l'avatar.
 *
 * Règles :
 * - 2 caractères max (1ʳᵉ lettre du 1er mot + 1ʳᵉ lettre du dernier)
 * - majuscules
 * - si 1 seul mot, retourne juste sa 1ʳᵉ lettre
 * - vide → `?`
 *
 * @example initialesPourAvatar('Marie Dupont') → 'MD'
 * @example initialesPourAvatar('Léa') → 'L'
 * @example initialesPourAvatar('jean-pierre martin') → 'JM'
 * @example initialesPourAvatar('') → '?'
 */
export function initialesPourAvatar(nomComplet: string): string {
  const t = nomComplet.trim();
  if (t.length === 0) return '?';
  const mots = t.split(/\s+/).filter((m) => m.length > 0);
  if (mots.length === 0) return '?';
  if (mots.length === 1) {
    return (mots[0]?.charAt(0) ?? '?').toLocaleUpperCase('fr-FR');
  }
  const premier = mots[0]?.charAt(0) ?? '';
  const dernier = mots[mots.length - 1]?.charAt(0) ?? '';
  return `${premier}${dernier}`.toLocaleUpperCase('fr-FR');
}
