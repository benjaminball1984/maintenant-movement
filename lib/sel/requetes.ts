import { getSupabaseServer } from '@/lib/supabase';
import type { CategorieServiceSel, ServiceSel } from '@/types/database';

export interface ServiceSelEnrichi extends ServiceSel {
  createurice_prenom: string | null;
  createurice_nom: string | null;
}

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

async function hydrater(
  supabase: ClientSupabase,
  services: ServiceSel[],
): Promise<ServiceSelEnrichi[]> {
  if (services.length === 0) return [];
  const ids = [...new Set(services.map((s) => s.createurice_id))];
  const { data: personnes } = await supabase
    .from('personne')
    .select('id, prenom, nom')
    .in('id', ids);
  const idx = new Map((personnes ?? []).map((p) => [p.id, { prenom: p.prenom, nom: p.nom }]));
  return services.map((s) => {
    const p = idx.get(s.createurice_id);
    return {
      ...s,
      createurice_prenom: p?.prenom ?? null,
      createurice_nom: p?.nom ?? null,
    };
  });
}

export async function listerServicesSel(
  categorie?: CategorieServiceSel,
  limite = 50,
): Promise<ServiceSelEnrichi[]> {
  const supabase = await getSupabaseServer();
  let q = supabase
    .from('service_sel')
    .select('*')
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
    .limit(limite);
  if (categorie !== undefined) q = q.eq('categorie', categorie);
  const { data, error } = await q;
  if (error !== null || data === null) return [];
  return hydrater(supabase, data);
}

export async function serviceSelParSlug(slug: string): Promise<ServiceSelEnrichi | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('service_sel')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error !== null || data === null) return null;
  const [h] = await hydrater(supabase, [data]);
  return h ?? null;
}
