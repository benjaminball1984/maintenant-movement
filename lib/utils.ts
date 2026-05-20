/**
 * Helpers transverses.
 *
 * Ce fichier reste minuscule par discipline : tout helper qui dépasse
 * quelques lignes ou qui touche un domaine identifiable doit aller dans
 * son propre module (`lib/permissions/`, `lib/i18n/`, etc.).
 */

/**
 * Concatène des classes CSS conditionnelles en filtrant les valeurs falsy.
 *
 * Équivalent minimaliste de `clsx` / `classnames` pour éviter une
 * dépendance externe tant que le besoin reste trivial. Sera remplacé par
 * `clsx` + `tailwind-merge` au chantier 0.2 si la complexité l'exige.
 *
 * @example
 *   cn('btn', isActive && 'btn-active', className) // -> "btn btn-active ..."
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
