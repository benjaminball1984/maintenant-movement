import { getEmailService, resetEmailService } from '@/lib/email';
import { getLiveKitService, resetLiveKitService } from '@/lib/livekit';
import { getPaymentService, resetPaymentService } from '@/lib/stripe';
import { getT99CPService, resetT99CPService } from '@/lib/t99cp';
import { getTurnstileService, resetTurnstileService } from '@/lib/turnstile';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Garantit que toutes les factories de services externes :
 * 1. retournent une implémentation `Mock` quand `*_PROVIDER` vaut `mock`
 *    (ou n'est pas défini),
 * 2. lancent une erreur explicite sur une valeur de provider invalide,
 * 3. respectent le singleton (deuxième appel = même instance).
 *
 * C'est ce qui garantit que le site tourne en local sans clé d'API et
 * que tout réglage erroné échoue tôt et lisiblement (cf. CLAUDE.md §6).
 */
const variables = [
  'EMAIL_PROVIDER',
  'PAYMENT_PROVIDER',
  'T99CP_NETWORK',
  'LIVEKIT_PROVIDER',
  'TURNSTILE_PROVIDER',
] as const;

describe('factories de services externes', () => {
  const sauvegarde: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const variable of variables) {
      sauvegarde[variable] = process.env[variable];
      delete process.env[variable];
    }
    resetEmailService();
    resetPaymentService();
    resetT99CPService();
    resetLiveKitService();
    resetTurnstileService();
  });

  afterEach(() => {
    for (const variable of variables) {
      const ancienneValeur = sauvegarde[variable];
      if (ancienneValeur === undefined) {
        delete process.env[variable];
      } else {
        process.env[variable] = ancienneValeur;
      }
    }
  });

  it('retourne un mock par défaut quand EMAIL_PROVIDER est absent', () => {
    const service = getEmailService();
    expect(service.constructor.name).toBe('MockEmailService');
  });

  it('retourne un mock par défaut quand PAYMENT_PROVIDER est absent', () => {
    const service = getPaymentService();
    expect(service.constructor.name).toBe('MockPaymentService');
  });

  it('retourne un mock par défaut quand T99CP_NETWORK est absent', () => {
    const service = getT99CPService();
    expect(service.constructor.name).toBe('MockT99CPService');
  });

  it('retourne un mock par défaut quand LIVEKIT_PROVIDER est absent', () => {
    const service = getLiveKitService();
    expect(service.constructor.name).toBe('MockLiveKitService');
  });

  it('retourne un mock par défaut quand TURNSTILE_PROVIDER est absent', () => {
    const service = getTurnstileService();
    expect(service.constructor.name).toBe('MockTurnstileService');
  });

  it('lance une erreur sur EMAIL_PROVIDER invalide', () => {
    process.env.EMAIL_PROVIDER = 'inconnu';
    expect(() => getEmailService()).toThrow(/EMAIL_PROVIDER inconnu/);
  });

  it('respecte le singleton entre deux appels', () => {
    const a = getEmailService();
    const b = getEmailService();
    expect(a).toBe(b);
  });
});
