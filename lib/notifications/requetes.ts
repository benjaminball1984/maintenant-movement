import { getSupabaseServer } from '@/lib/supabase';
import type { Notification, PreferenceNotification } from '@/types/database';

/**
 * Couche de requêtes Notifications (chantier 8.1).
 */

export async function listerNotifications(
  personneId: string,
  limite = 50,
): Promise<Notification[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('notification')
    .select('*')
    .eq('destinataire_id', personneId)
    .order('created_at', { ascending: false })
    .limit(limite);
  return data ?? [];
}

export async function nombreNonLues(personneId: string): Promise<number> {
  const supabase = await getSupabaseServer();
  const { count } = await supabase
    .from('notification')
    .select('id', { count: 'exact', head: true })
    .eq('destinataire_id', personneId)
    .eq('lue', false);
  return count ?? 0;
}

export async function preferencesParDefaut(personneId: string): Promise<PreferenceNotification> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('preference_notification')
    .select('*')
    .eq('personne_id', personneId)
    .maybeSingle();
  if (data !== null) return data;
  return {
    personne_id: personneId,
    cloche_active: true,
    push_active: false,
    mail_recap_mardi_active: true,
    newsletter_vendredi_active: true,
    preferences_par_type: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
