/**
 * Templates de notifications cloche editables admin via CMS (V2.4.131).
 *
 * Le systeme V1 (cf. `lib/notification.ts`) stocke titre + message au moment
 * de l'insertion : chaque Server Action passait des litterales hardcodees.
 *
 * Ce module ajoute une couche de templating : chaque type de notification a
 * un titre + un message template par defaut (defini ici), et chaque admin
 * peut les surcharger via le CMS (cles `notification.{type}.titre` et
 * `notification.{type}.message`). A l'insertion, on lit le template, on
 * interpole les parametres dynamiques (titre de l'offre, etc.), puis on
 * insere via `poserNotification`.
 *
 * Greffe additive : `poserNotification` reste accessible et inchange pour
 * les call sites pas encore migres ; on ajoute juste un wrapper qui resout
 * le template avant d'appeler.
 */

import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { envoyerEmailTemplee } from '@/lib/email-templates';
import {
  type PoserNotificationOptions,
  type TypeNotification,
  poserNotification,
} from '@/lib/notification';
import { lireEmailPersonne, lirePrefNotifReseau } from '@/lib/preference-notif-reseau';

/** V2.5.39 — types de notifs reseau dont le routage cloche/email est gouverne
 *  par les preferences utilisateurice (cf. lirePrefNotifReseau). */
const TYPES_RESEAU = new Set<TypeNotification>([
  'reseau_message_recu',
  'reseau_post_commente',
  'reseau_post_soutenu',
]);

/** Templates par defaut. Surchargeables admin via le CMS. */
const TEMPLATES_DEFAUT: Record<TypeNotification, { titre: string; message: string }> = {
  reservation_demande_recue: {
    titre: 'Nouvelle demande de réservation',
    message: 'Sur ton offre : {titre_offre}',
  },
  reservation_acceptee: {
    titre: 'Demande acceptée',
    message: 'Ta demande sur « {titre_offre} » a été acceptée.',
  },
  reservation_refusee: {
    titre: 'Demande refusée',
    message: 'Ta demande sur « {titre_offre} » a été refusée. Motif : {motif}',
  },
  reservation_realisee: {
    titre: 'Prestation marquée réalisée',
    message: 'Sur « {titre_offre} ». Tu peux confirmer ou signaler un litige.',
  },
  reservation_confirmee: {
    titre: 'Prestation confirmée',
    message: 'Ta réservation sur « {titre_offre} » est confirmée. Merci.',
  },
  reservation_annulee: {
    titre: 'Réservation annulée',
    message: 'La réservation sur « {titre_offre} » a été annulée.',
  },
  reservation_litige_signale: {
    titre: 'Litige signalé',
    message: 'Sur « {titre_offre} ». Motif : {motif}',
  },
  reservation_litige_arbitre: {
    titre: 'Litige arbitré',
    message: 'Décision admin sur « {titre_offre} » : {decision}.',
  },
  reseau_message_recu: {
    titre: 'Nouveau message',
    message: '{auteur} t’a envoyé un message.',
  },
  reseau_post_commente: {
    titre: 'Nouveau commentaire',
    message: '{auteur} a commenté ta publication.',
  },
  reseau_post_soutenu: {
    titre: 'Nouveau soutien',
    message: '{auteur} soutient ta publication.',
  },
  reseau_demande_ami: {
    titre: 'Demande d’ami·e',
    message: '{auteur} souhaite devenir ami·e avec toi.',
  },
  reseau_amitie_acceptee: {
    titre: 'Demande d’ami·e acceptée',
    message: '{auteur} a accepté ta demande d’ami·e.',
  },
  moderation_me_concerne: {
    titre: 'Action de modération',
    message: 'Un contenu te concernant a été modéré. Motif : {motif}',
  },
  info_groupe: {
    titre: 'Info de groupe',
    message: '{groupe} : {info}',
  },
  autre: {
    titre: 'Notification',
    message: '',
  },
};

/**
 * Interpole les placeholders `{param}` dans un template avec les valeurs
 * fournies. Les params manquants sont remplaces par une chaine vide pour
 * eviter d'exposer `{param}` brut a l'utilisateurice.
 */
function interpoler(template: string, params: Record<string, string | null | undefined>): string {
  return template.replace(/\{([a-z_]+)\}/g, (_, cle: string) => {
    const valeur = params[cle];
    return valeur === null || valeur === undefined ? '' : valeur;
  });
}

/**
 * Pose une notification en resolvant le titre + le message depuis le CMS
 * (ou les defauts), apres interpolation des parametres.
 *
 * Exemple :
 * ```ts
 * await poserNotificationTemplee(
 *   'reservation_acceptee',
 *   { titre_offre: offre.titre },
 *   { destinatairePersonneId, href: '/profil/reservations', cibleId, cibleTable: 'reservation' },
 *   auteurId,
 * );
 * ```
 */
export async function poserNotificationTemplee(
  type: TypeNotification,
  params: Record<string, string | null | undefined>,
  optionsTechniques: Omit<PoserNotificationOptions, 'type' | 'titre' | 'message'>,
  auteurId?: string,
): Promise<void> {
  const defaut = TEMPLATES_DEFAUT[type];
  const [titreCms, messageCms] = await Promise.all([
    lireContenuEditorial(`notification.${type}.titre`, { valeurMd: defaut.titre }),
    lireContenuEditorial(`notification.${type}.message`, { valeurMd: defaut.message }),
  ]);

  const titre = interpoler(titreCms.valeurMd, params);
  const message = interpoler(messageCms.valeurMd, params);

  // V2.5.39 — pour les notifs reseau, consulte la pref de la personne
  // destinataire pour decider du routage cloche/email/aucune.
  // Les autres types (reservation, moderation, info_groupe...) restent
  // gouvernes par leur logique propre : cloche systematique.
  let mode: 'cloche' | 'mail_immediat' | 'digest_quotidien' | 'digest_hebdo' | 'aucune' = 'cloche';
  if (TYPES_RESEAU.has(type)) {
    mode = await lirePrefNotifReseau(
      optionsTechniques.destinatairePersonneId,
      type as 'reseau_message_recu' | 'reseau_post_commente' | 'reseau_post_soutenu',
    );
  }

  // Mode 'aucune' : ni cloche ni email. La personne a explicitement choisi
  // le silence pour ce type.
  if (mode === 'aucune') return;

  // Cloche dans tous les autres cas (cloche / mail_immediat /
  // digest_quotidien / digest_hebdo — les digests tombent en cloche
  // en attendant le cron de regroupement).
  await poserNotification(
    {
      ...optionsTechniques,
      type,
      titre,
      message: message === '' ? undefined : message,
    },
    auteurId,
  );

  // Email immediat si la pref le demande. Echec silencieux pour ne pas
  // casser le pipeline cloche (qui a deja reussi).
  if (mode === 'mail_immediat' && TYPES_RESEAU.has(type)) {
    try {
      const email = await lireEmailPersonne(optionsTechniques.destinatairePersonneId);
      if (email !== null) {
        await envoyerEmailTemplee(
          type as 'reseau_message_recu' | 'reseau_post_commente' | 'reseau_post_soutenu',
          email,
          params,
        );
      }
    } catch {
      // Echec d'envoi email : on laisse passer (la cloche est posee, c'est l'essentiel).
    }
  }
}

/** Re-export pour ergonomie : un seul import pour les call sites. */
export type { TypeNotification } from '@/lib/notification';
