import { getSupabaseServer } from '@/lib/supabase';
import type {
  BoutiqueMarche,
  MinimarcheSolidaire,
  NotationMarche,
  NotationMarcheStats,
  ProduitMarche,
  StatutMinimarche,
  StatutProduitMarche,
} from '@/types/database';

/**
 * Couche de requêtes du sous-espace Marché solidaire (chantier 4.3).
 *
 * Pattern reprise des autres chantiers : hydratation par IN-clause,
 * une seule passe pour le créateur·ice + une seule passe pour les
 * agrégats (notations).
 */

// ============================================================
// Types enrichis
// ============================================================

export interface ProduitMarcheEnrichi extends ProduitMarche {
  vendeureuse_prenom: string | null;
  vendeureuse_nom: string | null;
  moyenne_etoiles: number | null;
  nombre_notations: number;
}

export interface BoutiqueMarcheEnrichie extends BoutiqueMarche {
  createurice_prenom: string | null;
  createurice_nom: string | null;
  nombre_produits: number;
}

export interface MinimarcheSolidaireEnrichi extends MinimarcheSolidaire {
  createurice_prenom: string | null;
  createurice_nom: string | null;
}

export interface NotationMarcheAvecAuteurice extends NotationMarche {
  acheteureuse_prenom: string | null;
  acheteureuse_nom: string | null;
}

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

// ============================================================
// Helpers d'hydratation
// ============================================================

async function chargerPersonnes(
  supabase: ClientSupabase,
  ids: string[],
): Promise<Map<string, { prenom: string | null; nom: string | null }>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase.from('personne').select('id, prenom, nom').in('id', ids);
  return new Map((data ?? []).map((p) => [p.id, { prenom: p.prenom, nom: p.nom }]));
}

async function chargerNotations(
  supabase: ClientSupabase,
  vendeureuseIds: string[],
): Promise<Map<string, Pick<NotationMarcheStats, 'moyenne_etoiles' | 'nombre_notations'>>> {
  if (vendeureuseIds.length === 0) return new Map();
  const { data } = await supabase
    .from('notation_marche_stats')
    .select('*')
    .in('vendeureuse_id', vendeureuseIds);
  return new Map(
    (data ?? [])
      .filter(
        (s): s is NotationMarcheStats & { vendeureuse_id: string } => s.vendeureuse_id !== null,
      )
      .map((s) => [
        s.vendeureuse_id,
        { moyenne_etoiles: s.moyenne_etoiles, nombre_notations: s.nombre_notations },
      ]),
  );
}

async function hydraterProduits(
  supabase: ClientSupabase,
  produits: ProduitMarche[],
): Promise<ProduitMarcheEnrichi[]> {
  if (produits.length === 0) return [];
  const idsVendeureuses = [...new Set(produits.map((p) => p.vendeureuse_id))];
  const [personnes, stats] = await Promise.all([
    chargerPersonnes(supabase, idsVendeureuses),
    chargerNotations(supabase, idsVendeureuses),
  ]);
  return produits.map((produit) => {
    const personne = personnes.get(produit.vendeureuse_id);
    const stat = stats.get(produit.vendeureuse_id);
    return {
      ...produit,
      vendeureuse_prenom: personne?.prenom ?? null,
      vendeureuse_nom: personne?.nom ?? null,
      moyenne_etoiles: stat?.moyenne_etoiles ?? null,
      nombre_notations: stat?.nombre_notations ?? 0,
    };
  });
}

async function hydraterBoutiques(
  supabase: ClientSupabase,
  boutiques: BoutiqueMarche[],
): Promise<BoutiqueMarcheEnrichie[]> {
  if (boutiques.length === 0) return [];
  const idsCreaturices = [...new Set(boutiques.map((b) => b.createurice_id))];
  const idsBoutiques = boutiques.map((b) => b.id);

  const [personnes, compteurs] = await Promise.all([
    chargerPersonnes(supabase, idsCreaturices),
    supabase.from('produit_boutique').select('boutique_id').in('boutique_id', idsBoutiques),
  ]);

  // Compteur par boutique : un Map<boutique_id, nombre_produits>.
  const compteur = new Map<string, number>();
  for (const ligne of compteurs.data ?? []) {
    compteur.set(ligne.boutique_id, (compteur.get(ligne.boutique_id) ?? 0) + 1);
  }

  return boutiques.map((boutique) => {
    const personne = personnes.get(boutique.createurice_id);
    return {
      ...boutique,
      createurice_prenom: personne?.prenom ?? null,
      createurice_nom: personne?.nom ?? null,
      nombre_produits: compteur.get(boutique.id) ?? 0,
    };
  });
}

async function hydraterMinimarches(
  supabase: ClientSupabase,
  minimarches: MinimarcheSolidaire[],
): Promise<MinimarcheSolidaireEnrichi[]> {
  if (minimarches.length === 0) return [];
  const idsCreaturices = [...new Set(minimarches.map((m) => m.createurice_id))];
  const personnes = await chargerPersonnes(supabase, idsCreaturices);
  return minimarches.map((minimarche) => {
    const personne = personnes.get(minimarche.createurice_id);
    return {
      ...minimarche,
      createurice_prenom: personne?.prenom ?? null,
      createurice_nom: personne?.nom ?? null,
    };
  });
}

// ============================================================
// Onglet 1 — Produits
// ============================================================

export interface FiltreListeProduits {
  /** Filtre `mode` (vente ou don). */
  mode?: 'vente' | 'don';
  /** Filtre catégorie technique (slug). */
  categorie?: string;
  /** Statuts inclus. Défaut : `disponible`. */
  statuts?: StatutProduitMarche[];
}

export async function listerProduitsMarche(
  filtre: FiltreListeProduits = {},
  limite = 50,
): Promise<ProduitMarcheEnrichi[]> {
  const supabase = await getSupabaseServer();
  const statuts = filtre.statuts ?? ['disponible'];

  let q = supabase
    .from('produit_marche')
    .select('*')
    .in('statut', statuts)
    .order('created_at', { ascending: false })
    .limit(limite);

  if (filtre.mode !== undefined) q = q.eq('mode', filtre.mode);
  if (filtre.categorie !== undefined && filtre.categorie !== '') {
    q = q.eq('categorie_slug', filtre.categorie);
  }

  const { data, error } = await q;
  if (error !== null || data === null) return [];
  return hydraterProduits(supabase, data as ProduitMarche[]);
}

export async function produitParSlug(slug: string): Promise<ProduitMarcheEnrichi | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('produit_marche')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error !== null || data === null) return null;
  const [h] = await hydraterProduits(supabase, [data as ProduitMarche]);
  return h ?? null;
}

export async function listerNotationsProduit(
  produitId: string,
): Promise<NotationMarcheAvecAuteurice[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('notation_marche')
    .select('*')
    .eq('produit_id', produitId)
    .order('created_at', { ascending: false });
  const lignes = data ?? [];
  if (lignes.length === 0) return [];
  const personnes = await chargerPersonnes(supabase, [
    ...new Set(lignes.map((n) => n.acheteureuse_id)),
  ]);
  return lignes.map((n) => {
    const p = personnes.get(n.acheteureuse_id);
    return {
      ...n,
      acheteureuse_prenom: p?.prenom ?? null,
      acheteureuse_nom: p?.nom ?? null,
    };
  });
}

// ============================================================
// Onglet 2 — Boutiques
// ============================================================

export async function listerBoutiques(limite = 50): Promise<BoutiqueMarcheEnrichie[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('boutique_marche')
    .select('*')
    .eq('statut', 'ouverte')
    .order('created_at', { ascending: false })
    .limit(limite);
  if (error !== null || data === null) return [];
  return hydraterBoutiques(supabase, data as BoutiqueMarche[]);
}

export async function boutiqueParSlug(slug: string): Promise<BoutiqueMarcheEnrichie | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('boutique_marche')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error !== null || data === null) return null;
  const [h] = await hydraterBoutiques(supabase, [data as BoutiqueMarche]);
  return h ?? null;
}

export async function produitsDeLaBoutique(boutiqueId: string): Promise<ProduitMarcheEnrichi[]> {
  const supabase = await getSupabaseServer();
  const { data: liens } = await supabase
    .from('produit_boutique')
    .select('produit_id')
    .eq('boutique_id', boutiqueId);
  const ids = (liens ?? []).map((l) => l.produit_id);
  if (ids.length === 0) return [];
  const { data: produits } = await supabase
    .from('produit_marche')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false });
  return hydraterProduits(supabase, (produits ?? []) as ProduitMarche[]);
}

// ============================================================
// Onglet 3 — Minimarchés
// ============================================================

export async function listerMinimarches(
  statuts: StatutMinimarche[] = ['annonce', 'en_cours'],
  limite = 50,
): Promise<MinimarcheSolidaireEnrichi[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('minimarche_solidaire')
    .select('*')
    .in('statut', statuts)
    .order('commence_le', { ascending: true })
    .limit(limite);
  if (error !== null || data === null) return [];
  return hydraterMinimarches(supabase, data as MinimarcheSolidaire[]);
}

export async function minimarcheParSlug(slug: string): Promise<MinimarcheSolidaireEnrichi | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('minimarche_solidaire')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error !== null || data === null) return null;
  const [h] = await hydraterMinimarches(supabase, [data as MinimarcheSolidaire]);
  return h ?? null;
}
