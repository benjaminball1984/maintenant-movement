import { getSupabaseServer } from '@/lib/supabase';
import type {
  Commune,
  Confederation,
  EntiteConfederal,
  Federation,
  MandatConfederal,
} from '@/types/database';

/**
 * Couche de requêtes du sous-espace Communes + Fédérations +
 * Confédérations (chantier 5.2).
 */

// ============================================================
// Communes
// ============================================================

export interface CommuneEnrichie extends Commune {
  nombre_adherents: number;
}

export async function listerCommunes(recherche?: string, limite = 100): Promise<CommuneEnrichie[]> {
  const supabase = await getSupabaseServer();
  let q = supabase.from('commune').select('*').order('nom').limit(limite);
  if (recherche !== undefined && recherche.trim() !== '') {
    q = q.ilike('nom', `%${recherche}%`);
  }
  const { data } = await q;
  const communes = data ?? [];
  if (communes.length === 0) return [];

  const ids = communes.map((c) => c.id);
  const { data: appartenances } = await supabase
    .from('appartenance_commune')
    .select('commune_id')
    .in('commune_id', ids)
    .eq('est_active', true);
  const compteur = new Map<string, number>();
  for (const a of appartenances ?? []) {
    compteur.set(a.commune_id, (compteur.get(a.commune_id) ?? 0) + 1);
  }

  return communes.map((c) => ({ ...c, nombre_adherents: compteur.get(c.id) ?? 0 }));
}

export async function communeParSlug(slug: string): Promise<CommuneEnrichie | null> {
  const supabase = await getSupabaseServer();
  const { data: c } = await supabase.from('commune').select('*').eq('slug', slug).maybeSingle();
  if (c === null) return null;
  const { count } = await supabase
    .from('appartenance_commune')
    .select('id', { count: 'exact', head: true })
    .eq('commune_id', c.id)
    .eq('est_active', true);
  return { ...c, nombre_adherents: count ?? 0 };
}

// ============================================================
// Fédérations
// ============================================================

export interface FederationEnrichie extends Federation {
  nombre_communes: number;
}

export async function listerFederations(): Promise<FederationEnrichie[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('federation').select('*').order('nom');
  const federations = data ?? [];
  if (federations.length === 0) return [];

  const ids = federations.map((f) => f.id);
  const { data: liens } = await supabase
    .from('appartenance_federation')
    .select('federation_id')
    .in('federation_id', ids)
    .eq('est_active', true);
  const compteur = new Map<string, number>();
  for (const l of liens ?? []) {
    compteur.set(l.federation_id, (compteur.get(l.federation_id) ?? 0) + 1);
  }

  return federations.map((f) => ({ ...f, nombre_communes: compteur.get(f.id) ?? 0 }));
}

export async function federationParSlug(slug: string): Promise<FederationEnrichie | null> {
  const supabase = await getSupabaseServer();
  const { data: f } = await supabase.from('federation').select('*').eq('slug', slug).maybeSingle();
  if (f === null) return null;
  const { count } = await supabase
    .from('appartenance_federation')
    .select('id', { count: 'exact', head: true })
    .eq('federation_id', f.id)
    .eq('est_active', true);
  return { ...f, nombre_communes: count ?? 0 };
}

// ============================================================
// Confédérations
// ============================================================

export async function listerConfederations(): Promise<Confederation[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('confederation').select('*').order('nom');
  return data ?? [];
}

export async function confederationParSlug(slug: string): Promise<Confederation | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('confederation').select('*').eq('slug', slug).maybeSingle();
  return data;
}

// ============================================================
// Mandats confédéraux
// ============================================================

export interface MandatAvecPersonne extends MandatConfederal {
  personne_prenom: string | null;
  personne_nom: string | null;
}

export async function listerMandatsActifs(
  entiteType?: EntiteConfederal,
): Promise<MandatAvecPersonne[]> {
  const supabase = await getSupabaseServer();
  let q = supabase
    .from('mandat_confederal')
    .select('*')
    .eq('statut', 'actif')
    .order('tire_le', { ascending: false });
  if (entiteType !== undefined) q = q.eq('entite_type', entiteType);
  const { data } = await q;
  const mandats = data ?? [];
  if (mandats.length === 0) return [];
  const idsPersonnes = [...new Set(mandats.map((m) => m.personne_id))];
  const { data: personnes } = await supabase
    .from('personne')
    .select('id, prenom, nom')
    .in('id', idsPersonnes);
  const idx = new Map((personnes ?? []).map((p) => [p.id, { prenom: p.prenom, nom: p.nom }]));
  return mandats.map((m) => {
    const p = idx.get(m.personne_id);
    return {
      ...m,
      personne_prenom: p?.prenom ?? null,
      personne_nom: p?.nom ?? null,
    };
  });
}
