import { MockTwitchService } from './MockTwitchService';
import { TwitchHelixService } from './TwitchHelixService';
import type { TwitchService } from './types';

/**
 * Factory de l'adapter Twitch. Renvoie l'implémentation réelle (Helix) si les
 * clés `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` sont présentes, sinon le
 * mock (rubrique « Lives » vide). Cohérent avec les autres factories du repo.
 */
export function getTwitchService(): TwitchService {
  const id = process.env.TWITCH_CLIENT_ID;
  const secret = process.env.TWITCH_CLIENT_SECRET;
  if (id !== undefined && id !== '' && secret !== undefined && secret !== '') {
    return new TwitchHelixService();
  }
  return new MockTwitchService();
}

export type { LiveTwitch, TwitchService } from './types';
