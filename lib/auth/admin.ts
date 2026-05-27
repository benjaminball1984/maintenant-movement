/**
 * Helper de détection admin pour les composants serveur (V2.4.2).
 *
 * Appelle la RPC `est_admin_general` côté Supabase. Retourne `false`
 * si pas connecté, pas admin, ou erreur. Centralisé pour éviter
 * de dupliquer le pattern dans chaque page éditoriale, dashboard ou
 * espace.
 */

import { getSupabaseServer } from '@/lib/supabase';

export async function estAdminCourant(): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase.rpc('est_admin_general');
    return data === true;
  } catch {
    return false;
  }
}
