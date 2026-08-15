import { getSupabaseServer } from '@/lib/supabase';
import type { Database } from '@/types/database';

/**
 * Lectures des collectes externes curées (V2.6.124). Voir
 * `lib/import-cagnottes/` pour l'import et `cagnotte_externe` pour le schéma.
 */

export type CagnotteExterne = Database['public']['Tables']['cagnotte_externe']['Row'];

/** Propositions en attente de modération (admin uniquement, via RLS). */
export async function listerPropositionsCagnottes(limite = 100): Promise<CagnotteExterne[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('cagnotte_externe')
    .select('*')
    .eq('statut', 'propose')
    .order('created_at', { ascending: false })
    .limit(limite);
  return data ?? [];
}

/** Collectes VALIDÉES, visibles du public ; filtre optionnel par thème. */
export async function listerCagnottesExternesPubliees(
  theme?: string,
  limite = 60,
): Promise<CagnotteExterne[]> {
  const supabase = await getSupabaseServer();
  let requete = supabase
    .from('cagnotte_externe')
    .select('*')
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
    .limit(limite);
  if (theme !== undefined && theme !== '') {
    requete = requete.contains('themes', [theme]);
  }
  const { data } = await requete;
  return data ?? [];
}

/** Nombre de propositions en attente (badge file de modération). */
export async function compterPropositionsCagnottes(): Promise<number> {
  const supabase = await getSupabaseServer();
  const { count } = await supabase
    .from('cagnotte_externe')
    .select('id', { count: 'exact', head: true })
    .eq('statut', 'propose');
  return count ?? 0;
}
