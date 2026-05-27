/**
 * Helper de groupage par clé (V2.4.77).
 *
 * Pour regrouper des résultats par catégorie, statut, jour, etc. sans
 * dépendre de lodash. Plus succinct que `Object.groupBy` (Node 21+).
 *
 * Pur, testable, sans dépendance externe.
 */

/**
 * Regroupe les éléments d'un tableau par la clé retournée par
 * `clefFn(element)`. La clé peut être string ou number (coerce en
 * string pour `Map.get`).
 *
 * @example groupBy([1,2,3,4], (n) => n % 2 === 0 ? 'pair' : 'impair')
 *   → Map { 'impair' => [1,3], 'pair' => [2,4] }
 */
export function groupBy<T, K extends string | number>(
  arr: readonly T[],
  clefFn: (item: T) => K,
): Map<K, T[]> {
  const result = new Map<K, T[]>();
  for (const item of arr) {
    const k = clefFn(item);
    const liste = result.get(k);
    if (liste === undefined) {
      result.set(k, [item]);
    } else {
      liste.push(item);
    }
  }
  return result;
}

/**
 * Variante qui retourne un objet plain au lieu d'une Map. Pratique
 * pour itérer en JSX ou sérialiser.
 *
 * @example groupByObjet(['a','b','cc'], (s) => s.length)
 *   → { 1: ['a','b'], 2: ['cc'] }
 */
export function groupByObjet<T, K extends string | number>(
  arr: readonly T[],
  clefFn: (item: T) => K,
): Record<K, T[]> {
  const map = groupBy(arr, clefFn);
  // biome-ignore lint/suspicious/noExplicitAny: Object.fromEntries n'accepte pas K générique directement
  return Object.fromEntries(map) as any;
}

/**
 * Compte les éléments par clé (variante optimisée si on ne veut que
 * le compte, pas les éléments eux-mêmes).
 *
 * @example countBy(['a','b','a','c','a'], (s) => s) → Map { 'a' => 3, 'b' => 1, 'c' => 1 }
 */
export function countBy<T, K extends string | number>(
  arr: readonly T[],
  clefFn: (item: T) => K,
): Map<K, number> {
  const result = new Map<K, number>();
  for (const item of arr) {
    const k = clefFn(item);
    result.set(k, (result.get(k) ?? 0) + 1);
  }
  return result;
}
