import { randomUUID } from 'node:crypto';
import type { DemandeCheckout, EvenementWebhook, PaymentService, SessionCheckout } from './types';

/**
 * Mock du service de paiement.
 *
 * - `creerSessionCheckout` retourne une URL fictive qui pointe vers la page
 *   d'annulation (à modifier au chantier 3.3 pour simuler aussi le succès).
 * - `verifierWebhook` accepte n'importe quel payload et le retourne tel quel.
 * - `creerCompteConnect` retourne un ID fictif et une URL d'onboarding bidon.
 */
export class MockPaymentService implements PaymentService {
  async creerSessionCheckout(demande: DemandeCheckout): Promise<SessionCheckout> {
    const sessionId = `mock-cs-${randomUUID()}`;
    // biome-ignore lint/suspicious/noConsoleLog: trace explicite du mock en dev.
    console.log(
      `[MockPayment] Checkout créé : ${demande.montantCentimes} centimes pour ${demande.description}`,
    );
    return {
      sessionId,
      urlPaiement: `${demande.urlSucces}?mock_session=${sessionId}`,
      estReelle: false,
    };
  }

  async verifierWebhook(corpsBrut: string, _signature: string): Promise<EvenementWebhook> {
    // En mock, on accepte tout payload JSON. Le test peut forcer un événement.
    let payload: unknown;
    try {
      payload = JSON.parse(corpsBrut) as unknown;
    } catch {
      payload = { brut: corpsBrut };
    }
    return { type: 'mock.event', payload };
  }

  async creerCompteConnect(emailPorteur: string, urlRetour: string) {
    const accountId = `mock-acct-${randomUUID()}`;
    // biome-ignore lint/suspicious/noConsoleLog: trace explicite du mock en dev.
    console.log(`[MockPayment] Connect ${accountId} pour ${emailPorteur}`);
    return {
      accountId,
      urlOnboarding: `${urlRetour}?mock_account=${accountId}`,
    };
  }
}
