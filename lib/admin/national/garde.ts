import { getSupabaseServer } from '@/lib/supabase';
import { redirect } from 'next/navigation';

/**
 * Gardes d'accès de la console nationale (« super admin »).
 *
 * Le niveau `national` est le plus élevé du modèle de droits (cf.
 * `droit_admin`, migration 008). Une personne admin nationale a un accès
 * complet et journalisé au mouvement : gestion des droits, des personnes,
 * de tous les contenus et des opérations système.
 *
 * Défense en profondeur : ces gardes servent surtout l'UX (rediriger
 * plutôt qu'afficher une page vide). La vraie barrière de sécurité reste
 * la RLS Supabase, qui s'appuie sur la fonction `est_admin_national()`.
 */

/**
 * Indique si la personne connectée est admin nationale.
 *
 * Utilisable partout côté serveur : dans une Server Action (pour refuser
 * une mutation), dans un layout (pour afficher ou non un onglet), etc.
 */
export async function estAdminNational(): Promise<boolean> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.rpc('est_admin_national');
  return data === true;
}

/**
 * Garantit l'accès à la console nationale, sinon redirige :
 *   - vers `/connexion?prochaine=...` si personne n'est connecté·e ;
 *   - vers `/admin` si la personne est connectée mais pas admin nationale
 *     (elle a peut-être un droit de modération, on la renvoie à la console
 *     générale plutôt que de la bloquer sèchement).
 *
 * À appeler en tête du layout `/admin/national`.
 */
export async function garantirAdminNational(prochaine: string): Promise<void> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    redirect(`/connexion?prochaine=${encodeURIComponent(prochaine)}`);
  }

  const { data: estNational } = await supabase.rpc('est_admin_national');
  if (estNational !== true) {
    redirect('/admin');
  }
}
