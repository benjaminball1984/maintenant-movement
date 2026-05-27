/**
 * Templates d'emails transactionnels editables admin via CMS (V2.4.133).
 *
 * Pendant des `notification-templates.ts` (V2.4.131) pour les emails Brevo.
 *
 * Chaque type d'email a un sujet + un corps texte + un corps HTML, tous
 * editables admin via les cles CMS `email.{type}.{sujet, html, texte}`.
 * A l'envoi, on lit les templates, on interpole les `{params}`, puis on
 * appelle `getEmailService().envoyerTransactionnel(...)`.
 *
 * Greffe additive : `envoyerTransactionnel` reste l'API technique
 * inchangee. On ajoute un wrapper qui resout le template.
 */

import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { getEmailService } from '@/lib/email';
import type { ResultatEnvoi } from '@/lib/email/types';

/** Types d'emails transactionnels avec template editable. */
export type TypeEmail = 'rgpd_export_demande' | 'rgpd_suppression_demande' | 'adhesion_relance';

interface TemplateEmail {
  sujet: string;
  html: string;
  texte: string;
}

/** Templates par defaut. Surchargeables admin via le CMS. */
const TEMPLATES_DEFAUT: Record<TypeEmail, TemplateEmail> = {
  rgpd_export_demande: {
    sujet: 'Demande d’export de tes données enregistrée',
    html: `<p>Bonjour,</p>
<p>Ta demande d’export des données associées à ton compte ({user_id}) est bien enregistrée.</p>
<p>Tu recevras un mail séparé avec le lien de téléchargement sous 24h.</p>
<p>L’équipe Maintenant!</p>`,
    texte: `Bonjour,

Ta demande d’export des données associées à ton compte ({user_id}) est bien enregistrée.

Tu recevras un mail séparé avec le lien de téléchargement sous 24h.

L’équipe Maintenant!`,
  },
  rgpd_suppression_demande: {
    sujet: 'Suppression de ton compte programmée dans 30 jours',
    html: `<p>Bonjour,</p>
<p>Ta demande de suppression est enregistrée. Ton compte sera définitivement anonymisé dans 30 jours.</p>
<p>Tu peux annuler à tout moment d’ici là en te reconnectant et en cliquant « Annuler la suppression » depuis ton profil.</p>
<p>L’équipe Maintenant!</p>`,
    texte: `Bonjour,

Ta demande de suppression est enregistrée. Ton compte sera définitivement anonymisé dans 30 jours.

Tu peux annuler à tout moment d’ici là en te reconnectant et en cliquant « Annuler la suppression » depuis ton profil.

L’équipe Maintenant!`,
  },
  adhesion_relance: {
    sujet: 'Ton adhésion à Maintenant! arrive à échéance',
    html: `<p>Bonjour {prenom},</p>
<p>Ton adhésion à Maintenant! arrive à échéance dans les 14 jours.</p>
<p>Si tu souhaites rester adhérent·e, tu peux renouveler gratuitement, en euros (12 €) ou en 99-coin (12 T99CP).</p>
<p><a href="https://maintenant-le-mouvement.org/agir/adherer">Renouveler mon adhésion</a></p>
<p>L’équipe Maintenant!</p>`,
    texte: `Bonjour {prenom},

Ton adhésion à Maintenant! arrive à échéance dans les 14 jours.

Si tu souhaites rester adhérent·e, tu peux renouveler gratuitement, en euros (12 €) ou en 99-coin (12 T99CP).

https://maintenant-le-mouvement.org/agir/adherer

L’équipe Maintenant!`,
  },
};

/** Interpole les `{param}` dans une chaine. */
function interpoler(template: string, params: Record<string, string | null | undefined>): string {
  return template.replace(/\{([a-z_]+)\}/g, (_, cle: string) => {
    const valeur = params[cle];
    return valeur === null || valeur === undefined ? '' : valeur;
  });
}

/**
 * Envoie un email transactionnel en resolvant sujet + html + texte depuis
 * le CMS (ou les defauts), apres interpolation des parametres.
 */
export async function envoyerEmailTemplee(
  type: TypeEmail,
  destinataire: string,
  params: Record<string, string | null | undefined>,
): Promise<ResultatEnvoi> {
  const defaut = TEMPLATES_DEFAUT[type];
  const [sujetCms, htmlCms, texteCms] = await Promise.all([
    lireContenuEditorial(`email.${type}.sujet`, { valeurMd: defaut.sujet }),
    lireContenuEditorial(`email.${type}.html`, { valeurMd: defaut.html }),
    lireContenuEditorial(`email.${type}.texte`, { valeurMd: defaut.texte }),
  ]);

  return getEmailService().envoyerTransactionnel({
    destinataire,
    sujet: interpoler(sujetCms.valeurMd, params),
    html: interpoler(htmlCms.valeurMd, params),
    texte: interpoler(texteCms.valeurMd, params),
  });
}
