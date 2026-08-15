'use server';

import { getEmailService } from '@/lib/email';
import { estEmailValide } from '@/lib/email-valide';

/**
 * Inscription à la newsletter depuis le bloc de bas de page.
 *
 * Ajouté le 01/08/2026. Jusque-là, on ne pouvait s'inscrire qu'en cochant
 * une case au moment de signer une pétition ou de créer un compte : une
 * personne simplement de passage n'avait aucun moyen de garder le
 * contact. Décision de Lilou/Ben : une case à la signature **et** un bloc
 * en bas de page.
 *
 * ## Ce que l'action ne fait pas
 *
 * Elle n'écrit rien dans la base du site : la liste de diffusion vit chez
 * Brevo (le service qui envoie les emails), et c'est lui la source de
 * vérité des abonné·es. On ne duplique pas une donnée personnelle dans
 * deux endroits — c'est autant de risque RGPD en moins.
 *
 * ## Confirmation
 *
 * Brevo est configuré en double opt-in : la personne reçoit un email et
 * doit cliquer pour confirmer. C'est pour ça que le message de retour dit
 * « vérifie ta boîte mail » et non « c'est fait ».
 */
export interface ResultatNewsletter {
  ok: boolean;
  message: string;
}

const MESSAGE_SUCCES =
  'Presque : on vient de t’envoyer un email pour confirmer. Clique sur le lien et c’est bon.';
const MESSAGE_EMAIL_INVALIDE = 'Cette adresse email ne semble pas valide.';
const MESSAGE_ECHEC =
  'L’inscription n’a pas pu aboutir. Réessaie dans un instant, ou écris-nous depuis la page Contact.';

/**
 * Inscrit une adresse à la newsletter.
 *
 * @param donneesBrutes `FormData` du formulaire (champ `email`).
 * @param origine D'où vient l'inscription, pour le suivi côté Brevo.
 */
export async function inscrireALaNewsletter(
  donneesBrutes: FormData,
  origine = 'bloc-bas-de-page',
): Promise<ResultatNewsletter> {
  const email = String(donneesBrutes.get('email') ?? '').trim();

  if (!estEmailValide(email)) {
    return { ok: false, message: MESSAGE_EMAIL_INVALIDE };
  }

  try {
    await getEmailService().inscrireNewsletter(email, { origine });
    return { ok: true, message: MESSAGE_SUCCES };
  } catch (erreur) {
    // On journalise le détail technique côté serveur et on renvoie un
    // message compréhensible : l'erreur brute de Brevo n'aiderait
    // personne et pourrait exposer de la configuration.
    console.warn('[inscrireALaNewsletter] échec :', erreur);
    return { ok: false, message: MESSAGE_ECHEC };
  }
}
