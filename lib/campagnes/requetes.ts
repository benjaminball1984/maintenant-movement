import { getSupabaseServer } from '@/lib/supabase';
import type { Campagne, ModuleCampagne } from '@/types/database';

/**
 * Couche de requêtes du sous-espace Campagnes (chantier 3.2).
 *
 * Particularité : une campagne agrège des modules hétérogènes (pétition,
 * mobilisation, cagnotte, sondage, page éditoriale) via la table
 * polymorphe `module_campagne`. Pour la fiche détail, on charge la
 * campagne + ses modules + les entités cible des modules (résolution
 * polymorphe côté app).
 */

export interface CampagneEnrichie extends Campagne {
  createurice_prenom: string | null;
  createurice_nom: string | null;
  modules: ModuleResolu[];
}

/**
 * Module avec sa cible déjà résolue (titre + slug) pour affichage direct.
 * Pour `page_editoriale`, la cible est null et le contenu_editorial est
 * exposé tel quel.
 */
export interface ModuleResolu extends ModuleCampagne {
  titre_cible: string | null;
  slug_cible: string | null;
  statut_cible: string | null;
}

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

/**
 * Résout les cibles d'un lot de modules en regroupant par type pour
 * minimiser les allers-retours BDD (un SELECT par type).
 */
async function resoudreCibles(
  supabase: ClientSupabase,
  modules: ModuleCampagne[],
): Promise<Map<string, { titre: string; slug: string; statut: string }>> {
  const index = new Map<string, { titre: string; slug: string; statut: string }>();

  const idsParType = new Map<string, string[]>();
  for (const m of modules) {
    if (m.cible_id === null) continue;
    if (!idsParType.has(m.type_module)) {
      idsParType.set(m.type_module, []);
    }
    idsParType.get(m.type_module)?.push(m.cible_id);
  }

  for (const [type, ids] of idsParType.entries()) {
    if (type === 'petition') {
      const { data } = await supabase
        .from('petition')
        .select('id, titre, slug, statut')
        .in('id', ids);
      for (const row of data ?? []) {
        index.set(row.id, { titre: row.titre, slug: row.slug, statut: row.statut });
      }
    } else if (type === 'mobilisation') {
      const { data } = await supabase
        .from('mobilisation')
        .select('id, titre, slug, statut')
        .in('id', ids);
      for (const row of data ?? []) {
        index.set(row.id, { titre: row.titre, slug: row.slug, statut: row.statut });
      }
    }
    // cagnotte / sondage : tables pas encore créées (3.3 et 7.5).
    // On laisse les modules sans titre_cible — l'UI affichera un état
    // « cible indisponible » plutôt que de planter.
  }

  return index;
}

async function hydraterCampagne(
  supabase: ClientSupabase,
  campagne: Campagne,
): Promise<CampagneEnrichie> {
  const [{ data: personne }, { data: modules }] = await Promise.all([
    supabase.from('personne').select('prenom, nom').eq('id', campagne.createurice_id).maybeSingle(),
    supabase
      .from('module_campagne')
      .select('*')
      .eq('campagne_id', campagne.id)
      .order('ordre', { ascending: true }),
  ]);

  const cibles = await resoudreCibles(supabase, modules ?? []);
  const modulesResolus: ModuleResolu[] = (modules ?? []).map((m) => {
    const cible = m.cible_id !== null ? cibles.get(m.cible_id) : null;
    return {
      ...m,
      titre_cible: cible?.titre ?? null,
      slug_cible: cible?.slug ?? null,
      statut_cible: cible?.statut ?? null,
    };
  });

  return {
    ...campagne,
    createurice_prenom: personne?.prenom ?? null,
    createurice_nom: personne?.nom ?? null,
    modules: modulesResolus,
  };
}

export async function listerCampagnesPubliees(limite = 50): Promise<CampagneEnrichie[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('campagne')
    .select('*')
    .eq('statut', 'publiee')
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error !== null || data === null) {
    return [];
  }

  return Promise.all(data.map((c) => hydraterCampagne(supabase, c)));
}

export async function campagneParSlug(slug: string): Promise<CampagneEnrichie | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('campagne')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error !== null || data === null) {
    return null;
  }

  return hydraterCampagne(supabase, data);
}

export async function listerCampagnesAModerer(): Promise<CampagneEnrichie[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('campagne')
    .select('*')
    .eq('statut', 'en_moderation')
    .order('created_at', { ascending: true });

  if (error !== null || data === null) {
    return [];
  }

  return Promise.all(data.map((c) => hydraterCampagne(supabase, c)));
}
