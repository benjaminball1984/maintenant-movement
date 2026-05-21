import { getSupabaseServer } from '@/lib/supabase';
import type { Mobilisation } from '@/types/database';

/**
 * Couche de requêtes du sous-espace Mobilisations (chantier 3.2).
 *
 * Pattern identique à `lib/petitions/requetes.ts` (3.1) :
 *   - SELECT centralisé,
 *   - hydratation des compteurs via RPC SECURITY DEFINER,
 *   - jointure créateurice par requête séparée (les Relationships du
 *     fichier `types/database.ts` sont vides).
 */

export interface MobilisationEnrichie extends Mobilisation {
  /** Nombre de participations (clic « je participe »). */
  nombre_participant_es: number;
  /** Prénom de la créateurice (affiché en pied de fiche). */
  createurice_prenom: string | null;
  /** Nom de la créateurice. */
  createurice_nom: string | null;
}

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

async function compterParticipations(
  supabase: ClientSupabase,
  mobilisationId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc('nombre_participant_es', {
    mobilisation_a_compter: mobilisationId,
  });
  if (error !== null || data === null) {
    return 0;
  }
  return typeof data === 'string' ? Number.parseInt(data, 10) : data;
}

/**
 * Hydrate un lot de mobilisations avec nom/prénom de créateurice et
 * compteur de participations. Un seul SELECT `personne` (IN-clause) +
 * N appels RPC parallèles. Pattern identique à `hydraterPetitions`.
 */
async function hydraterMobilisations(
  supabase: ClientSupabase,
  mobilisations: Mobilisation[],
): Promise<MobilisationEnrichie[]> {
  if (mobilisations.length === 0) return [];

  const idsCreaturices = [...new Set(mobilisations.map((m) => m.createurice_id))];

  const [{ data: personnes }, compteurs] = await Promise.all([
    supabase.from('personne').select('id, prenom, nom').in('id', idsCreaturices),
    Promise.all(mobilisations.map((m) => compterParticipations(supabase, m.id))),
  ]);

  const indexPersonnes = new Map(
    (personnes ?? []).map((p) => [p.id, { prenom: p.prenom, nom: p.nom }]),
  );

  return mobilisations.map((mobilisation, index) => {
    const personne = indexPersonnes.get(mobilisation.createurice_id);
    return {
      ...mobilisation,
      nombre_participant_es: compteurs[index] ?? 0,
      createurice_prenom: personne?.prenom ?? null,
      createurice_nom: personne?.nom ?? null,
    };
  });
}

/**
 * Mobilisations publiées **à venir** (date_debut >= now), triées par
 * date croissante. C'est la vue agenda-like par défaut.
 */
export async function listerMobilisationsAVenir(limite = 50): Promise<MobilisationEnrichie[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('mobilisation')
    .select('*')
    .eq('statut', 'publiee')
    .gte('date_debut', new Date().toISOString())
    .order('date_debut', { ascending: true })
    .limit(limite);

  if (error !== null || data === null) {
    return [];
  }

  return hydraterMobilisations(supabase, data as Mobilisation[]);
}

/**
 * Mobilisations publiées **passées** (date_debut < now), triées par
 * date décroissante. Vue archive.
 */
export async function listerMobilisationsPassees(limite = 20): Promise<MobilisationEnrichie[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('mobilisation')
    .select('*')
    .eq('statut', 'publiee')
    .lt('date_debut', new Date().toISOString())
    .order('date_debut', { ascending: false })
    .limit(limite);

  if (error !== null || data === null) {
    return [];
  }

  return hydraterMobilisations(supabase, data as Mobilisation[]);
}

/**
 * Mobilisation à la une (la plus proche dans le temps parmi les
 * publiées à venir). Retourne null s'il n'y en a aucune.
 */
export async function mobilisationAlaUne(): Promise<MobilisationEnrichie | null> {
  const liste = await listerMobilisationsAVenir(1);
  return liste[0] ?? null;
}

/**
 * Mobilisation par slug. Accessible uniquement si publiée ou si la
 * personne connectée en est la créateurice (RLS).
 */
export async function mobilisationParSlug(slug: string): Promise<MobilisationEnrichie | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('mobilisation')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error !== null || data === null) {
    return null;
  }

  const [hydratee] = await hydraterMobilisations(supabase, [data as Mobilisation]);
  return hydratee ?? null;
}

/**
 * Mobilisations publiées et géolocalisées (lat/lng non null). Pour la
 * carte unifiée /carte. Limite haute pour avoir une couverture
 * raisonnable sur l'ensemble du territoire ; la carte filtre par bbox
 * côté client si besoin.
 */
export async function listerMobilisationsGeolocalisees(
  limite = 500,
): Promise<MobilisationEnrichie[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('mobilisation')
    .select('*')
    .eq('statut', 'publiee')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('date_debut', { ascending: true })
    .limit(limite);

  if (error !== null || data === null) {
    return [];
  }

  return hydraterMobilisations(supabase, data as Mobilisation[]);
}

/**
 * File de modération a posteriori : les mobilisations publiées en
 * attente de vérification. Pour la console admin. v1 = toutes les
 * mobilisations publiées (le modé décide d'agir ou pas) ; v2 pourra
 * filtrer par signalements (table à créer plus tard).
 */
export async function listerMobilisationsAVerifier(): Promise<MobilisationEnrichie[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('mobilisation')
    .select('*')
    .eq('statut', 'publiee')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error !== null || data === null) {
    return [];
  }

  return hydraterMobilisations(supabase, data as Mobilisation[]);
}

/**
 * Test (utile pour l'UI) : la personne connectée participe-t-elle à
 * cette mobilisation ? Retourne false pour les anonymes (le cookie
 * client est la source de vérité côté UX dans ce cas).
 */
export async function dejaParticipante(mobilisationId: string): Promise<boolean> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return false;

  const { count } = await supabase
    .from('participation_mobilisation')
    .select('id', { count: 'exact', head: true })
    .eq('mobilisation_id', mobilisationId)
    .eq('personne_id', user.id);

  return (count ?? 0) > 0;
}
