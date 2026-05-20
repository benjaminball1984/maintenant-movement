import { BrevoEmailService } from './BrevoEmailService';
import { MockEmailService } from './MockEmailService';
import type { EmailService } from './types';

export type { EmailService, EmailTransactionnel, ResultatEnvoi, TagsNewsletter } from './types';

/**
 * Factory du service Email.
 *
 * Instanciation paresseuse (singleton par process). Aucune connexion n'est
 * ouverte au chargement du module : le client réel n'est créé que si une
 * méthode est appelée.
 *
 * `EMAIL_PROVIDER=mock` (défaut) → MockEmailService.
 * `EMAIL_PROVIDER=brevo` → BrevoEmailService (à partir du chantier 1.2).
 */
let instance: EmailService | null = null;

function instancierEmailService(): EmailService {
  const provider = process.env.EMAIL_PROVIDER ?? 'mock';
  switch (provider) {
    case 'brevo':
      return new BrevoEmailService();
    case 'mock':
      return new MockEmailService();
    default:
      throw new Error(
        `EMAIL_PROVIDER inconnu : "${provider}". Valeurs attendues : "mock" | "brevo".`,
      );
  }
}

export function getEmailService(): EmailService {
  if (instance === null) {
    instance = instancierEmailService();
  }
  return instance;
}

/** Réinitialise le singleton. Réservé aux tests. */
export function resetEmailService(): void {
  instance = null;
}
