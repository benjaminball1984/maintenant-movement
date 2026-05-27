/**
 * Helpers de la cloche in-app (cycle V2 V2.3.25).
 *
 * Réutilise la table `notification` V1 (schéma : `destinataire_id`,
 * `lue` boolean, `lue_le` timestamp, `cible_id`/`cible_table` pour la
 * ressource concernée, `href` pour le lien, `message` pour le corps).
 *
 * Canal 1 des notifications V2 selon le CDC `02-Sinformer/reseau-social-V2.md`
 * §7 acté 19/05. Philosophie : « on respecte l'attention, on ne la
 * capte pas ». Insertion fire-and-forget depuis les Server Actions
 * (ne fait pas échouer l'action si la notif tombe).
 *
 * Doctrine de greffe V2 §0.3 : on additionne, on ne réinvente pas. La
 * table V1 existait déjà, on l'enrichit par USAGE plutôt que par
 * nouvelle table parallèle.
 */

import { getSupabaseServer } from '@/lib/supabase';

export type TypeNotification =
  | 'reservation_demande_recue'
  | 'reservation_acceptee'
  | 'reservation_refusee'
  | 'reservation_realisee'
  | 'reservation_confirmee'
  | 'reservation_annulee'
  | 'reservation_litige_signale'
  | 'reservation_litige_arbitre'
  | 'reseau_message_recu'
  | 'reseau_post_commente'
  | 'reseau_post_soutenu'
  | 'moderation_me_concerne'
  | 'info_groupe'
  | 'autre';

export interface Notification {
  id: string;
  destinatairePersonneId: string;
  type: TypeNotification;
  titre: string;
  message: string | null;
  href: string | null;
  cibleId: string | null;
  cibleTable: string | null;
  lue: boolean;
  lueLe: string | null;
  createdAt: string;
}

export interface PoserNotificationOptions {
  destinatairePersonneId: string;
  type: TypeNotification;
  titre: string;
  message?: string;
  href?: string;
  cibleId?: string;
  cibleTable?: string;
}

/**
 * Insère une notification pour le destinataire indiqué. Fire-and-forget :
 * tout échec est loggé et avalé. Utilise le client serveur courant
 * (service_role contourne la RLS si nécessaire).
 *
 * Auto-déduplication minimale : si l'auteur de l'action est le
 * destinataire (ex. je m'auto-confirme une action), on n'insère rien.
 */
export async function poserNotification(
  options: PoserNotificationOptions,
  auteurId?: string,
): Promise<void> {
  if (auteurId !== undefined && auteurId === options.destinatairePersonneId) {
    return;
  }
  try {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.from('notification').insert({
      destinataire_id: options.destinatairePersonneId,
      type: options.type,
      titre: options.titre,
      message: options.message ?? null,
      href: options.href ?? null,
      cible_id: options.cibleId ?? null,
      cible_table: options.cibleTable ?? null,
    });
    if (error !== null) {
      console.warn('[notification] insert échoué :', error.message);
    }
  } catch (erreur) {
    console.warn('[notification] exception :', erreur);
  }
}

/** Liste les notifications du destinataire, triées par date décroissante. */
export async function listerNotifications(
  destinatairePersonneId: string,
  limite = 50,
): Promise<Notification[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('notification')
    .select('*')
    .eq('destinataire_id', destinatairePersonneId)
    .order('created_at', { ascending: false })
    .limit(limite);
  if (error !== null || data === null) return [];
  return data.map(ligneEnNotification);
}

/** Compte les notifications non lues du destinataire (pour le badge cloche). */
export async function compterNotificationsNonLues(destinatairePersonneId: string): Promise<number> {
  const supabase = await getSupabaseServer();
  const { count, error } = await supabase
    .from('notification')
    .select('id', { count: 'exact', head: true })
    .eq('destinataire_id', destinatairePersonneId)
    .eq('lue', false);
  if (error !== null) return 0;
  return count ?? 0;
}

/** Marque une notification comme lue. Idempotent. */
export async function marquerNotificationLue(
  notificationId: string,
  destinatairePersonneId: string,
): Promise<{ ok: boolean }> {
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('notification')
    .update({ lue: true, lue_le: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('destinataire_id', destinatairePersonneId)
    .eq('lue', false);
  return { ok: error === null };
}

/** Marque toutes les notifications du destinataire comme lues. */
export async function marquerToutesNotificationsLues(
  destinatairePersonneId: string,
): Promise<{ ok: boolean }> {
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('notification')
    .update({ lue: true, lue_le: new Date().toISOString() })
    .eq('destinataire_id', destinatairePersonneId)
    .eq('lue', false);
  return { ok: error === null };
}

function ligneEnNotification(l: {
  id: string;
  destinataire_id: string;
  type: string;
  titre: string;
  message: string | null;
  href: string | null;
  cible_id: string | null;
  cible_table: string | null;
  lue: boolean;
  lue_le: string | null;
  created_at: string;
}): Notification {
  return {
    id: l.id,
    destinatairePersonneId: l.destinataire_id,
    type: l.type as TypeNotification,
    titre: l.titre,
    message: l.message,
    href: l.href,
    cibleId: l.cible_id,
    cibleTable: l.cible_table,
    lue: l.lue,
    lueLe: l.lue_le,
    createdAt: l.created_at,
  };
}
