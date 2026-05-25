import { getSupabaseServer } from '@/lib/supabase';

/**
 * Couche de requêtes du référentiel géographique (`commune_reference`) et des
 * compteurs territoriaux anonymisés (chantier 13.3-C).
 *
 * Distinct de `lib/communes/requetes.ts` (communes LIBRES actives, table
 * `commune`). Ici on travaille sur le référentiel complet (35 000 communes +
 * 45 arrondissements), en lecture publique, plus les agrégats anonymisés.
 */

/** Une commune (ou arrondissement) du référentiel géographique. */
export interface CommuneReference {
  code_insee: string;
  nom: string;
  type: string;
  code_departement: string | null;
  region: string | null;
  population: number | null;
  latitude: number | null;
  longitude: number | null;
}

/** Compteurs territoriaux ANONYMISÉS (uniquement des nombres). */
export interface CompteursCommune {
  inscrits: number;
  signataires: number;
  abonnes: number;
}

/**
 * Lit une commune du référentiel par son code INSEE. `null` si inconnue.
 * Lecture publique (policy `commune_reference_select_public`).
 */
export async function getCommuneReference(codeInsee: string): Promise<CommuneReference | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('commune_reference')
    .select('code_insee, nom, type, code_departement, region, population, latitude, longitude')
    .eq('code_insee', codeInsee)
    .maybeSingle();
  if (error !== null || data === null) {
    return null;
  }
  return data;
}

/**
 * Compteurs anonymisés d'une commune (inscrits, signataires, abonnés), via la
 * fonction SQL `compteurs_commune` (SECURITY DEFINER).
 *
 * Résilience : si la fonction n'existe pas encore sur la base (migration 037
 * non appliquée), on renvoie `null` plutôt que de planter. L'UI affiche alors
 * un état « compteurs indisponibles » au lieu de chiffres faux.
 */
export async function getCompteursCommune(codeInsee: string): Promise<CompteursCommune | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.rpc('compteurs_commune', { cible_insee: codeInsee });
  if (error !== null || data === null) {
    return null;
  }
  // La fonction renvoie une table à une ligne ; PostgREST sérialise en tableau.
  const ligne = Array.isArray(data) ? data[0] : data;
  if (ligne === undefined || ligne === null) {
    return null;
  }
  return {
    inscrits: nombre(ligne.inscrits),
    signataires: nombre(ligne.signataires),
    abonnes: nombre(ligne.abonnes),
  };
}

/**
 * Cherche la commune LIBRE (table `commune`) correspondant à un code INSEE du
 * référentiel.
 *
 * Décision Lilou/Ben (2026-05-25, révise la doctrine §7B) : on pré-crée une
 * coquille (`statut_creation = 'pre_creee'`) pour CHAQUE commune et
 * arrondissement du référentiel, via `scripts/precreer-communes.ts`. La
 * correspondance existe donc normalement toujours une fois ce script exécuté,
 * et chaque commune est « rejoignable » immédiatement.
 *
 * On renvoie tout de même `null` si la coquille n'a pas encore été
 * matérialisée (script pas lancé sur cette base), pour une dégradation propre
 * de l'UI plutôt qu'un crash.
 */
export async function getCommuneLibreParInsee(
  codeInsee: string,
): Promise<{ id: string; slug: string } | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('commune')
    .select('id, slug')
    .eq('code_insee', codeInsee)
    .maybeSingle();
  if (error !== null || data === null) {
    return null;
  }
  return data;
}

/**
 * `bigint` PostgREST arrive tantôt en number, tantôt en string : on normalise.
 */
function nombre(valeur: unknown): number {
  if (typeof valeur === 'number') return valeur;
  if (typeof valeur === 'string') return Number.parseInt(valeur, 10) || 0;
  return 0;
}
