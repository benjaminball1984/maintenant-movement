/**
 * Lecture des préférences de notifications réseau (V2.5.39).
 *
 * Sert au routage cloche/email dans `poserNotificationTemplee` pour les
 * 3 types de notif réseau social (message reçu, post commenté, post
 * soutenu).
 *
 * Le stockage est dans `personne.preferences_visibilite.notifications`
 * (jsonb), branche `reseau_*`. Si absent / invalide, retourne 'cloche'
 * (comportement actuel : seulement la cloche, pas d'email).
 */

import { getSupabaseServer } from '@/lib/supabase';
import { type ModeNotifReseau, PREFERENCES_NOTIFICATIONS_DEFAUT } from '@/lib/validations/profil';

/** Mapping type de notif réseau → clé de pref dans le schema. */
const CLE_PAR_TYPE: Record<
  'reseau_message_recu' | 'reseau_post_commente' | 'reseau_post_soutenu',
  'reseau_message_recu' | 'reseau_post_commente' | 'reseau_post_soutenu'
> = {
  reseau_message_recu: 'reseau_message_recu',
  reseau_post_commente: 'reseau_post_commente',
  reseau_post_soutenu: 'reseau_post_soutenu',
};

/**
 * Lit la préférence de notification réseau d'une personne pour un type
 * donné. Retourne 'cloche' (défaut) si pas de pref ou si la lecture
 * échoue (la personne aura juste la cloche, pas d'email — c'est le
 * comportement le plus prudent).
 *
 * Utilisé en service_role (Edge / Server Action) pour pouvoir lire la
 * pref d'une AUTRE personne (le destinataire du notification, pas
 * l'auteur de l'action). Donc on bypasse RLS via le client serveur
 * standard (qui a déjà service_role en interne pour les opérations
 * d'écriture du notification).
 */
export async function lirePrefNotifReseau(
  destinatairePersonneId: string,
  type: keyof typeof CLE_PAR_TYPE,
): Promise<ModeNotifReseau> {
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from('personne')
      .select('preferences_visibilite')
      .eq('id', destinatairePersonneId)
      .maybeSingle();
    if (data === null) return PREFERENCES_NOTIFICATIONS_DEFAUT[CLE_PAR_TYPE[type]];
    const prefs =
      typeof data.preferences_visibilite === 'object' && data.preferences_visibilite !== null
        ? (data.preferences_visibilite as Record<string, unknown>).notifications
        : null;
    if (typeof prefs !== 'object' || prefs === null) {
      return PREFERENCES_NOTIFICATIONS_DEFAUT[CLE_PAR_TYPE[type]];
    }
    const valeur = (prefs as Record<string, unknown>)[CLE_PAR_TYPE[type]];
    if (
      valeur === 'cloche' ||
      valeur === 'mail_immediat' ||
      valeur === 'digest_quotidien' ||
      valeur === 'digest_hebdo' ||
      valeur === 'aucune'
    ) {
      return valeur;
    }
    return PREFERENCES_NOTIFICATIONS_DEFAUT[CLE_PAR_TYPE[type]];
  } catch {
    return PREFERENCES_NOTIFICATIONS_DEFAUT[CLE_PAR_TYPE[type]];
  }
}

/** Récupère l'email du destinataire pour envoyer un mail (V2.5.39). */
export async function lireEmailPersonne(personneId: string): Promise<string | null> {
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from('personne')
      .select('email')
      .eq('id', personneId)
      .maybeSingle();
    if (data === null) return null;
    const email = (data as { email?: string | null }).email;
    return typeof email === 'string' && email !== '' ? email : null;
  } catch {
    return null;
  }
}
