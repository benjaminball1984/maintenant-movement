/**
 * Génération de mot de passe aléatoire sécurisé (V2.4.88).
 *
 * Utilise `crypto.getRandomValues` (Web Crypto API native, disponible
 * Node 16+ et tous runtimes Edge). Garantit qu'au moins un caractère
 * de chaque catégorie demandée est présent.
 *
 * Pour mot de passe temporaire (réinit), token magique, code à 6
 * chiffres. La gestion réelle des sessions reste Supabase Auth.
 *
 * Pur (modulo crypto.getRandomValues), testable via mocking si besoin.
 */

const MINUSCULES = 'abcdefghijklmnopqrstuvwxyz';
const MAJUSCULES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHIFFRES = '0123456789';
const SPECIAUX = '!@#$%^&*()_+-=[]{};:,.<>?';

export interface OptionsGenererPassword {
  longueur?: number;
  minuscules?: boolean;
  majuscules?: boolean;
  chiffres?: boolean;
  speciaux?: boolean;
}

/**
 * Génère un mot de passe aléatoire avec les caractéristiques voulues.
 * Garantit qu'au moins un caractère de chaque catégorie demandée est
 * inclus. Mélange final pour ne pas avoir les obligatoires en début.
 *
 * @example genererPassword({ longueur: 12 }) → 'aB3#kPx9!mR2' (exemple)
 */
export function genererPassword(opts: OptionsGenererPassword = {}): string {
  const longueur = Math.max(4, opts.longueur ?? 16);
  const useMin = opts.minuscules !== false;
  const useMaj = opts.majuscules !== false;
  const useChiffres = opts.chiffres !== false;
  const useSpec = opts.speciaux !== false;

  const categories: string[] = [];
  if (useMin) categories.push(MINUSCULES);
  if (useMaj) categories.push(MAJUSCULES);
  if (useChiffres) categories.push(CHIFFRES);
  if (useSpec) categories.push(SPECIAUX);

  if (categories.length === 0) {
    throw new Error('Au moins une catégorie de caractères doit être activée.');
  }

  // 1 caractère obligatoire par catégorie demandée
  const obligatoires = categories.map((c) => caractereAleatoire(c));
  // Restes : pool de toutes les catégories
  const pool = categories.join('');
  const restants: string[] = [];
  for (let i = 0; i < longueur - obligatoires.length; i++) {
    restants.push(caractereAleatoire(pool));
  }
  // Mélange final
  return melanger([...obligatoires, ...restants]).join('');
}

/**
 * Génère un code numérique à N chiffres (token email, OTP).
 * Padded à gauche avec des '0' si nécessaire.
 *
 * @example genererCodeNumerique(6) → '049213'
 */
export function genererCodeNumerique(longueur = 6): string {
  if (longueur < 1) throw new Error('Longueur doit être ≥ 1.');
  let r = '';
  for (let i = 0; i < longueur; i++) {
    r += caractereAleatoire(CHIFFRES);
  }
  return r;
}

/**
 * Génère un token alphanumérique URL-safe (sans confusion 0/O, 1/l/I).
 * Pour les liens magiques.
 *
 * @example genererTokenUrlSafe(32) → 'aB3xkP9mR2nT5wQ8vY7zU4hG6jF1eA0c'
 */
export function genererTokenUrlSafe(longueur = 32): string {
  // Exclut 0, O, 1, l, I pour éviter confusion humaine.
  const pool = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = '';
  for (let i = 0; i < longueur; i++) {
    r += caractereAleatoire(pool);
  }
  return r;
}

/** Sélectionne un caractère aléatoire d'une chaîne via crypto. */
function caractereAleatoire(pool: string): string {
  const idx = randInt(pool.length);
  return pool.charAt(idx);
}

/** Entier aléatoire dans [0, max) via crypto.getRandomValues. */
function randInt(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] ?? 0) % max;
}

/** Mélange un tableau en place (Fisher-Yates). */
function melanger<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j] as T;
    arr[j] = tmp as T;
  }
  return arr;
}
