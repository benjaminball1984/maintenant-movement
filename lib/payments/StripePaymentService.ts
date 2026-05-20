import type {
  DonneesCheckout,
  DonneesCompteConnecte,
  PaymentService,
  ResultatCheckout,
  ResultatCompteConnecte,
  StatutPaiement,
} from './types';

/**
 * Implémentation réelle du service de paiement avec Stripe.
 *
 * **STATUT** : stub. L'implémentation effective sera branchée au moment
 * où `PAYMENT_PROVIDER` passe sur `stripe_test` (chantier de polish
 * 11.x ou plus tôt si Lilou/Ben fournit les clés `sk_test_...`).
 *
 * Pour 3.3 v1, on lève une `Error` explicite si quelqu'un tente
 * d'utiliser ce service sans branchement : ça permet aux tests
 * automatisés de vérifier que la factory choisit bien Mock en l'absence
 * de configuration, et ça donne un message clair en cas de mauvaise
 * config en prod.
 *
 * Plan de branchement (pour mémoire) :
 *   - `stripe.checkout.sessions.create({...})` pour `demarrerCheckout`,
 *      avec `payment_intent_data.application_fee_amount = fraisPlateformeCentimes`
 *      et `payment_intent_data.transfer_data.destination = stripeAccountId`.
 *   - `stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] })`
 *      pour `verifierPaiement`.
 *   - `stripe.accounts.create({type: 'express', country: 'FR', email})` +
 *     `stripe.accountLinks.create({account, type: 'account_onboarding', ...})`
 *     pour `creerCompteConnecte`.
 */
export class StripePaymentService implements PaymentService {
  async demarrerCheckout(_donnees: DonneesCheckout): Promise<ResultatCheckout> {
    throw new Error(
      'StripePaymentService non implémenté. Brancher la dépendance `stripe` et utiliser `PAYMENT_PROVIDER=mock` en attendant. Voir lib/payments/StripePaymentService.ts.',
    );
  }

  async verifierPaiement(_sessionId: string): Promise<StatutPaiement> {
    throw new Error('StripePaymentService.verifierPaiement non implémenté.');
  }

  async creerCompteConnecte(_donnees: DonneesCompteConnecte): Promise<ResultatCompteConnecte> {
    throw new Error('StripePaymentService.creerCompteConnecte non implémenté.');
  }
}
