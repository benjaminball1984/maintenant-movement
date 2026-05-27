/**
 * Helpers de calcul d'âge (V2.4.62).
 *
 * Pur, testable. Accepte une date ISO (`YYYY-MM-DD`) ou un objet Date.
 *
 * Convention : âge entier en années (jamais affiché avec décimales),
 * en tenant compte du mois et du jour. `null` si date invalide ou
 * dans le futur.
 */

/**
 * Calcule l'âge en années entières à une date de référence (default :
 * maintenant). Retourne `null` si la date est invalide ou future.
 *
 * @example calculerAge('2000-05-23', new Date('2026-05-23')) → 26
 * @example calculerAge('2000-05-24', new Date('2026-05-23')) → 25 (anniversaire pas encore passé)
 * @example calculerAge('2027-01-01', new Date('2026-05-23')) → null (futur)
 */
export function calculerAge(
  dateNaissance: string | Date,
  reference: Date = new Date(),
): number | null {
  const naissance = typeof dateNaissance === 'string' ? new Date(dateNaissance) : dateNaissance;
  if (Number.isNaN(naissance.getTime())) return null;
  if (naissance.getTime() > reference.getTime()) return null;

  let age = reference.getFullYear() - naissance.getFullYear();
  const moisDiff = reference.getMonth() - naissance.getMonth();
  if (moisDiff < 0 || (moisDiff === 0 && reference.getDate() < naissance.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Retourne `true` si la personne est majeure (≥ 18 ans) à la date
 * de référence.
 */
export function estMajeur(dateNaissance: string | Date, reference?: Date): boolean {
  const age = calculerAge(dateNaissance, reference);
  return age !== null && age >= 18;
}
