/**
 * Helpers de pluralisation française (V2.4.41).
 *
 * Remplace les répétitions `${n} truc${n > 1 ? 's' : ''}` dans tout le
 * code par un helper unique testable.
 *
 * Pur, sans dépendance.
 */

/**
 * Retourne le mot au singulier ou pluriel selon `n`.
 *
 * Convention française : pluriel à partir de 2 (1 reste singulier,
 * 0 est singulier, -1 reste singulier au sens grammatical bien que
 * convention typographique anglaise mette le pluriel à 0 et négatif).
 *
 * Par défaut, ajoute `s` au mot pluriel. Si le mot pluriel diffère du
 * singulier par autre chose qu'un `s`, fournir explicitement le pluriel
 * (ex. `accorder(2, 'cheval', 'chevaux')`).
 */
export function accorder(n: number, singulier: string, pluriel?: string): string {
  if (Math.abs(n) < 2) return singulier;
  return pluriel ?? `${singulier}s`;
}

/**
 * Compose une chaîne « N mot(s) » avec accord et formatage du nombre.
 *
 * Ex : `compter(0, 'résultat')` → `'0 résultat'`
 *      `compter(1, 'résultat')` → `'1 résultat'`
 *      `compter(2, 'résultat')` → `'2 résultats'`
 *      `compter(1234, 'résultat')` → `'1 234 résultats'`
 *      `compter(3, 'cheval', 'chevaux')` → `'3 chevaux'`
 */
export function compter(n: number, singulier: string, pluriel?: string): string {
  return `${formaterNombre(n)} ${accorder(n, singulier, pluriel)}`;
}

const FORMATEUR_NOMBRE = new Intl.NumberFormat('fr-FR');

function formaterNombre(n: number): string {
  return FORMATEUR_NOMBRE.format(n);
}
