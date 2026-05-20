import type { ResultatVerification, TurnstileService } from './types';

/**
 * Mock Turnstile : retourne toujours succès, sauf si le jeton commence
 * par `mock-invalide-` (utile pour tester les flux d'erreur).
 *
 * Permet de coder tous les formulaires avec validation Turnstile sans
 * dépendre d'une clé Cloudflare en local.
 */
export class MockTurnstileService implements TurnstileService {
  async verifier(jeton: string, _ipDistant?: string): Promise<ResultatVerification> {
    if (jeton.startsWith('mock-invalide-')) {
      return { succes: false, codesErreur: ['invalid-input-response'] };
    }
    return { succes: true, codesErreur: [] };
  }
}
