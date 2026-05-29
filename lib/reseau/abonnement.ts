/**
 * Helper de lecture côté serveur pour l'abonnement personne ↔ espace
 * (V2.5.22 sous-chantier V2.5.10.d). Sorti de `app/actions/abonnement-espace.ts`
 * pour ne pas être exposé comme Server Action callable depuis le client
 * (un fichier `'use server'` extrait tous ses exports pour le client, ce qui
 * tirait la chaîne `next/headers` côté bundle client).
 *
 * Cette fonction reste server-only : on l'appelle depuis les Server Components
 * directement.
 */

import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase/server';
import type { TypeEspacePostable } from './types-espace';

/**
 * Helper côté serveur : retourne true si la personne courante suit cet espace.
 * À utiliser depuis un Server Component ou une Server Action.
 */
export async function jeSuisCetEspace(
  espaceType: TypeEspacePostable,
  espaceId: string,
): Promise<boolean> {
  const session = await getSession();
  if (session === null) return false;
  const supabase = await getSupabaseServer();
  const { count } = await supabase
    .from('abonnement_espace_reseau')
    .select('*', { count: 'exact', head: true })
    .eq('suiveur_id', session.userId)
    .eq('espace_type', espaceType)
    .eq('espace_id', espaceId);
  return (count ?? 0) > 0;
}
