/**
 * Helper de validation d'email (V2.4.50).
 *
 * Validation pragmatique : on cherche un format raisonnable, pas une
 * conformité stricte RFC 5322 (qui accepte des cas absurdes en pratique).
 *
 * Règle : au moins un caractère avant `@`, au moins un domaine avec
 * point, pas d'espace, longueur raisonnable.
 *
 * Pour la vérification réelle de l'existence de l'email, on s'en remet
 * au cycle de double opt-in (envoi d'un lien magique cliquable).
 */

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LONGUEUR_MAX = 254;

/**
 * Retourne `true` si la chaîne ressemble à un email valide.
 *
 * @example estEmailValide('foo@bar.com') → true
 * @example estEmailValide('foo@bar') → false (pas de point dans le domaine)
 * @example estEmailValide('foo @bar.com') → false (espace)
 * @example estEmailValide('') → false
 */
export function estEmailValide(email: string | null | undefined): boolean {
  if (email === null || email === undefined) return false;
  const e = email.trim();
  if (e.length === 0 || e.length > LONGUEUR_MAX) return false;
  return REGEX_EMAIL.test(e);
}

/**
 * Normalise un email : trim + lowercase. Pratique pour comparer et
 * stocker (évite « Foo@Bar.COM » et « foo@bar.com » comme entrées
 * distinctes).
 */
export function normaliserEmail(email: string): string {
  return email.trim().toLowerCase();
}
