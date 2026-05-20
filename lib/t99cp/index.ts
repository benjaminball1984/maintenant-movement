import { MockT99CPService } from './MockT99CPService';
import { PolygonT99CPService } from './PolygonT99CPService';
import type { T99CPService } from './types';

export type {
  ResultatBalance,
  ResultatTransaction,
  StatutTransaction,
  T99CPService,
} from './types';

/**
 * Factory du service T99CP.
 *
 * `T99CP_NETWORK=mock` (défaut) → MockT99CPService.
 * `T99CP_NETWORK=mumbai` ou `polygon_mainnet` → PolygonT99CPService.
 */
let instance: T99CPService | null = null;

function instancierT99CPService(): T99CPService {
  const reseau = process.env.T99CP_NETWORK ?? 'mock';
  switch (reseau) {
    case 'mumbai':
    case 'polygon_mainnet':
      return new PolygonT99CPService();
    case 'mock':
      return new MockT99CPService();
    default:
      throw new Error(
        `T99CP_NETWORK inconnu : "${reseau}". Valeurs attendues : "mock" | "mumbai" | "polygon_mainnet".`,
      );
  }
}

export function getT99CPService(): T99CPService {
  if (instance === null) {
    instance = instancierT99CPService();
  }
  return instance;
}

/** Réinitialise le singleton. Réservé aux tests. */
export function resetT99CPService(): void {
  instance = null;
}
