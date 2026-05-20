import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { EmailService, EmailTransactionnel, ResultatEnvoi, TagsNewsletter } from './types';

/**
 * Implémentation mock du service Email.
 *
 * Trace dans la console + persiste chaque envoi en JSON sous `var/emails/`.
 * Permet aux flux d'inscription, magic link, reçus, etc. de tourner en
 * local sans clé Brevo, et aux tests E2E d'inspecter ce qui a été envoyé.
 */
export class MockEmailService implements EmailService {
  private readonly dossierSortie = join(process.cwd(), 'var', 'emails');

  async envoyerTransactionnel(email: EmailTransactionnel): Promise<ResultatEnvoi> {
    const messageId = `mock-${randomUUID()}`;
    await this.persister('transactionnel', { messageId, ...email });
    // biome-ignore lint/suspicious/noConsoleLog: trace explicite du mock en dev.
    console.log(`[MockEmail] transactionnel -> ${email.destinataire} : ${email.sujet}`);
    return { messageId, estReel: false };
  }

  async inscrireNewsletter(email: string, tags: TagsNewsletter): Promise<void> {
    await this.persister('newsletter-inscription', { email, tags });
    // biome-ignore lint/suspicious/noConsoleLog: trace explicite du mock en dev.
    console.log(`[MockEmail] newsletter inscrit ${email} avec tags`, tags);
  }

  async desinscrireNewsletter(email: string): Promise<void> {
    await this.persister('newsletter-desinscription', { email });
    // biome-ignore lint/suspicious/noConsoleLog: trace explicite du mock en dev.
    console.log(`[MockEmail] newsletter désinscrit ${email}`);
  }

  private async persister(type: string, charge: unknown): Promise<void> {
    await mkdir(this.dossierSortie, { recursive: true });
    const horodatage = new Date().toISOString().replace(/[:.]/g, '-');
    const fichier = join(this.dossierSortie, `${horodatage}-${type}.json`);
    await writeFile(
      fichier,
      JSON.stringify(
        { type, date: new Date().toISOString(), ...((charge as object) ?? {}) },
        null,
        2,
      ),
      'utf-8',
    );
  }
}
