/**
 * Helpers d'export CSV (V2.4.36).
 *
 * Format CSV strict RFC 4180 :
 * - Séparateur : virgule (`,`)
 * - Échappement : guillemet double doublé (`""`)
 * - Encadrement obligatoire si la valeur contient `,`, `"`, `\n`, `\r`
 * - Fin de ligne : `\r\n`
 *
 * Pur, testable, sans dépendance Node.
 */

export type ValeurCsv = string | number | boolean | null | undefined;

/**
 * Échappe une valeur pour insertion dans une cellule CSV.
 *
 * Règles :
 * - null / undefined → chaîne vide
 * - boolean → 'true' / 'false'
 * - number → toString()
 * - string : encadré par `"` si contient `,`, `"`, `\n` ou `\r`, et
 *   chaque `"` interne est doublé.
 */
export function echapperValeurCsv(v: ValeurCsv): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'string' ? v : String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Compose une ligne CSV à partir d'un tableau de valeurs.
 * Sans terminateur de ligne (à concaténer avec `\r\n`).
 */
export function composerLigneCsv(valeurs: ValeurCsv[]): string {
  return valeurs.map(echapperValeurCsv).join(',');
}

/**
 * Compose un document CSV complet à partir d'en-têtes et de lignes.
 * Retourne une chaîne avec `\r\n` entre chaque ligne ET en fin (sentinelle
 * RFC 4180 conseillée).
 */
export function composerDocumentCsv(enTetes: string[], lignes: ValeurCsv[][]): string {
  const parts = [composerLigneCsv(enTetes), ...lignes.map(composerLigneCsv)];
  return `${parts.join('\r\n')}\r\n`;
}
