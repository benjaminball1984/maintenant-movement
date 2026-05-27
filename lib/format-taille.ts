/**
 * Formate une taille en octets en chaîne lisible (V2.4.31).
 *
 * Règles : <1024 → octets ("o"), <1 Mo → Ko avec 1 décimale, sinon
 * Mo avec 1 décimale. Pas de Go pour le moment (les images font 5 Mo
 * max d'après les contraintes du bucket `media`).
 *
 * Pur, testable.
 */
export function formaterTailleOctets(octets: number): string {
  if (octets < 0) return '0 o';
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}
