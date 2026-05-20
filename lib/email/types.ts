/**
 * Contrat du service Email pour Maintenant!.
 *
 * Deux usages distincts :
 * - **transactionnel** : confirmations, magic links, reçus, alertes.
 * - **newsletter** : inscription, désinscription, tags Brevo.
 *
 * Implémentations :
 * - `MockEmailService` : log console + persistance JSON dans `var/emails/`.
 *   Permet de tester les flux d'envoi sans clé Brevo.
 * - `BrevoEmailService` : à implémenter au chantier 1.2.
 *
 * Switch via `EMAIL_PROVIDER` dans `.env`.
 */
export interface EmailTransactionnel {
  /** Destinataire principal (un seul, pas de CC pour l'instant). */
  destinataire: string;
  /** Objet du mail. */
  sujet: string;
  /** Corps HTML (gabarits stockés ailleurs, voir `lib/email/templates/`). */
  html: string;
  /** Version texte fallback. Optionnelle mais recommandée pour l'accessibilité. */
  texte?: string;
}

export interface ResultatEnvoi {
  messageId: string;
  /** Indique si l'envoi est réel (Brevo) ou mocké. */
  estReel: boolean;
}

/** Tags newsletter (3 axes, cf. 01_ARCHITECTURE.md §10). */
export interface TagsNewsletter {
  /** D'où vient l'inscription (ex : `petition-NN`, `formulaire-home`). */
  origine: string;
  /** À quoi la personne s'est inscrite (ex : `campagne-XX`). Optionnel. */
  action?: string;
  /** Département (calculé depuis le code postal). */
  departement?: string;
}

export interface EmailService {
  envoyerTransactionnel(email: EmailTransactionnel): Promise<ResultatEnvoi>;
  inscrireNewsletter(email: string, tags: TagsNewsletter): Promise<void>;
  desinscrireNewsletter(email: string): Promise<void>;
}
