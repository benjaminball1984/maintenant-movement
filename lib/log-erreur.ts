/**
 * Logger d'erreurs centralisé (V2.4.82).
 *
 * Point unique pour les `console.error` du code applicatif. Permet de
 * brancher Sentry / Axiom / autre service plus tard sans toucher aux
 * call sites.
 *
 * En attendant Sentry (CLAUDE.md §6 : à configurer plus tard), on
 * écrit dans la console serveur. Le format inclut le contexte
 * (module / opération) pour faciliter le filtrage.
 *
 * Pur, testable. Pas de dépendance externe.
 */

export interface ContexteErreur {
  /** Module / fichier source. Ex : 'lib/cagnottes', 'app/actions/petition'. */
  module: string;
  /** Opération en cours. Ex : 'signer', 'creer', 'lister'. */
  operation: string;
  /** Données additionnelles non-PII pour le debug. */
  data?: Record<string, unknown>;
}

/**
 * Log une erreur dans la console avec contexte structuré.
 *
 * Format : `[ERROR module/operation] message {data}`. Permet `grep`
 * facile dans les logs Cloudflare / Supabase.
 *
 * Ne lance jamais : un échec de log ne doit pas faire échouer le code
 * appelant.
 */
export function logErreur(erreur: unknown, contexte: ContexteErreur): void {
  try {
    const message = extraireMessage(erreur);
    const stack = extraireStack(erreur);
    const dataStr =
      contexte.data !== undefined && Object.keys(contexte.data).length > 0
        ? ` ${JSON.stringify(contexte.data)}`
        : '';
    console.error(`[ERROR ${contexte.module}/${contexte.operation}] ${message}${dataStr}`);
    if (stack !== null) {
      console.error(stack);
    }
  } catch {
    // Échec silencieux : on ne casse jamais l'appelant pour un log.
  }
}

/**
 * Extrait un message lisible d'une erreur de type inconnu.
 */
export function extraireMessage(erreur: unknown): string {
  if (erreur instanceof Error) return erreur.message;
  if (typeof erreur === 'string') return erreur;
  if (typeof erreur === 'object' && erreur !== null) {
    const obj = erreur as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    try {
      return JSON.stringify(erreur);
    } catch {
      return String(erreur);
    }
  }
  return String(erreur);
}

/**
 * Extrait la stack trace si disponible.
 */
export function extraireStack(erreur: unknown): string | null {
  if (erreur instanceof Error && typeof erreur.stack === 'string') {
    return erreur.stack;
  }
  return null;
}
