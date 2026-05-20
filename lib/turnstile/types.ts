/**
 * Contrat du service anti-bot Cloudflare Turnstile.
 *
 * Choisi pour son accessibilité (pas reCAPTCHA), son intégration
 * Cloudflare et son respect de la vie privée.
 *
 * Présent sur tous les formulaires publics (cf. 01_ARCHITECTURE.md §11).
 *
 * Switch via `TURNSTILE_PROVIDER` : `mock` (défaut) | `cloudflare`.
 */
export interface ResultatVerification {
  succes: boolean;
  /** Codes d'erreur Turnstile en cas d'échec. Vide en cas de succès. */
  codesErreur: ReadonlyArray<string>;
}

export interface TurnstileService {
  /**
   * Vérifie un jeton Turnstile soumis par le client.
   * `ipDistant` est optionnel mais recommandé (renforce la vérification).
   */
  verifier(jeton: string, ipDistant?: string): Promise<ResultatVerification>;
}
