/**
 * Helpers de couleurs hexadécimales (V2.4.70).
 *
 * Pour les tags / badges utilisateurice colorés (campagnes, GT,
 * catégories marché) où l'on veut vérifier la lisibilité avant de
 * laisser passer un choix de couleur.
 *
 * Pur, testable, sans dépendance externe.
 */

const REGEX_HEX_3 = /^#?([0-9a-fA-F]{3})$/;
const REGEX_HEX_6 = /^#?([0-9a-fA-F]{6})$/;

/**
 * Valide qu'une chaîne est une couleur hex (`#abc`, `#aabbcc`, ou sans `#`).
 */
export function estHexValide(s: string | null | undefined): boolean {
  if (s === null || s === undefined) return false;
  const t = s.trim();
  return REGEX_HEX_3.test(t) || REGEX_HEX_6.test(t);
}

/**
 * Normalise une couleur hex en format `#aabbcc` minuscules (toujours 6
 * chiffres, avec dièse). Retourne `null` si invalide.
 *
 * @example normaliserHex('abc') → '#aabbcc'
 * @example normaliserHex('#FF00FF') → '#ff00ff'
 */
export function normaliserHex(s: string | null | undefined): string | null {
  if (!estHexValide(s)) return null;
  const t = (s as string).trim().toLowerCase();
  const sansHash = t.startsWith('#') ? t.slice(1) : t;
  if (sansHash.length === 3) {
    return `#${sansHash[0]}${sansHash[0]}${sansHash[1]}${sansHash[1]}${sansHash[2]}${sansHash[2]}`;
  }
  return `#${sansHash}`;
}

/**
 * Extrait les composantes RGB (0-255) d'une couleur hex valide.
 * Retourne `null` si invalide.
 */
export function hexEnRgb(s: string): { r: number; g: number; b: number } | null {
  const norm = normaliserHex(s);
  if (norm === null) return null;
  return {
    r: Number.parseInt(norm.slice(1, 3), 16),
    g: Number.parseInt(norm.slice(3, 5), 16),
    b: Number.parseInt(norm.slice(5, 7), 16),
  };
}

/**
 * Calcule la luminance relative WCAG d'une couleur hex (0.0 à 1.0).
 * Formule : https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 *
 * @returns null si invalide.
 */
export function luminanceRelative(s: string): number | null {
  const rgb = hexEnRgb(s);
  if (rgb === null) return null;
  const transformer = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * transformer(rgb.r) + 0.7152 * transformer(rgb.g) + 0.0722 * transformer(rgb.b);
}

/**
 * Retourne la couleur de texte (`#000000` ou `#ffffff`) la plus
 * contrastée par rapport à une couleur de fond donnée. Utilise le
 * seuil 0.179 (WCAG AA recommandé pour les badges/chips).
 *
 * @example contrastTexte('#000000') → '#ffffff'
 * @example contrastTexte('#ffffff') → '#000000'
 * @example contrastTexte('#888888') → '#ffffff' (gris moyen-foncé)
 *
 * Retourne `#000000` par défaut si la couleur d'entrée est invalide.
 */
export function contrastTexte(fond: string): '#000000' | '#ffffff' {
  const l = luminanceRelative(fond);
  if (l === null) return '#000000';
  return l > 0.179 ? '#000000' : '#ffffff';
}
