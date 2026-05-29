/**
 * Couche d'accès aux commentaires polymorphes (`commentaire_objet`).
 *
 * Chantier A (V2.6) : commentaires sur tous les contenus du site. Réutilise
 * l'identité réseau (`chargerIdentites` → `personne_affichage`) pour que
 * chaque auteurice de commentaire soit affiché·e avec son numéro M+7,
 * cliquable vers son profil réseau et suivable.
 */
import { type IdentiteAffichee, chargerIdentites } from '@/lib/reseau/requetes';
import { getSupabaseServer } from '@/lib/supabase';

/**
 * Types de contenu commentables. Aligné sur le CHECK de la migration
 * `20260531100000_commentaire_objet.sql` (et donc sur les noms de tables
 * métier).
 */
export const OBJETS_COMMENTABLES = [
  'petition',
  'mobilisation',
  'cagnotte',
  'moment_solidaire',
  'sondage',
  'campagne',
  'offre_entraide',
  'service_sel',
  'produit_marche',
  'boutique_marche',
] as const;

export type ObjetCommentable = (typeof OBJETS_COMMENTABLES)[number];

/** Vrai si la chaîne est un type d'objet commentable connu. */
export function estObjetCommentable(valeur: string): valeur is ObjetCommentable {
  return (OBJETS_COMMENTABLES as readonly string[]).includes(valeur);
}

/** Commentaire enrichi pour l'affichage (auteurice masqué·e selon visibilité). */
export interface CommentaireObjetAffiche {
  id: string;
  auteur: IdentiteAffichee;
  texte: string;
  createdAt: string;
}

/**
 * Liste les commentaires publiés d'un objet, du plus ancien au plus récent.
 * Chaque auteurice est résolu·e via `chargerIdentites` (masquage de visibilité
 * + numéro public pour le lien vers le profil réseau).
 */
export async function listerCommentairesObjet(
  objetType: ObjetCommentable,
  objetId: string,
): Promise<CommentaireObjetAffiche[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('commentaire_objet')
    .select('id, auteurice_id, texte, created_at')
    .eq('objet_type', objetType)
    .eq('objet_id', objetId)
    .eq('statut', 'publie')
    .order('created_at', { ascending: true });
  if (error !== null || data === null) return [];

  const identites = await chargerIdentites(
    supabase,
    data.map((c) => c.auteurice_id),
  );
  return data.map((c) => ({
    id: c.id,
    auteur: identites.get(c.auteurice_id) ?? {
      personneId: c.auteurice_id,
      numero: null,
      prenom: null,
      nom: null,
      photoUrl: null,
    },
    texte: c.texte,
    createdAt: c.created_at,
  }));
}

/** Nombre de commentaires publiés d'un objet (pour un badge / compteur). */
export async function compterCommentairesObjet(
  objetType: ObjetCommentable,
  objetId: string,
): Promise<number> {
  const supabase = await getSupabaseServer();
  const { count, error } = await supabase
    .from('commentaire_objet')
    .select('id', { count: 'exact', head: true })
    .eq('objet_type', objetType)
    .eq('objet_id', objetId)
    .eq('statut', 'publie');
  if (error !== null || count === null) return 0;
  return count;
}
