import { getSupabaseServer } from '@/lib/supabase';
import type { OffreEntraide, TypeOffreEntraide } from '@/types/database';

/**
 * Couche de requêtes du sous-espace S'entraider (chantier 4.1).
 */

export interface OffreEnrichie extends OffreEntraide {
  createurice_prenom: string | null;
  createurice_nom: string | null;
}

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

async function hydraterOffres(
  supabase: ClientSupabase,
  offres: OffreEntraide[],
): Promise<OffreEnrichie[]> {
  if (offres.length === 0) return [];
  const ids = [...new Set(offres.map((o) => o.createurice_id))];
  const { data: personnes } = await supabase
    .from('personne')
    .select('id, prenom, nom')
    .in('id', ids);
  const idx = new Map((personnes ?? []).map((p) => [p.id, { prenom: p.prenom, nom: p.nom }]));
  return offres.map((o) => {
    const p = idx.get(o.createurice_id);
    return {
      ...o,
      createurice_prenom: p?.prenom ?? null,
      createurice_nom: p?.nom ?? null,
    };
  });
}

export async function listerOffresPubliees(
  type: TypeOffreEntraide,
  limite = 50,
): Promise<OffreEnrichie[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('offre_entraide')
    .select('*')
    .eq('statut', 'publiee')
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(limite);
  if (error !== null || data === null) return [];
  return hydraterOffres(supabase, data);
}

export async function offreParSlug(slug: string): Promise<OffreEnrichie | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('offre_entraide')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error !== null || data === null) return null;
  const [h] = await hydraterOffres(supabase, [data]);
  return h ?? null;
}
