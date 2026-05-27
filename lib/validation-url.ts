/**
 * Validation d'URL (V2.4.87).
 *
 * Validation pragmatique via constructeur `URL` natif + filtrage des
 * schemas autorisés. Refuse les `javascript:`, `data:`, `file:`, etc.
 *
 * Pur, testable, sans dépendance externe.
 */

const SCHEMAS_AUTORISES_PAR_DEFAUT = ['http:', 'https:'] as const;

export interface OptionsValidationUrl {
  /** Liste des schémas autorisés. Défaut : http + https. */
  schemas?: readonly string[];
  /**
   * Si fourni, refuse les URLs dont le hostname n'est pas dans la liste
   * (ex. allowlist d'organisations partenaires).
   */
  allowlistDomaines?: readonly string[];
}

/**
 * Valide qu'une chaîne est une URL bien formée et acceptée.
 *
 * @example estUrlValide('https://example.com') → true
 * @example estUrlValide('javascript:alert(1)') → false
 * @example estUrlValide('https://malveillant.com', { allowlistDomaines: ['example.com'] }) → false
 */
export function estUrlValide(
  url: string | null | undefined,
  opts: OptionsValidationUrl = {},
): boolean {
  if (url === null || url === undefined) return false;
  const t = url.trim();
  if (t === '') return false;
  let parsed: URL;
  try {
    parsed = new URL(t);
  } catch {
    return false;
  }
  const schemas = opts.schemas ?? SCHEMAS_AUTORISES_PAR_DEFAUT;
  if (!schemas.includes(parsed.protocol)) return false;
  if (opts.allowlistDomaines !== undefined) {
    if (!opts.allowlistDomaines.includes(parsed.hostname)) return false;
  }
  return true;
}

/**
 * Tente de parser une URL et retourne `null` si invalide.
 * Pratique pour normaliser avant stockage / affichage.
 */
export function parserUrl(url: string | null | undefined): URL | null {
  if (url === null || url === undefined) return null;
  try {
    return new URL(url.trim());
  } catch {
    return null;
  }
}
