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

/** Types d'emails transactionnels avec template editable.
 *  V2.5.27 sous-chantier V2.5.16.d : ajoute reseau_message_recu /
 *  reseau_post_commente / reseau_post_soutenu pour les notifications
 *  reseau social. Ces templates sont DEFINIS mais pas appeles
 *  automatiquement (anti-spam) : un futur systeme de preferences
 *  utilisateurice (digest hebdo / opt-in par type) decidera quand
 *  basculer une notification cloche en email. */
export type TypeEmail =
  | 'rgpd_export_demande'
  | 'rgpd_suppression_demande'
  | 'adhesion_relance'
  | 'reseau_message_recu'
  | 'reseau_post_commente'
  | 'reseau_post_soutenu';

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
  // V2.5.27 V2.5.16.d — Notifications reseau social. Templates definis mais
  // PAS appeles automatiquement (anti-spam). Un futur systeme de preferences
  // utilisateurice declenchera l'envoi pour les abonne·es opt-in.
  reseau_message_recu: {
    sujet: 'Tu as reçu un nouveau message',
    html: `<p>Bonjour,</p>
<p><strong>{auteur}</strong> t'a envoyé un message sur Maintenant!.</p>
<p><a href="https://maintenant-le-mouvement.org/s-informer/reseau/messages">Lire le message</a></p>
<p>L’équipe Maintenant!</p>`,
    texte: `Bonjour,

{auteur} t'a envoyé un message sur Maintenant!.

Va le lire sur https://maintenant-le-mouvement.org/s-informer/reseau/messages

L’équipe Maintenant!`,
  },
  reseau_post_commente: {
    sujet: 'Ta publication a un nouveau commentaire',
    html: `<p>Bonjour,</p>
<p><strong>{auteur}</strong> a commenté ta publication sur le réseau Maintenant!.</p>
<p><a href="https://maintenant-le-mouvement.org/s-informer/reseau">Voir la conversation</a></p>
<p>L’équipe Maintenant!</p>`,
    texte: `Bonjour,

{auteur} a commenté ta publication sur le réseau Maintenant!.

Va la lire sur https://maintenant-le-mouvement.org/s-informer/reseau

L’équipe Maintenant!`,
  },
  reseau_post_soutenu: {
    sujet: 'Ta publication a un nouveau soutien',
    html: `<p>Bonjour,</p>
<p><strong>{auteur}</strong> soutient ta publication sur le réseau Maintenant!.</p>
<p><a href="https://maintenant-le-mouvement.org/s-informer/reseau">Voir la publication</a></p>
<p>L’équipe Maintenant!</p>`,
    texte: `Bonjour,

{auteur} soutient ta publication sur le réseau Maintenant!.

Va la voir sur https://maintenant-le-mouvement.org/s-informer/reseau

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
  // V2.5.23 Phase L rich text : priorité au HTML riche (colonne valeur_html
  // posée via l'éditeur TipTap, déjà sanitizée au save). Permet aux admins
  // de styler leurs emails (couleurs, polices, listes, citations, images)
  // sans toucher au code.
  // Fallback V2.5.20 V2.5.16.c : si pas de valeur_html, on lit valeur_md
  // qui peut être soit du HTML direct (<p>, <a>...) soit du Markdown léger.
  const sourceBrute = htmlCms.valeurHtml ?? htmlCms.valeurMd;
  const corpsBrut = interpoler(sourceBrute, params);
  // Si la source venait de valeur_html, c'est déjà du HTML propre. Sinon,
  // heuristique : balises HTML reconnaissables → on garde, sinon Markdown.
  const corpsHtml =
    htmlCms.valeurHtml !== null && htmlCms.valeurHtml !== ''
      ? corpsBrut
      : /<(p|a|ul|strong|em|br)\b/i.test(corpsBrut)
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
