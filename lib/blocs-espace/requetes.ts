/**
 * Helpers de lecture des blocs personnalisables d'espace (V2.5.5).
 *
 * Côté lecture : `listerBlocsEspace` retourne les blocs d'un espace
 * ordonnés par `ordre` croissant. Décodés via `decoderBloc` ; les
 * blocs mal formés sont silencieusement ignorés.
 *
 * Côté écriture : `creerBlocEspace`, `mettreAJourBlocEspace`,
 * `supprimerBlocEspace`, `reordonnerBlocsEspace`. Toutes passent par
 * le service_role (RLS bloque les écritures pour anon/authenticated).
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getSupabaseServer } from '@/lib/supabase/server';
import type { BlocEspaceDecode, TypeBloc, TypeEspace } from './types';
import { decoderBloc } from './validation';

/**
 * Lit les blocs d'un espace, ordonnés. Lecture publique (RLS le permet).
 */
export async function listerBlocsEspace(
  espaceType: TypeEspace,
  espaceId: string,
): Promise<BlocEspaceDecode[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('bloc_espace')
    .select('id, type, contenu_json, ordre')
    .eq('espace_type', espaceType)
    .eq('espace_id', espaceId)
    .order('ordre', { ascending: true });
  if (error !== null || data === null) return [];
  return data
    .map((l) => decoderBloc({ type: l.type, contenu_json: l.contenu_json }))
    .filter((b): b is BlocEspaceDecode => b !== null);
}

/**
 * Crée un bloc dans un espace. Réservé service_role.
 * `ordre` est calculé comme `max(ordre) + 10` pour ranger en fin.
 */
export async function creerBlocEspace(args: {
  espaceType: TypeEspace;
  espaceId: string;
  type: TypeBloc;
  contenuJson: unknown;
  creePar?: string | null;
}): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data: dernier } = await supabase
    .from('bloc_espace')
    .select('ordre')
    .eq('espace_type', args.espaceType)
    .eq('espace_id', args.espaceId)
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle();
  const ordre = (dernier?.ordre ?? 0) + 10;
  const { data, error } = await supabase
    .from('bloc_espace')
    .insert({
      espace_type: args.espaceType,
      espace_id: args.espaceId,
      type: args.type,
      contenu_json: args.contenuJson as never,
      ordre,
      cree_par: args.creePar ?? null,
    })
    .select('id')
    .single();
  if (error !== null || data === null) return null;
  return data.id;
}

/** Met à jour le contenu_json d'un bloc. */
export async function mettreAJourBlocEspace(id: string, contenuJson: unknown): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('bloc_espace')
    .update({ contenu_json: contenuJson as never })
    .eq('id', id);
  return error === null;
}

/** Supprime un bloc par son id. */
export async function supprimerBlocEspace(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('bloc_espace').delete().eq('id', id);
  return error === null;
}
