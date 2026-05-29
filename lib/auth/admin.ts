/**
 * Helpers de détection des droits admin pour les composants serveur.
 *
 * Centralisés pour éviter de dupliquer le pattern dans chaque page
 * éditoriale, dashboard ou espace.
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * V2.4.2 — true si la personne courante est admin général de plateforme
 * (niveau `national` ou `admin` dans `droit_admin`). RPC `est_admin_general`.
 */
export async function estAdminCourant(): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase.rpc('est_admin_general');
    return data === true;
  } catch {
    return false;
  }
}

/**
 * V2.5.15 (Master Plan §K) — true si la personne courante peut éditer les
 * libellés CMS via la console `/admin/national/contenus`. Inclut :
 *   - `national` et `admin` (qui ont déjà tous les droits)
 *   - `cms` (rôle dédié sans pouvoir politique, attribuable à un·e proche
 *     de confiance pour décharger Lilou/Ben de la maintenance éditoriale)
 *
 * Les composants `<TexteEditableAdmin>` continuent de recevoir leur prop
 * `estAdmin` ; les pages parentes peuvent l'alimenter avec `peutEditerCmsCourant()`
 * pour laisser éditer les libellés sans donner les autres pouvoirs.
 */
export async function peutEditerCmsCourant(): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase.rpc('peut_editer_cms');
    return data === true;
  } catch {
    return false;
  }
}
