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
import { gabaritEmailHTML } from '@/lib/email/gabarit';
import { markdownEmail } from '@/lib/email/markdown';
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
 *
 * V2.5.16 Phase L : le HTML CMS-edite est desormais enveloppe automatiquement
 * dans le gabarit identitaire Maintenant! (bandeau couleur, mise en page,
 * pied de page avec lien desinscription). Le contenu CMS reste juste le
 * "corps" du message, l'enveloppe est codee une fois dans `lib/email/gabarit.ts`.
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

  const sujet = interpoler(sujetCms.valeurMd, params);
  // V2.5.20 sous-chantier V2.5.16.c : le contenu CMS peut etre soit du HTML
  // direct (<p>, <a>...) soit du Markdown leger (**gras**, [lien](url), - liste).
  // Heuristique : si le contenu contient `<p>` ou `<a `, on le considere HTML
  // (compatibilite avec les templates V2.4 existants). Sinon, on le passe par
  // le parseur Markdown qui produit du HTML compatible email.
  const corpsBrut = interpoler(htmlCms.valeurMd, params);
  const corpsHtml = /<(p|a|ul|strong|em|br)\b/i.test(corpsBrut)
    ? corpsBrut
    : markdownEmail(corpsBrut);
  const htmlComplet = await gabaritEmailHTML(corpsHtml, {
    titre: sujet,
    preheader: sujet,
    // Les transactionnels (suppression compte, export RGPD, etc.) ne sont
    // jamais "désabonnables" : ils relèvent du contrat d'usage du service.
    // L'option avecDesinscription reste à `false` par défaut.
    avecDesinscription: false,
  });

  return getEmailService().envoyerTransactionnel({
    destinataire,
    sujet,
    html: htmlComplet,
    texte: interpoler(texteCms.valeurMd, params),
  });
}
