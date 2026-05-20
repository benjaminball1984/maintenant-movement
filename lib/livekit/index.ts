import { LiveKitRealService } from './LiveKitRealService';
import { MockLiveKitService } from './MockLiveKitService';
import type { LiveKitService } from './types';

export type { JetonAcces, LiveKitService, RoleSalle, SalleCreee } from './types';

/**
 * Factory du service LiveKit.
 *
 * `LIVEKIT_PROVIDER=mock` (défaut) → MockLiveKitService.
 * `LIVEKIT_PROVIDER=livekit` → LiveKitRealService (chantier 7.6).
 */
let instance: LiveKitService | null = null;

function instancierLiveKitService(): LiveKitService {
  const provider = process.env.LIVEKIT_PROVIDER ?? 'mock';
  switch (provider) {
    case 'livekit':
      return new LiveKitRealService();
    case 'mock':
      return new MockLiveKitService();
    default:
      throw new Error(
        `LIVEKIT_PROVIDER inconnu : "${provider}". Valeurs attendues : "mock" | "livekit".`,
      );
  }
}

export function getLiveKitService(): LiveKitService {
  if (instance === null) {
    instance = instancierLiveKitService();
  }
  return instance;
}

/** Réinitialise le singleton. Réservé aux tests. */
export function resetLiveKitService(): void {
  instance = null;
}
