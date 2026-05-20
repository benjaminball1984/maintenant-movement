/**
 * Contrat du service de paiement Maintenant! (chantier 3.3).
 *
 * Usage : dons aux cagnottes (Stripe Checkout + Stripe Connect KYC pour
 * les porteur·euses qui reçoivent les fonds). Cf. CLAUDE.md §6 pour le
 * pattern adapter (mock par défaut, Stripe en prod).
 *
 * Switch via `PAYMENT_PROVIDER` :
 *   - `mock`        (défaut) : MockPaymentService simule le succès/échec.
 *   - `stripe_test` (prod test) : Stripe en mode test (clés sk_test_...).
 *   - `stripe_live` (prod réelle) : Stripe en mode live.
 *
 * Les frais sont calculés côté app (5 % sur EUR, 0 % sur T99CP) avant
 * d'appeler le service.
 */

export interface DonneesCheckout {
  /** Montant brut à débiter (centimes d'euros). Frais inclus. */
  montantTotalCentimes: number;
  /** Devise ISO 4217. Pour 3.3 v1, uniquement `EUR`. */
  devise: 'EUR';
  /** Adresse email du donateur (pour reçu Stripe). */
  email: string | null;
  /** URL absolue de retour en cas de succès. */
  urlSucces: string;
  /** URL absolue de retour en cas d'annulation. */
  urlAnnulation: string;
  /** Identifiant Stripe Connect du compte connecté qui reçoit les fonds. */
  stripeAccountId: string;
  /** Frais de plateforme retenus par Maintenant! (centimes d'euros). */
  fraisPlateformeCentimes: number;
  /** Métadonnées à passer à Stripe (utilisées pour relier au webhook). */
  metadonnees: Record<string, string>;
}

export interface ResultatCheckout {
  /** Identifiant de la session Stripe Checkout (ou identifiant mock). */
  sessionId: string;
  /** URL vers laquelle rediriger le navigateur de l'usager·ère. */
  urlRedirection: string;
  /** Indique si la session est réelle (Stripe) ou mockée. */
  estReelle: boolean;
}

export interface StatutPaiement {
  /** Identifiant Stripe Checkout Session. */
  sessionId: string;
  /** True si paiement confirmé (status = `complete` + payment_intent succeeded). */
  estConfirme: boolean;
  /** Payment Intent associé une fois la session terminée. */
  paymentIntentId: string | null;
  /** Montant effectivement reçu (utile pour audit ; centimes d'euros). */
  montantReçuCentimes: number | null;
}

export interface DonneesCompteConnecte {
  /** Adresse email du porteur (pour onboarding Stripe). */
  email: string;
  /** URL absolue de retour après onboarding. */
  urlRetour: string;
  /** URL absolue d'expiration / interruption d'onboarding. */
  urlRecharge: string;
}

export interface ResultatCompteConnecte {
  stripeAccountId: string;
  /** URL d'onboarding vers laquelle rediriger pour KYC. */
  urlOnboarding: string;
  estReelle: boolean;
}

export interface PaymentService {
  /**
   * Démarre une Stripe Checkout Session pour un don à une cagnotte.
   * Le compte connecté du porteur reçoit le montant net (montant total
   * − frais de plateforme), Stripe prélève ses frais standard.
   */
  demarrerCheckout(donnees: DonneesCheckout): Promise<ResultatCheckout>;

  /**
   * Récupère l'état d'une session Checkout (pour la page de retour
   * succès qui peut afficher un récap immédiat sans attendre le webhook).
   */
  verifierPaiement(sessionId: string): Promise<StatutPaiement>;

  /**
   * Démarre l'onboarding Stripe Connect (Express) pour un nouveau
   * porteur qui veut recevoir des dons en euros. Retourne l'URL où
   * rediriger pour le KYC.
   */
  creerCompteConnecte(donnees: DonneesCompteConnecte): Promise<ResultatCompteConnecte>;
}
