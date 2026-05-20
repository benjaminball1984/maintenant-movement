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

  beforeEach(async () => {
    const { resetPaymentService } = await import('@/lib/payments/index');
    resetPaymentService();
  });

  afterEach(() => {
    process.env.PAYMENT_PROVIDER = originalEnv;
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
