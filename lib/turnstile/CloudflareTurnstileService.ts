import type { ResultatVerification, TurnstileService } from './types';

/**
 * Implémentation réelle Cloudflare Turnstile.
 *
 * Volontairement non implémentée au chantier 0.1. Branchée au chantier 1.2
 * (formulaire d'inscription) puis réutilisée sur tous les formulaires
 * publics (pétitions, mobilisations, contact, etc.).
 *
 * Endpoint de vérification :
 * https://challenges.cloudflare.com/turnstile/v0/siteverify
 */
export class CloudflareTurnstileService implements TurnstileService {
  verifier(_jeton: string, _ipDistant?: string): Promise<ResultatVerification> {
    throw new Error('CloudflareTurnstileService.verifier : à implémenter au chantier 1.2.');
  }
}
