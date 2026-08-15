import Stripe from 'stripe';
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
 * Écrite le 01/08/2026. Jusque-là ce fichier était un stub qui levait une
 * erreur : le site tournait donc en ligne sur `MockPaymentService`, où un
 * don « confirmé » s'enregistrait sans qu'aucun euro ne bouge. Décision
 * de Lilou/Ben : brancher Stripe pour de vrai.
 *
 * ## Ce que fait ce service
 *
 * - **Un don à une cagnotte** part vers Stripe Checkout (la page de
 *   paiement hébergée par Stripe : on ne voit jamais le numéro de carte,
 *   c'est ce qui nous évite toute obligation de certification bancaire).
 * - Les fonds vont sur le **compte connecté** du porteur de cagnotte
 *   (Stripe Connect), et Maintenant! retient au passage sa commission
 *   (`application_fee_amount`), calculée en amont par `lib/frais.ts`.
 * - **L'onboarding d'un porteur** (vérification d'identité imposée par la
 *   réglementation) se fait chez Stripe, via un lien à usage unique.
 *
 * ## Environnement Cloudflare Workers
 *
 * Le site tourne sur Cloudflare Workers, où les API réseau de Node.js
 * n'existent pas. On force donc le client HTTP « fetch » du SDK Stripe,
 * seul compatible ; sans lui, chaque appel échouerait à l'exécution.
 *
 * ## Clés attendues
 *
 * - `STRIPE_SECRET_KEY` — clé secrète (`sk_test_…` ou `sk_live_…`).
 * - `PAYMENT_PROVIDER` — `stripe_test` ou `stripe_live` pour activer ce
 *   service (cf. `lib/payments/index.ts`).
 *
 * Tant que ces clés ne sont pas posées, {@link paiementReelDisponible}
 * renvoie `false` et l'interface masque les boutons de paiement : on ne
 * retombe jamais silencieusement sur le simulateur.
 */
export class StripePaymentService implements PaymentService {
  private readonly stripe: Stripe;

  constructor() {
    const cle = process.env.STRIPE_SECRET_KEY;
    if (cle === undefined || cle === '') {
      throw new Error(
        'STRIPE_SECRET_KEY manquante alors que PAYMENT_PROVIDER demande Stripe. Poser la clé (npx wrangler secret put STRIPE_SECRET_KEY) ou repasser PAYMENT_PROVIDER sur "mock".',
      );
    }

    this.stripe = new Stripe(cle, {
      // Client HTTP compatible Cloudflare Workers (cf. en-tête).
      httpClient: Stripe.createFetchHttpClient(),
      // On épingle la version d'API : une évolution côté Stripe ne doit
      // pas changer le comportement du site sans qu'on l'ait décidé.
      apiVersion: '2026-07-29.dahlia',
    });
  }

  /**
   * Ouvre une session de paiement pour un don.
   *
   * `transfer_data.destination` envoie l'argent au porteur ;
   * `application_fee_amount` retient la part de la plateforme. Les deux
   * sont posés sur le paiement lui-même, pas sur la session : c'est ce
   * que Stripe attend pour un paiement « direct au vendeur ».
   */
  async demarrerCheckout(donnees: DonneesCheckout): Promise<ResultatCheckout> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      // Stripe n'accepte que des minuscules pour la devise.
      line_items: [
        {
          price_data: {
            currency: donnees.devise.toLowerCase(),
            unit_amount: donnees.montantTotalCentimes,
            product_data: { name: 'Don à Maintenant!' },
          },
          quantity: 1,
        },
      ],
      customer_email: donnees.email ?? undefined,
      success_url: donnees.urlSucces,
      cancel_url: donnees.urlAnnulation,
      payment_intent_data: {
        application_fee_amount: donnees.fraisPlateformeCentimes,
        transfer_data: { destination: donnees.stripeAccountId },
      },
      metadata: donnees.metadonnees,
    });

    if (session.url === null) {
      throw new Error(
        `Stripe n'a pas renvoyé d'URL de paiement pour la session ${session.id}. Don non démarré.`,
      );
    }

    return { sessionId: session.id, urlRedirection: session.url, estReelle: true };
  }

  /**
   * Lit l'état d'une session de paiement.
   *
   * On considère un don confirmé quand la session est `complete` **et**
   * que le paiement est `paid` : une session peut être terminée sans que
   * l'argent soit arrivé (paiement différé, virement en attente).
   */
  async verifierPaiement(sessionId: string): Promise<StatutPaiement> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    const estConfirme = session.status === 'complete' && session.payment_status === 'paid';

    // `payment_intent` est soit une chaîne (non dépliée), soit l'objet.
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);

    return {
      sessionId: session.id,
      estConfirme,
      paymentIntentId,
      montantReçuCentimes: session.amount_total,
    };
  }

  /**
   * Crée un compte connecté « Express » et son lien d'onboarding.
   *
   * Express = Stripe héberge le formulaire de vérification d'identité et
   * le tableau de bord du porteur. C'est le mode le plus simple, et le
   * seul qui n'oblige pas Maintenant! à collecter des pièces d'identité.
   *
   * Le lien d'onboarding expire : `urlRecharge` est l'adresse où Stripe
   * renvoie la personne pour en redemander un neuf.
   */
  async creerCompteConnecte(donnees: DonneesCompteConnecte): Promise<ResultatCompteConnecte> {
    const compte = await this.stripe.accounts.create({
      type: 'express',
      country: 'FR',
      email: donnees.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    const lien = await this.stripe.accountLinks.create({
      account: compte.id,
      type: 'account_onboarding',
      return_url: donnees.urlRetour,
      refresh_url: donnees.urlRecharge,
    });

    return { stripeAccountId: compte.id, urlOnboarding: lien.url, estReelle: true };
  }
}
