/**
 * Hash non cryptographique FNV-1a 32 bits (V2.4.73).
 *
 * Pour les besoins de cache-busting / ETag / clés de cache où l'on
 * veut un identifiant court et déterministe d'un contenu, sans avoir
 * besoin de garantie cryptographique (sha256 serait surdimensionné
 * et lent côté Edge / Cloudflare Workers).
 *
 * Algorithme FNV-1a (Fowler-Noll-Vo) : rapide, distribution acceptable,
 * 32 bits suffisants pour ce besoin (4 milliards de valeurs distinctes).
 *
 * Pur, testable, sans dépendance.
 */

const FNV_PRIME_32 = 0x01000193;
const FNV_OFFSET_32 = 0x811c9dc5;

/**
 * Hash FNV-1a 32 bits d'une chaîne. Retourne un entier non signé
 * (0 à 0xFFFFFFFF).
 *
 * @example hashFnv1a('hello') → 1335831723
 * @example hashFnv1a('') → 2166136261 (FNV_OFFSET)
 */
export function hashFnv1a(s: string): number {
  let hash = FNV_OFFSET_32;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    // Multiplication 32 bits sécurisée via Math.imul.
    hash = Math.imul(hash, FNV_PRIME_32);
  }
  // Conversion vers unsigned 32 bits.
  return hash >>> 0;
}

/**
 * Retourne le hash FNV-1a en hexadécimal sur 8 caractères
 * (sans préfixe `0x`, padded à gauche avec des `0`).
 *
 * Pratique pour les noms de fichier / clés de cache.
 *
 * @example hashFnv1aHex('hello') → '4f9f2cab'
 * @example hashFnv1aHex('') → '811c9dc5'
 */
export function hashFnv1aHex(s: string): string {
  return hashFnv1a(s).toString(16).padStart(8, '0');
}
