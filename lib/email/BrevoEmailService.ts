import type { EmailService, EmailTransactionnel, ResultatEnvoi, TagsNewsletter } from './types';

/**
 * Implémentation Brevo du service Email.
 *
 * Volontairement non implémentée au chantier 0.1 : l'API Brevo n'est pas
 * encore branchée et la pose réelle se fait au chantier 1.2 (validation
 * email + magic link) et au chantier 8.1 (newsletter taggée 3 axes).
 *
 * Le stub `throw` est explicite : si quelqu'un règle `EMAIL_PROVIDER=brevo`
 * avant le chantier 1.2, l'erreur est immédiate et claire.
 */
export class BrevoEmailService implements EmailService {
  envoyerTransactionnel(_email: EmailTransactionnel): Promise<ResultatEnvoi> {
    throw new Error('BrevoEmailService.envoyerTransactionnel : à implémenter au chantier 1.2.');
  }

  inscrireNewsletter(_email: string, _tags: TagsNewsletter): Promise<void> {
    throw new Error('BrevoEmailService.inscrireNewsletter : à implémenter au chantier 8.1.');
  }

  desinscrireNewsletter(_email: string): Promise<void> {
    throw new Error('BrevoEmailService.desinscrireNewsletter : à implémenter au chantier 8.1.');
  }
}
