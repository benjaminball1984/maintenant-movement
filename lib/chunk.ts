/**
 * Helper de découpage de tableau en chunks (V2.4.74).
 *
 * Utile pour batcher des requêtes Supabase (ex. `in (...ids)` qui
 * accepte au plus quelques milliers d'IDs), des envois d'email Brevo,
 * des écritures en base, etc.
 *
 * Pur, testable, sans dépendance externe.
 */

/**
 * Découpe un tableau en sous-tableaux de taille `tailleChunk` max.
 * Le dernier chunk peut être plus petit. Si `tailleChunk` ≤ 0,
 * retourne un seul chunk contenant tout le tableau (sécurité).
 *
 * @example chunk([1,2,3,4,5], 2) → [[1,2],[3,4],[5]]
 * @example chunk([], 10) → []
 * @example chunk([1,2,3], 10) → [[1,2,3]]
 */
export function chunk<T>(arr: readonly T[], tailleChunk: number): T[][] {
  if (arr.length === 0) return [];
  if (tailleChunk <= 0) return [arr.slice()];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += tailleChunk) {
    result.push(arr.slice(i, i + tailleChunk));
  }
  return result;
}

/**
 * Calcule le nombre de chunks que produira `chunk(arr, taille)` sans
 * faire le découpage. Pratique pour pré-allouer / itérer / afficher
 * « N/M lots traités ».
 *
 * @example nbChunks(100, 30) → 4 (3×30 + 1×10)
 * @example nbChunks(0, 30) → 0
 */
export function nbChunks(total: number, tailleChunk: number): number {
  if (total <= 0) return 0;
  if (tailleChunk <= 0) return 1;
  return Math.ceil(total / tailleChunk);
}
