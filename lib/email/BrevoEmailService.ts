import type { EmailService, EmailTransactionnel, ResultatEnvoi, TagsNewsletter } from './types';

/**
 * Implémentation Brevo (anciennement Sendinblue) du service Email.
 *
 * Pour les mails d'authentification (validation email, magic link, reset
 * mot de passe) on utilise les emails Supabase Auth (configurer Brevo
 * comme SMTP côté projet Supabase). Ce service est donc utilisé pour :
 *   - le mardi récap personnel (chantier 8.1)
 *   - la newsletter vendredi (chantier 8.1)
 *   - les reçus fiscaux (chantier 3.3)
 *   - tout autre mail transactionnel métier (notifications, alertes admin)
 *
 * Voir ADR-007 pour le partage Supabase Auth / Brevo applicatif.
 *
 * API REST : https://developers.brevo.com/reference/sendtransacemail
 */
const ENDPOINT_TRANSACTIONNEL = 'https://api.brevo.com/v3/smtp/email';
const ENDPOINT_CONTACTS = 'https://api.brevo.com/v3/contacts';

interface ReponseTransactionnel {
  messageId: string;
}

interface ReponseErreur {
  code: string;
  message: string;
}

export class BrevoEmailService implements EmailService {
  private getApiKey(): string {
    const cle = process.env.BREVO_API_KEY;
    if (cle === undefined || cle === '') {
      throw new Error(
        'BREVO_API_KEY manquante. Configurer dans .env.local ou repasser EMAIL_PROVIDER=mock.',
      );
    }
    return cle;
  }

  async envoyerTransactionnel(email: EmailTransactionnel): Promise<ResultatEnvoi> {
    const reponse = await fetch(ENDPOINT_TRANSACTIONNEL, {
      method: 'POST',
      headers: {
        'api-key': this.getApiKey(),
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: {
          email: process.env.BREVO_SMTP_USER ?? 'noreply@maintenant-le-mouvement.org',
          name: 'Maintenant!',
        },
        to: [{ email: email.destinataire }],
        subject: email.sujet,
        htmlContent: email.html,
        ...(email.texte !== undefined && { textContent: email.texte }),
      }),
    });

    if (!reponse.ok) {
      const erreur = (await reponse.json().catch(() => ({}))) as Partial<ReponseErreur>;
      throw new Error(
        `Brevo a refusé l'envoi (HTTP ${reponse.status}) : ${erreur.message ?? 'erreur inconnue'}`,
      );
    }

    const donnees = (await reponse.json()) as ReponseTransactionnel;
    return { messageId: donnees.messageId, estReel: true };
  }

  async inscrireNewsletter(email: string, tags: TagsNewsletter): Promise<void> {
    const listId = process.env.BREVO_NEWSLETTER_LIST_ID;
    if (listId === undefined || listId === '') {
      throw new Error('BREVO_NEWSLETTER_LIST_ID manquante. Configurer dans .env.local.');
    }

    const reponse = await fetch(ENDPOINT_CONTACTS, {
      method: 'POST',
      headers: {
        'api-key': this.getApiKey(),
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        listIds: [Number.parseInt(listId, 10)],
        attributes: {
          ORIGINE: tags.origine,
          ...(tags.action !== undefined && { ACTION: tags.action }),
          ...(tags.departement !== undefined && { DEPARTEMENT: tags.departement }),
        },
        updateEnabled: true,
      }),
    });

    if (!reponse.ok && reponse.status !== 204) {
      const erreur = (await reponse.json().catch(() => ({}))) as Partial<ReponseErreur>;
      throw new Error(
        `Brevo a refusé l'inscription newsletter (HTTP ${reponse.status}) : ${erreur.message ?? 'erreur inconnue'}`,
      );
    }
  }

  async desinscrireNewsletter(email: string): Promise<void> {
    const reponse = await fetch(`${ENDPOINT_CONTACTS}/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: {
        'api-key': this.getApiKey(),
        accept: 'application/json',
      },
    });

    // Brevo retourne 204 No Content quand la désinscription réussit, ou
    // 404 si l'adresse n'existait pas (on considère que c'est OK).
    if (!reponse.ok && reponse.status !== 404) {
      throw new Error(`Brevo a refusé la désinscription (HTTP ${reponse.status}).`);
    }
  }
}
