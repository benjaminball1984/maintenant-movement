import type { LiveTwitch, TwitchService } from './types';

/**
 * Implémentation mock : aucune clé Twitch → aucun direct. La rubrique
 * « Lives » reste simplement vide (cohérent avec le pattern adapter du
 * projet : le site tourne sans clé externe).
 */
export class MockTwitchService implements TwitchService {
  async chainesEnDirect(_handles: string[]): Promise<LiveTwitch[]> {
    return [];
  }
}
