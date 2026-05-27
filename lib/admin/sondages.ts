import { getSupabaseServer } from '@/lib/supabase';

export interface LigneSondageAdmin {
  id: string;
  slug: string;
  titre: string;
  question: string;
  mode: string;
  statut: string;
  fermeLe: string | null;
  nbOptions: number;
  createurice_id: string;
  createdAt: string;
}

export interface OptionsListeSondages {
  motCle?: string;
  statut?: 'tous' | 'ouvert' | 'ferme' | 'en_moderation';
  mode?: 'tous' | 'classique' | 'pondere';
  limite?: number;
}

/**
 * Liste les sondages pour la console admin (V2.4.48).
 *
 * Filtres :
 * - motCle : ilike sur titre / question
 * - statut : 'tous' | 'ouvert' | 'ferme' | 'en_moderation'
 * - mode : 'tous' | 'classique' | 'pondere'
 *
 * Limite 100 par défaut.
 */
export async function listerSondagesAdmin(
  options: OptionsListeSondages = {},
): Promise<LigneSondageAdmin[]> {
  const supabase = await getSupabaseServer();
  let query = supabase
    .from('sondage')
    .select(
      'id, slug, titre, question, mode, statut, ferme_le, options, createurice_id, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(options.limite ?? 100);

  if (options.statut !== undefined && options.statut !== 'tous') {
    query = query.eq('statut', options.statut);
  }

  if (options.mode !== undefined && options.mode !== 'tous') {
    query = query.eq('mode', options.mode);
  }

  if (options.motCle !== undefined && options.motCle.trim() !== '') {
    const motif = `%${options.motCle.trim()}%`;
    query = query.or(`titre.ilike.${motif},question.ilike.${motif}`);
  }

  const { data } = await query;
  return (data ?? []).map((s) => ({
    id: s.id,
    slug: s.slug,
    titre: s.titre,
    question: s.question,
    mode: s.mode,
    statut: s.statut,
    fermeLe: s.ferme_le,
    nbOptions: Array.isArray(s.options) ? s.options.length : 0,
    createurice_id: s.createurice_id,
    createdAt: s.created_at,
  }));
}
