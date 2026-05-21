import { getSupabaseServer } from '@/lib/supabase';
import type { Petition } from '@/types/database';

/**
 * Couche de requêtes du sous-espace Pétitions.
 *
 * Centralise les SELECT pour qu'aucune page n'écrive du Supabase
 * directement : les Server Components ne dépendent que de ces helpers,
 * faciles à mocker en tests et à lire d'un coup d'œil.
 */

/**
 * Vue enrichie d'une pétition prête à être affichée : on joint le compteur
 * de signatures et quelques infos de la créatrice pour économiser des
 * allers-retours côté UI.
 */
export interface PetitionAvecCompteur extends Petition {
  /** Nombre de signatures (depuis la fonction `nombre_signatures`). */
  nombre_signatures: number;
  /** Prénom de la créatrice (affiché sur les cartes et la modale). */
  createurice_prenom: string | null;
  /** Nom de la créatrice (affiché sur la fiche détail). */
  createurice_nom: string | null;
}

type ClientSupabase = Awaited<ReturnType<typeof getSupabaseServer>>;

/**
 * Récupère le nombre de signatures d'une pétition donnée. Passe par la
 * fonction SQL `nombre_signatures` (SECURITY DEFINER) plutôt que par un
 * count() direct sur `signature_petition` : la RLS de la table empêche
 * la lecture publique des lignes, mais la fonction expose l'agrégat.
 */
async function compterSignatures(supabase: ClientSupabase, petitionId: string): Promise<number> {
  const { data, error } = await supabase.rpc('nombre_signatures', {
    petition_a_compter: petitionId,
  });
  if (error !== null || data === null) {
    return 0;
  }
  // La fonction SQL renvoie `bigint` que PostgREST sérialise tantôt en
  // number, tantôt en string selon la magnitude. On gère les deux.
  return typeof data === 'string' ? Number.parseInt(data, 10) : data;
}

/**
 * Hydrate un lot de pétitions avec les noms/prénoms des créatrices et le
 * compteur de signatures. Une seule requête `personne` (IN-clause) et N
 * appels RPC parallèles pour les compteurs.
 */
async function hydraterPetitions(
  supabase: ClientSupabase,
  petitions: Petition[],
): Promise<PetitionAvecCompteur[]> {
  if (petitions.length === 0) return [];

  const idsCreaturices = [...new Set(petitions.map((p) => p.createurice_id))];

  const [{ data: personnes }, compteurs] = await Promise.all([
    supabase.from('personne').select('id, prenom, nom').in('id', idsCreaturices),
    Promise.all(petitions.map((p) => compterSignatures(supabase, p.id))),
  ]);

  const indexPersonnes = new Map(
    (personnes ?? []).map((p) => [p.id, { prenom: p.prenom, nom: p.nom }]),
  );

  return petitions.map((petition, index) => {
    const personne = indexPersonnes.get(petition.createurice_id);
    return {
      ...petition,
      nombre_signatures: compteurs[index] ?? 0,
      createurice_prenom: personne?.prenom ?? null,
      createurice_nom: personne?.nom ?? null,
    };
  });
}

/**
 * Liste les pétitions publiées, triées par récence.
 *
 * @param limite Nombre maximum de résultats (par défaut 50, raisonnable
 * pour une page de liste ; la pagination viendra plus tard si la masse
 * devient importante).
 */
export async function listerPetitionsPubliees(limite = 50): Promise<PetitionAvecCompteur[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('petition')
    .select('*')
    .eq('statut', 'publiee')
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error !== null || data === null) {
    return [];
  }

  return hydraterPetitions(supabase, data as Petition[]);
}

/**
 * Pétition la plus récente publiée — pour la « Une » d'accueil.
 * Retourne null s'il n'y en a aucune.
 */
export async function petitionAlaUne(): Promise<PetitionAvecCompteur | null> {
  const liste = await listerPetitionsPubliees(1);
  return liste[0] ?? null;
}

/**
 * Pétition par slug, accessible publiquement uniquement si publiée
 * (la RLS s'en charge). Retourne null si aucune ligne lisible.
 */
export async function petitionParSlug(slug: string): Promise<PetitionAvecCompteur | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('petition')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error !== null || data === null) {
    return null;
  }

  const [hydratee] = await hydraterPetitions(supabase, [data as Petition]);
  return hydratee ?? null;
}

/**
 * Pétitions en attente de modération. Réservé à la console admin.
 * Aucun filtre RLS à ajouter ici : la table `petition` filtre déjà à la
 * lecture si la personne n'a pas le droit `petitions`.
 */
export async function listerPetitionsAModerer(): Promise<PetitionAvecCompteur[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('petition')
    .select('*')
    .eq('statut', 'en_moderation')
    .order('created_at', { ascending: true });

  if (error !== null || data === null) {
    return [];
  }

  return hydraterPetitions(supabase, data as Petition[]);
}
