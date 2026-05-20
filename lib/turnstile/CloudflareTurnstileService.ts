import type { ResultatVerification, TurnstileService } from './types';

/**
 * Implémentation Cloudflare Turnstile.
 *
 * Endpoint : POST `https://challenges.cloudflare.com/turnstile/v0/siteverify`
 * avec `secret`, `response` (token) et `remoteip` (optionnel).
 *
 * Documentation : https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * Réponse standard :
 *   { "success": true, "challenge_ts": "...", "hostname": "...", "error-codes": [] }
 */
const ENDPOINT_VERIFICATION = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface ReponseCloudflare {
  success: boolean;
  'error-codes'?: string[];
}

export class CloudflareTurnstileService implements TurnstileService {
  async verifier(jeton: string, ipDistant?: string): Promise<ResultatVerification> {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (secret === undefined || secret === '') {
      throw new Error(
        'TURNSTILE_SECRET_KEY manquante. Configurer dans .env.local ou repasser TURNSTILE_PROVIDER=mock.',
      );
    }

    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('response', jeton);
    if (ipDistant !== undefined) {
      formData.append('remoteip', ipDistant);
    }

    const reponse = await fetch(ENDPOINT_VERIFICATION, {
      method: 'POST',
      body: formData,
    });

    if (!reponse.ok) {
      return { succes: false, codesErreur: [`http-${reponse.status}`] };
    }

    const donnees = (await reponse.json()) as ReponseCloudflare;
    return {
      succes: donnees.success === true,
      codesErreur: donnees['error-codes'] ?? [],
    };
  }
}
