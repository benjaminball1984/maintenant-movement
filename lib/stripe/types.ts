/**
 * Contrat du service de paiement (Stripe Checkout + Stripe Connect).
 *
 * Usages :
 * - **Checkout** : adhésion 12 €, dons cagnotte en euros.
 * - **Connect** : versement aux porteur·euses de cagnottes (KYC requis).
 *
 * Frais : 5 % sur les euros (absorbés par la donatrice), 0 % sur les T99CP
 * (géré par `lib/t99cp/`).
 *
 * Switch via `PAYMENT_PROVIDER` : `mock` (défaut) | `stripe_test` | `stripe_live`.
 */
export interface DemandeCheckout {
  /** Montant en centimes d'euro. */
  montantCentimes: number;
  /** Description visible côté Stripe Checkout (ex : « Adhésion 2026 »). */
  description: string;
  /** URL de retour après succès. */
  urlSucces: string;
  /** URL de retour après annulation. */
  urlAnnulation: string;
  /** Référence interne (id transaction Maintenant!). */
  referenceInterne: string;
  /** Email pré-rempli (optionnel). */
  emailClient?: string;
}

export interface SessionCheckout {
  sessionId: string;
  urlPaiement: string;
  /** Indique si la session est réelle (Stripe) ou mockée. */
  estReelle: boolean;
}

export interface EvenementWebhook {
  type: string;
  payload: unknown;
}

export interface PaymentService {
  creerSessionCheckout(demande: DemandeCheckout): Promise<SessionCheckout>;
  verifierWebhook(corpsBrut: string, signature: string): Promise<EvenementWebhook>;
  /** Crée un compte Stripe Connect pour un·e porteur·euse de cagnotte. */
  creerCompteConnect(
    emailPorteur: string,
    urlRetour: string,
  ): Promise<{
    accountId: string;
    urlOnboarding: string;
  }>;
}
