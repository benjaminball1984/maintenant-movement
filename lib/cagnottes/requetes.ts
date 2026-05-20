import { getSupabaseServer } from '@/lib/supabase';
import type { Cagnotte, TypeCagnotte } from '@/types/database';

/**
 * Couche de requêtes du sous-espace Cagnottes (chantier 3.3).
 *
 * Pattern identique à 3.1 et 3.2. Hydratation : nom/prénom porteur + compteurs.
 */

export interface CagnotteEnrichie extends Cagnotte {
  total_euros_centimes: number;
  total_t99cp_unites: number;
  nombre_dons: number;
  createurice_prenom: string | null;
  createurice_nom: string | null;
}

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

interface Compteurs {
  total_euros_centimes: number;
  total_t99cp_unites: number;
  nombre_dons: number;
}

async function chargerCompteurs(supabase: ClientSupabase, cagnotteId: string): Promise<Compteurs> {
  const { data, error } = await supabase.rpc('compteurs_cagnotte', {
    cagnotte_a_compter: cagnotteId,
  });
  if (error !== null || data === null || !Array.isArray(data) || data.length === 0) {
    return { total_euros_centimes: 0, total_t99cp_unites: 0, nombre_dons: 0 };
  }
  const ligne = data[0];
  if (ligne === undefined) {
    return { total_euros_centimes: 0, total_t99cp_unites: 0, nombre_dons: 0 };
  }
  return {
    total_euros_centimes: coercerNombre(ligne.total_euros_centimes),
    total_t99cp_unites: coercerNombre(ligne.total_t99cp_unites),
    nombre_dons: coercerNombre(ligne.nombre_dons),
  };
}

function coercerNombre(v: number | string): number {
  return typeof v === 'string' ? Number.parseInt(v, 10) : v;
}

async function hydraterCagnottes(
  supabase: ClientSupabase,
  cagnottes: Cagnotte[],
): Promise<CagnotteEnrichie[]> {
  if (cagnottes.length === 0) return [];

  const idsCreaturices = [...new Set(cagnottes.map((c) => c.createurice_id))];

  const [{ data: personnes }, compteurs] = await Promise.all([
    supabase.from('personne').select('id, prenom, nom').in('id', idsCreaturices),
    Promise.all(cagnottes.map((c) => chargerCompteurs(supabase, c.id))),
  ]);

  const indexPersonnes = new Map(
    (personnes ?? []).map((p) => [p.id, { prenom: p.prenom, nom: p.nom }]),
  );

  return cagnottes.map((cagnotte, index) => {
    const personne = indexPersonnes.get(cagnotte.createurice_id);
    const compteur = compteurs[index] ?? {
      total_euros_centimes: 0,
      total_t99cp_unites: 0,
      nombre_dons: 0,
    };
    return {
      ...cagnotte,
      ...compteur,
      createurice_prenom: personne?.prenom ?? null,
      createurice_nom: personne?.nom ?? null,
    };
  });
}

export async function listerCagnottesPubliees(
  type?: TypeCagnotte,
  limite = 50,
): Promise<CagnotteEnrichie[]> {
  const supabase = await getSupabaseServer();

  let q = supabase
    .from('cagnotte')
    .select('*')
    .eq('statut', 'publiee')
    .order('created_at', { ascending: false })
    .limit(limite);

  if (type !== undefined) {
    q = q.eq('type', type);
  }

  const { data, error } = await q;
  if (error !== null || data === null) return [];

  return hydraterCagnottes(supabase, data);
}

export async function cagnotteAlaUne(): Promise<CagnotteEnrichie | null> {
  // Pour la home : la plus récente cagnotte « lutte » ou « ouverte » publiée.
  // Les cotisations sont des cagnottes permanentes, on ne les met pas en
  // une (elles ont leur propre page d'agir).
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('cagnotte')
    .select('*')
    .eq('statut', 'publiee')
    .in('type', ['ouverte', 'lutte'])
    .order('created_at', { ascending: false })
    .limit(1);
  if (error !== null || data === null || data.length === 0) return null;
  const liste = await hydraterCagnottes(supabase, data);
  return liste[0] ?? null;
}

export async function cagnotteParSlug(slug: string): Promise<CagnotteEnrichie | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('cagnotte')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error !== null || data === null) return null;
  const [hydratee] = await hydraterCagnottes(supabase, [data]);
  return hydratee ?? null;
}

export async function listerCagnottesAVerifier(): Promise<CagnotteEnrichie[]> {
  const supabase = await getSupabaseServer();
  // File de modération a posteriori : on liste publiées + suspendues
  // (les suspendues pour rétablir, les publiées pour vérification éclair).
  const { data, error } = await supabase
    .from('cagnotte')
    .select('*')
    .in('statut', ['publiee', 'suspendue'])
    .order('created_at', { ascending: false })
    .limit(50);
  if (error !== null || data === null) return [];
  return hydraterCagnottes(supabase, data);
}
