import { paiementReelDisponible } from '@/lib/payments';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Ce garde-fou est la dernière barrière entre un visiteur et un faux
 * encaissement. On le teste dans les deux sens : il doit dire « non »
 * dès qu'il manque quoi que ce soit.
 */
describe('paiementReelDisponible', () => {
  const provider = process.env.PAYMENT_PROVIDER;
  const cle = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    // `delete` et non `= undefined` : en Node, affecter `undefined` à une
    // variable d'environnement y écrit la chaîne "undefined", qui passerait
    // pour une clé valide. C'est le seul moyen de simuler une variable
    // réellement absente, ce que ce test doit vérifier.
    // biome-ignore lint/performance/noDelete: seul moyen de retirer une variable d'environnement ; hors chemin critique (test).
    delete process.env.PAYMENT_PROVIDER;
    // biome-ignore lint/performance/noDelete: idem.
    delete process.env.STRIPE_SECRET_KEY;
  });

  afterEach(() => {
    process.env.PAYMENT_PROVIDER = provider;
    process.env.STRIPE_SECRET_KEY = cle;
  });

  it('refuse quand rien n’est configuré', () => {
    expect(paiementReelDisponible()).toBe(false);
  });

  it('refuse le simulateur, même avec une clé', () => {
    process.env.PAYMENT_PROVIDER = 'mock';
    process.env.STRIPE_SECRET_KEY = 'sk_test_exemple';
    expect(paiementReelDisponible()).toBe(false);
  });

  it('refuse Stripe sans clé secrète', () => {
    process.env.PAYMENT_PROVIDER = 'stripe_live';
    expect(paiementReelDisponible()).toBe(false);
  });

  it('refuse Stripe avec une clé vide', () => {
    process.env.PAYMENT_PROVIDER = 'stripe_live';
    process.env.STRIPE_SECRET_KEY = '';
    expect(paiementReelDisponible()).toBe(false);
  });

  it('accepte Stripe en test et en live avec une clé', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_exemple';
    process.env.PAYMENT_PROVIDER = 'stripe_test';
    expect(paiementReelDisponible()).toBe(true);

    process.env.PAYMENT_PROVIDER = 'stripe_live';
    expect(paiementReelDisponible()).toBe(true);
  });
});
