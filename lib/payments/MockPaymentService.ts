import { randomUUID } from 'node:crypto';
import type {
  DonneesCheckout,
  DonneesCompteConnecte,
  PaymentService,
  ResultatCheckout,
  ResultatCompteConnecte,
  StatutPaiement,
} from './types';

/**
 * Implémentation mock du service de paiement (chantier 3.3).
 *
 * Comportement : simule le flux Stripe Checkout en local pour permettre
 * de développer et tester le parcours don sans connecter Stripe.
 *
 * - `demarrerCheckout` retourne une URL fictive `/dons/mock/<sessionId>`
 *   qu'on intercepte côté page (rendue par `app/(public)/dons/mock/[sessionId]`).
 *   Cette page propose deux boutons (Confirmer / Annuler) qui remontent
 *   l'état via les webhooks mockés.
 * - `verifierPaiement` retourne `estConfirme: true` pour tous les
 *   sessionIds qui commencent par `cs_mock_confirme_`, false sinon.
 * - `creerCompteConnecte` retourne un identifiant `acct_mock_<uuid>`
 *   et une URL fictive d'onboarding.
 *
 * On log chaque appel sur la console pour faciliter le debug local.
 */
export class MockPaymentService implements PaymentService {
  async demarrerCheckout(donnees: DonneesCheckout): Promise<ResultatCheckout> {
    const sessionId = `cs_mock_confirme_${randomUUID()}`;
    const urlRedirection = `/dons/mock/${sessionId}?succes=${encodeURIComponent(
      donnees.urlSucces,
    )}&annulation=${encodeURIComponent(donnees.urlAnnulation)}`;

    // Journal local : utile pour valider de bout en bout en dev.
    console.info('[MockPaymentService.demarrerCheckout]', {
      sessionId,
      montantTotalCentimes: donnees.montantTotalCentimes,
      fraisPlateformeCentimes: donnees.fraisPlateformeCentimes,
      stripeAccountId: donnees.stripeAccountId,
      metadonnees: donnees.metadonnees,
    });

    return { sessionId, urlRedirection, estReelle: false };
  }

  async verifierPaiement(sessionId: string): Promise<StatutPaiement> {
    const estConfirme = sessionId.startsWith('cs_mock_confirme_');
    return {
      sessionId,
      estConfirme,
      paymentIntentId: estConfirme ? `pi_mock_${sessionId.slice(-8)}` : null,
      montantReçuCentimes: estConfirme ? null : null,
    };
  }

  async creerCompteConnecte(donnees: DonneesCompteConnecte): Promise<ResultatCompteConnecte> {
    const stripeAccountId = `acct_mock_${randomUUID()}`;
    const urlOnboarding = `/dons/mock/onboarding/${stripeAccountId}?retour=${encodeURIComponent(
      donnees.urlRetour,
    )}`;
    console.info('[MockPaymentService.creerCompteConnecte]', {
      stripeAccountId,
      email: donnees.email,
    });
    return { stripeAccountId, urlOnboarding, estReelle: false };
  }
}
