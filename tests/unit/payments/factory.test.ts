import { MockPaymentService } from '@/lib/payments/MockPaymentService';
import { StripePaymentService } from '@/lib/payments/StripePaymentService';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Tests de la factory PaymentService (chantier 3.3).
 *
 * Note : on importe la factory dynamiquement à chaque test pour
 * réinitialiser le singleton qui mémoïse l'instance.
 */
async function chargerFactoryFraiche() {
  const mod = await import('@/lib/payments/index');
  mod.resetPaymentService();
  return mod;
}

describe('getPaymentService factory', () => {
  const originalEnv = process.env.PAYMENT_PROVIDER;
  const originalCle = process.env.STRIPE_SECRET_KEY;

  beforeEach(async () => {
    // Depuis le branchement réel de Stripe (01/08/2026), le constructeur
    // exige une clé secrète. On en pose une factice : la factory ne fait
    // qu'instancier, aucun appel réseau n'est émis ici.
    process.env.STRIPE_SECRET_KEY = 'sk_test_factice_pour_les_tests';
    const { resetPaymentService } = await import('@/lib/payments/index');
    resetPaymentService();
  });

  afterEach(() => {
    process.env.PAYMENT_PROVIDER = originalEnv;
    if (originalCle === undefined) {
      // biome-ignore lint/performance/noDelete: seul moyen de retirer une variable d'environnement ; hors chemin critique (test).
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = originalCle;
    }
  });

  it('PAYMENT_PROVIDER=mock (défaut) → MockPaymentService', async () => {
    process.env.PAYMENT_PROVIDER = 'mock';
    const { getPaymentService } = await chargerFactoryFraiche();
    expect(getPaymentService()).toBeInstanceOf(MockPaymentService);
  });

  it('PAYMENT_PROVIDER=stripe_test → StripePaymentService', async () => {
    process.env.PAYMENT_PROVIDER = 'stripe_test';
    const { getPaymentService } = await chargerFactoryFraiche();
    expect(getPaymentService()).toBeInstanceOf(StripePaymentService);
  });

  it('PAYMENT_PROVIDER=stripe_live → StripePaymentService', async () => {
    process.env.PAYMENT_PROVIDER = 'stripe_live';
    const { getPaymentService } = await chargerFactoryFraiche();
    expect(getPaymentService()).toBeInstanceOf(StripePaymentService);
  });

  it('PAYMENT_PROVIDER inconnu → throw', async () => {
    process.env.PAYMENT_PROVIDER = 'paypal';
    const { getPaymentService } = await chargerFactoryFraiche();
    expect(() => getPaymentService()).toThrow(/inconnu/);
  });
});
