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

/**
 * Liste TOUTES les pétitions, tous statuts confondus, pour la gestion par
 * l'équipe (édition). La RLS autorise la lecture complète aux admins et
 * modérateurices ; pour le reste du public, seules les pétitions publiées
 * remonteraient (et cette fonction n'est appelée que sous `/admin`).
 */
export async function listerToutesPetitionsAdmin(): Promise<PetitionAvecCompteur[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('petition')
    .select('*')
    .order('created_at', { ascending: false });

  if (error !== null || data === null) {
    return [];
  }

  return hydraterPetitions(supabase, data as Petition[]);
}

/**
 * Une signature de la personne connectée, accompagnée des infos de la
 * pétition concernée. Sert à l'espace « Mes contributions ».
 */
export interface MaSignature {
  /** Identifiant de la signature (cible du réglage de recontact). */
  id: string;
  /** Slug de la pétition signée (lien vers la page publique). */
  petition_slug: string;
  /** Titre de la pétition signée. */
  petition_titre: string;
  /** Statut de la pétition (publiee, en_moderation, ...). */
  petition_statut: string;
  /** La personne autorise-t-elle la créatrice à la recontacter ? */
  accepte_contact_createurice: boolean;
  /** Date de signature (ISO). */
  signee_le: string;
}

/**
 * Liste les pétitions signées par la personne connectée, avec pour chacune
 * le réglage de recontact (modifiable depuis /profil/contributions).
 *
 * Ne remonte QUE les signatures rattachées au compte (`personne_id`), via la
 * RLS `signature_petition_select`. Les signatures faites AVANT la création du
 * compte (importées, `personne_id` null, rattachables seulement par email) ne
 * sont pas encore reliées : le rattachement par email est une décision
 * d'architecture/RGPD en attente (cf. manifest 13.3-D). On joint les titres
 * via une IN-clause (même pattern que `hydraterPetitions`) ; une pétition non
 * lisible (RLS) est silencieusement omise.
 */
export async function listerMesSignatures(): Promise<MaSignature[]> {
  const supabase = await getSupabaseServer();

  const { data: signatures, error } = await supabase
    .from('signature_petition')
    .select('id, petition_id, accepte_contact_createurice, created_at')
    .order('created_at', { ascending: false });
  if (error !== null || signatures === null || signatures.length === 0) {
    return [];
  }

  const petitionIds = [...new Set(signatures.map((s) => s.petition_id))];
  const { data: petitions } = await supabase
    .from('petition')
    .select('id, slug, titre, statut')
    .in('id', petitionIds);
  const parId = new Map((petitions ?? []).map((p) => [p.id, p]));

  return signatures.flatMap((signature) => {
    const petition = parId.get(signature.petition_id);
    if (petition === undefined) return [];
    return [
      {
        id: signature.id,
        petition_slug: petition.slug,
        petition_titre: petition.titre,
        petition_statut: petition.statut,
        accepte_contact_createurice: signature.accepte_contact_createurice,
        signee_le: signature.created_at,
      },
    ];
  });
}
