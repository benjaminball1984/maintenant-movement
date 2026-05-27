/**
 * Helper de comptage des membres d'un espace (cycle V2 V2.3.41).
 *
 * Centralise le mapping `espaceType → table d'appartenance` qui sinon
 * doit être dupliqué sur chaque page individuelle. 5 espaces couverts :
 *
 * - `commune` → `appartenance_commune`
 * - `federation` → `appartenance_federation`
 * - `confederation` → `appartenance_confederation`
 * - `gt_thematique` → `appartenance_gt`
 * - `campagne` → `appartenance_campagne` (V2.3.29)
 * - `groupe_entraide_local` → `appartenance_groupe_entraide_local` (V1)
 *
 * Compte uniquement les `est_active = true`.
 */

import { getSupabaseServer } from '@/lib/supabase';

export type EspaceMembres =
  | 'commune'
  | 'federation'
  | 'confederation'
  | 'gt_thematique'
  | 'campagne'
  | 'groupe_entraide_local';

/**
 * Compte les membres actifs d'un espace donné. Retourne 0 si erreur.
 * Switch case par type pour respecter le typage Supabase strict (la
 * table inférée dépend du nom passé à `.from()`, pas de paramètre
 * dynamique acceptable sans `any`).
 */
export async function compterMembresEspace(
  espaceType: EspaceMembres,
  espaceId: string,
): Promise<number> {
  const supabase = await getSupabaseServer();

  switch (espaceType) {
    case 'commune': {
      const { count } = await supabase
        .from('appartenance_commune')
        .select('id', { count: 'exact', head: true })
        .eq('commune_id', espaceId)
        .eq('est_active', true);
      return count ?? 0;
    }
    case 'federation': {
      const { count } = await supabase
        .from('appartenance_federation')
        .select('id', { count: 'exact', head: true })
        .eq('federation_id', espaceId)
        .eq('est_active', true);
      return count ?? 0;
    }
    case 'confederation': {
      const { count } = await supabase
        .from('appartenance_confederation')
        .select('id', { count: 'exact', head: true })
        .eq('confederation_id', espaceId)
        .eq('est_active', true);
      return count ?? 0;
    }
    case 'gt_thematique': {
      const { count } = await supabase
        .from('appartenance_gt')
        .select('id', { count: 'exact', head: true })
        .eq('gt_thematique_id', espaceId)
        .eq('est_active', true);
      return count ?? 0;
    }
    case 'campagne': {
      const { count } = await supabase
        .from('appartenance_campagne')
        .select('id', { count: 'exact', head: true })
        .eq('campagne_id', espaceId)
        .eq('est_active', true);
      return count ?? 0;
    }
    case 'groupe_entraide_local': {
      const { count } = await supabase
        .from('appartenance_groupe_entraide_local')
        .select('id', { count: 'exact', head: true })
        .eq('groupe_id', espaceId)
        .eq('est_active', true);
      return count ?? 0;
    }
    default:
      return 0;
  }
}

/**
 * Formate un nombre de membres en chaîne lisible (pluriel français).
 */
export function formaterMembres(n: number): string {
  if (n === 0) return 'Aucun membre';
  if (n === 1) return '1 membre';
  return `${n.toLocaleString('fr-FR')} membres`;
}
