/**
 * Helpers IBAN (V2.4.69).
 *
 * Validation par algorithme officiel ISO 13616 (mod 97 = 1) :
 * 1. Mettre les 4 premiers caractères à la fin
 * 2. Remplacer chaque lettre par ses 2 chiffres (A=10, B=11, ..., Z=35)
 * 3. Calculer le modulo 97 du grand entier obtenu
 * 4. Doit valoir 1
 *
 * Validations supplémentaires :
 * - 15 à 34 caractères alphanumériques
 * - 2 lettres de pays + 2 chiffres de clé + BBAN
 * - Longueurs par pays (FR=27, BE=16, DE=22, etc.)
 *
 * Pur, testable. Inspiré du standard, pas de dépendance externe.
 */

/** Longueurs canoniques par code pays ISO 3166-1 alpha-2 (extrait). */
const LONGUEURS_PAR_PAYS: Record<string, number> = {
  FR: 27,
  BE: 16,
  DE: 22,
  CH: 21,
  LU: 20,
  MC: 27,
  IT: 27,
  ES: 24,
  PT: 25,
  NL: 18,
  GB: 22,
  IE: 22,
};

/**
 * Normalise un IBAN : retire les espaces, met en majuscules.
 */
export function normaliserIban(iban: string): string {
  return iban.replace(/\s+/g, '').toUpperCase();
}

/**
 * Convertit une string IBAN en string de chiffres pour le calcul
 * mod 97. Chaque lettre A→10, B→11, ..., Z→35.
 */
function lettresEnChiffres(s: string): string {
  let r = '';
  for (const c of s) {
    const code = c.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      // 0-9
      r += c;
    } else if (code >= 65 && code <= 90) {
      // A-Z
      r += String(code - 55);
    } else {
      return ''; // caractère invalide
    }
  }
  return r;
}

/**
 * Calcule mod 97 d'un grand entier exprimé en string décimale.
 * Évite BigInt (qui marche aussi, mais inutile vu la lenteur sur
 * mobile et la conversion).
 */
function mod97(s: string): number {
  let reste = 0;
  for (const c of s) {
    reste = (reste * 10 + (c.charCodeAt(0) - 48)) % 97;
  }
  return reste;
}

/**
 * Valide un IBAN selon ISO 13616.
 *
 * @example estIbanValide('FR14 2004 1010 0505 0001 3M02 606') → true
 * @example estIbanValide('FR1420041010050500013M02606') → true
 * @example estIbanValide('GB82WEST12345698765432') → true
 * @example estIbanValide('FR99 9999 9999 9999 9999 9999 999') → false (clé fausse)
 */
export function estIbanValide(iban: string | null | undefined): boolean {
  if (iban === null || iban === undefined) return false;
  const norm = normaliserIban(iban);
  if (norm.length < 15 || norm.length > 34) return false;
  if (!/^[A-Z0-9]+$/.test(norm)) return false;
  const pays = norm.slice(0, 2);
  // 2 lettres de pays + 2 chiffres de clé
  if (!/^[A-Z]{2}\d{2}/.test(norm)) return false;
  // Si pays connu, vérifier longueur attendue.
  const longueurAttendue = LONGUEURS_PAR_PAYS[pays];
  if (longueurAttendue !== undefined && norm.length !== longueurAttendue) return false;
  // Test mod 97
  const reorg = norm.slice(4) + norm.slice(0, 4);
  const chiffres = lettresEnChiffres(reorg);
  if (chiffres === '') return false;
  return mod97(chiffres) === 1;
}

/**
 * Formate un IBAN en groupes de 4 caractères séparés par espaces.
 *
 * @example formaterIban('FR1420041010050500013M02606') → 'FR14 2004 1010 0505 0001 3M02 606'
 * @returns chaîne vide si invalide.
 */
export function formaterIban(iban: string): string {
  if (!estIbanValide(iban)) return '';
  const norm = normaliserIban(iban);
  return norm.match(/.{1,4}/g)?.join(' ') ?? '';
}
