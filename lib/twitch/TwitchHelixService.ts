import { chunk } from '@/lib/chunk';
import type { LiveTwitch, TwitchService } from './types';

/**
 * Implémentation réelle via l'API Twitch Helix (server-to-server,
 * client_credentials). Récupère un app access token (mis en cache en mémoire
 * jusqu'à son expiration), puis interroge `helix/streams` par lots de 100
 * `user_login` pour savoir qui est EN DIRECT.
 *
 * Best-effort : toute erreur réseau/API renvoie [] (rubrique Lives vide
 * plutôt que page en erreur).
 */

interface JetonCache {
  jeton: string;
  expireMs: number;
}
let cacheJeton: JetonCache | null = null;

interface StreamHelix {
  user_login: string;
  user_name: string;
  title: string;
  game_name: string;
  viewer_count: number;
  thumbnail_url: string;
  language: string;
}

export class TwitchHelixService implements TwitchService {
  private async jetonApplication(id: string, secret: string): Promise<string | null> {
    // 60 s de marge avant expiration réelle.
    if (cacheJeton !== null && cacheJeton.expireMs > Date.now() + 60_000) {
      return cacheJeton.jeton;
    }
    try {
      const r = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: id,
          client_secret: secret,
          grant_type: 'client_credentials',
        }),
      });
      if (!r.ok) return null;
      const data = (await r.json()) as { access_token?: string; expires_in?: number };
      if (typeof data.access_token !== 'string') return null;
      cacheJeton = {
        jeton: data.access_token,
        expireMs: Date.now() + (data.expires_in ?? 3600) * 1000,
      };
      return cacheJeton.jeton;
    } catch {
      return null;
    }
  }

  async chainesEnDirect(handles: string[]): Promise<LiveTwitch[]> {
    const id = process.env.TWITCH_CLIENT_ID;
    const secret = process.env.TWITCH_CLIENT_SECRET;
    if (id === undefined || id === '' || secret === undefined || secret === '') return [];
    const jeton = await this.jetonApplication(id, secret);
    if (jeton === null) return [];
    const entetes = { 'Client-Id': id, Authorization: `Bearer ${jeton}` };

    const enDirect: LiveTwitch[] = [];
    for (const lot of chunk(handles, 100)) {
      try {
        const qs = lot.map((h) => `user_login=${encodeURIComponent(h)}`).join('&');
        const r = await fetch(`https://api.twitch.tv/helix/streams?${qs}&first=100`, {
          headers: entetes,
        });
        if (!r.ok) continue;
        const data = (await r.json()) as { data?: StreamHelix[] };
        for (const s of data.data ?? []) {
          enDirect.push({
            handle: s.user_login,
            nom: s.user_name,
            titre: s.title,
            jeu: s.game_name,
            viewers: s.viewer_count,
            vignetteUrl:
              typeof s.thumbnail_url === 'string' && s.thumbnail_url !== ''
                ? s.thumbnail_url.replace('{width}', '440').replace('{height}', '248')
                : null,
            langue: s.language,
          });
        }
      } catch {
        // lot en échec : on passe au suivant
      }
    }
    return enDirect;
  }
}
