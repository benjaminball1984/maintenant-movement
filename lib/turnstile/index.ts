import { CloudflareTurnstileService } from './CloudflareTurnstileService';
import { MockTurnstileService } from './MockTurnstileService';
import type { TurnstileService } from './types';

export type { ResultatVerification, TurnstileService } from './types';

/**
 * Factory du service Turnstile.
 *
 * `TURNSTILE_PROVIDER=mock` (défaut) → MockTurnstileService.
 * `TURNSTILE_PROVIDER=cloudflare` → CloudflareTurnstileService.
 */
let instance: TurnstileService | null = null;

function instancierTurnstileService(): TurnstileService {
  const provider = process.env.TURNSTILE_PROVIDER ?? 'mock';
  switch (provider) {
    case 'cloudflare':
      return new CloudflareTurnstileService();
    case 'mock':
      return new MockTurnstileService();
    default:
      throw new Error(
        `TURNSTILE_PROVIDER inconnu : "${provider}". Valeurs attendues : "mock" | "cloudflare".`,
      );
  }
}

export function getTurnstileService(): TurnstileService {
  if (instance === null) {
    instance = instancierTurnstileService();
  }
  return instance;
}

/** Réinitialise le singleton. Réservé aux tests. */
export function resetTurnstileService(): void {
  instance = null;
}
