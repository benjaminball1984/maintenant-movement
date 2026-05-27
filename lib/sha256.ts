/**
 * Hash SHA-256 via Web Crypto API (V2.4.79).
 *
 * Disponible nativement dans Node 16+ et tous les runtimes Edge
 * (Cloudflare Workers, Vercel Edge, Deno, navigateur). Pas de
 * dépendance npm.
 *
 * Pour cache-busting fort, vérification d'intégrité, ETag :
 * sha256 garantit ~0 collision pratique (vs FNV-1a 32 bits qui peut
 * collisionner après 65k entrées).
 *
 * Pour cache-busting léger préférer `hashFnv1aHex` (lib/hash.ts).
 */

/**
 * Hash SHA-256 d'une chaîne, retourné en hexadécimal (64 caractères
 * minuscules).
 *
 * @example await sha256Hex('hello')
 *   → '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
 */
export async function sha256Hex(s: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(s);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);
  let hex = '';
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Hash SHA-256 court (12 caractères hex), pratique pour les URLs de
 * cache-busting ou les noms de fichiers.
 *
 * 48 bits → ~280 millions d'entrées avant collision attendue (suffisant
 * pour notre besoin).
 */
export async function sha256Court(s: string): Promise<string> {
  const hex = await sha256Hex(s);
  return hex.slice(0, 12);
}
