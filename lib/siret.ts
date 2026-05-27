/**
 * Helpers SIREN / SIRET (V2.4.76).
 *
 * SIREN = identifiant entreprise/asso français sur 9 chiffres.
 * SIRET = SIREN + 5 chiffres d'établissement (NIC), soit 14 chiffres.
 *
 * Validation via formule de Luhn (clé de contrôle officielle INSEE).
 *
 * Exceptions Luhn (cf. INSEE) :
 * - La Poste a un SIRET spécifique qui ne respecte pas Luhn,
 *   on n'en tient pas compte ici (cas exotique géré ailleurs si besoin).
 *
 * Pur, testable, sans dépendance externe.
 */

const REGEX_SIREN = /^\d{9}$/;
const REGEX_SIRET = /^\d{14}$/;

/**
 * Algorithme de Luhn sur une string de chiffres.
 * Retourne true si la somme pondérée est multiple de 10.
 */
function luhn(s: string): boolean {
  let somme = 0;
  for (let i = 0; i < s.length; i++) {
    let n = Number.parseInt(s.charAt(s.length - 1 - i), 10);
    // Tous les chiffres en position paire (depuis la droite) doublés.
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    somme += n;
  }
  return somme % 10 === 0;
}

/**
 * Nettoie une string SIREN/SIRET (retire les espaces).
 */
function nettoyer(s: string): string {
  return s.replace(/\s+/g, '');
}

/**
 * Valide un SIREN (9 chiffres + Luhn).
 *
 * @example estSirenValide('732829320') → true (Carrefour SA)
 * @example estSirenValide('123456789') → false (Luhn ne passe pas)
 */
export function estSirenValide(s: string | null | undefined): boolean {
  if (s === null || s === undefined) return false;
  const t = nettoyer(s);
  if (!REGEX_SIREN.test(t)) return false;
  return luhn(t);
}

/**
 * Valide un SIRET (14 chiffres + Luhn).
 *
 * @example estSiretValide('73282932000074') → true
 */
export function estSiretValide(s: string | null | undefined): boolean {
  if (s === null || s === undefined) return false;
  const t = nettoyer(s);
  if (!REGEX_SIRET.test(t)) return false;
  return luhn(t);
}

/**
 * Formate un SIRET en groupes 3-3-3-5 séparés par espaces.
 *
 * @example formaterSiret('73282932000074') → '732 829 320 00074'
 * @returns chaîne vide si invalide.
 */
export function formaterSiret(s: string): string {
  if (!estSiretValide(s)) return '';
  const t = nettoyer(s);
  return `${t.slice(0, 3)} ${t.slice(3, 6)} ${t.slice(6, 9)} ${t.slice(9)}`;
}

/**
 * Formate un SIREN en groupes 3-3-3 séparés par espaces.
 *
 * @example formaterSiren('732829320') → '732 829 320'
 * @returns chaîne vide si invalide.
 */
export function formaterSiren(s: string): string {
  if (!estSirenValide(s)) return '';
  const t = nettoyer(s);
  return `${t.slice(0, 3)} ${t.slice(3, 6)} ${t.slice(6, 9)}`;
}
