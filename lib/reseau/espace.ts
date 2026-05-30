/**
 * Publications de réseau social attribuées à un espace collectif
 * (V2.5.10 — Master Plan V2.6 Phase H, double visage).
 *
 * Un `post_reseau` reste toujours créé par une personne (l'`auteurice_id`
 * obligatoire est conservé pour traçabilité et modération), mais peut
 * être publié AU NOM d'un espace : commune libre, fédération, GT
 * thématique, groupe d'entraide local, campagne, confédération.
 *
 * À la lecture côté flux, ces posts apparaissent comme « publiés par
 * [Espace] » plutôt que « par [Personne] ». L'auteur reste mentionné en
 * sous-titre fin pour la transparence.
 *
 * Permission applicative (pas encore en RLS) :
 *   - L'auteur doit être membre de l'espace (présent dans la table
 *     d'appartenance correspondante).
 *   - Pour les confédérations, faute de table d'appartenance dédiée,
 *     on restreint aux admins de plateforme.
 *   - La modération a posteriori reste celle des posts personnels :
 *     un admin peut retirer un post au nom d'un espace comme un autre.
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';
// V2.5.22 — les types client-safe vivent désormais dans `types-espace.ts`
// pour pouvoir être importés depuis des composants client sans tirer la
// chaîne runtime de ce module (Supabase admin / next/headers).
export type { AttributionEspace, TypeEspacePostable } from './types-espace';
import type { TypeEspacePostable } from './types-espace';

interface ResultatPublication {
  ok: boolean;
  postId?: string;
  message?: string;
}

/**
 * Vérifie qu'une personne est membre actif·ve d'un espace donné.
 * Lecture par service_role pour contourner les RLS éventuelles.
 *
 * Switch explicite par type plutôt que table+colonne dynamique : permet
 * à TypeScript de typer correctement chaque requête, et rend la lecture
 * du code plus facile à auditer.
 *
 * Pour `confederation`, pas de table d'appartenance dédiée en V1 → la
 * fonction renvoie `false` ; la Server Action de publication devra
 * restreindre les confédérations aux admins de plateforme.
 */
export async function estMembreActifEspace(
  espaceType: TypeEspacePostable,
  espaceId: string,
  personneId: string,
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  let count: number | null = null;
  let error: { message: string } | null = null;
  switch (espaceType) {
    case 'commune': {
      const r = await supabase
        .from('appartenance_commune')
        .select('*', { count: 'exact', head: true })
        .eq('personne_id', personneId)
        .eq('commune_id', espaceId)
        .eq('est_active', true);
      count = r.count;
      error = r.error;
      break;
    }
    case 'federation':
      // Pas de table d'appartenance personne ↔ federation en V1.
      // `appartenance_federation` lie commune ↔ federation. Vérification
      // indirecte non implémentée pour cette V2.5.10 → refusé par défaut.
      // Server Action devra restreindre les fédérations aux admins de
      // plateforme.
      return false;
    case 'gt_thematique': {
      const r = await supabase
        .from('appartenance_gt')
        .select('*', { count: 'exact', head: true })
        .eq('personne_id', personneId)
        .eq('gt_thematique_id', espaceId)
        .eq('est_active', true);
      count = r.count;
      error = r.error;
      break;
    }
    case 'groupe_entraide_local': {
      const r = await supabase
        .from('appartenance_groupe_entraide_local')
        .select('*', { count: 'exact', head: true })
        .eq('personne_id', personneId)
        .eq('groupe_id', espaceId)
        .eq('est_active', true);
      count = r.count;
      error = r.error;
      break;
    }
    case 'campagne': {
      const r = await supabase
        .from('appartenance_campagne')
        .select('*', { count: 'exact', head: true })
        .eq('personne_id', personneId)
        .eq('campagne_id', espaceId)
        .eq('est_active', true);
      count = r.count;
      error = r.error;
      break;
    }
    case 'confederation':
      return false; // pas de table d'appartenance V1
    case 'organisation': {
      // B.2 : « membre actif » d'une organisation = gestionnaire actif. On lit
      // directement la table (service_role) : un gestionnaire peut publier au
      // nom de l'organisation.
      const r = await supabase
        .from('gestionnaire_espace')
        .select('*', { count: 'exact', head: true })
        .eq('espace_type', 'organisation')
        .eq('espace_id', espaceId)
        .eq('personne_id', personneId)
        .eq('statut', 'actif');
      count = r.count;
      error = r.error;
      break;
    }
  }
  if (error !== null) return false;
  return (count ?? 0) > 0;
}

/**
 * Crée un post `post_reseau` attribué à un espace collectif.
 *
 * Appelée par :
 *   - le script de seeding démo (pour peupler des publications au nom de
 *     communes démo)
 *   - la future Server Action côté UI (V2.5.10.a) qui permettra à un
 *     membre d'un espace de publier en son nom depuis la page de l'espace
 *
 * `auteuriceId` est la personne réelle qui clique sur Publier (conservée
 * pour la traçabilité). Le post sera affiché « par [Espace], publié par
 * [Auteur] » dans le flux.
 */
export async function creerPostEspace(args: {
  espaceType: TypeEspacePostable;
  espaceId: string;
  auteuriceId: string;
  texte: string;
  statut?: string;
}): Promise<ResultatPublication> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('post_reseau')
    .insert({
      auteurice_id: args.auteuriceId,
      espace_type: args.espaceType,
      espace_id: args.espaceId,
      texte: args.texte,
      statut: args.statut ?? 'publie',
    })
    .select('id')
    .single();
  if (error !== null || data === null) {
    return { ok: false, message: error?.message ?? 'INSERT post_reseau a échoué' };
  }
  return { ok: true, postId: data.id };
}

// V2.5.22 — `AttributionEspace` est maintenant défini dans `types-espace.ts`
// et réexporté en tête de ce fichier. La définition dupliquée a été retirée.

/**
 * Mapping type d'espace → chemin public de sa page détail. Sert à
 * fabriquer le lien cliquable sur le badge d'un post publié par
 * un espace.
 */
export function cheminPublicEspace(type: TypeEspacePostable, slug: string): string {
  switch (type) {
    case 'commune':
      return `/agir/communes/${slug}`;
    case 'federation':
      return `/agir/federations/${slug}`;
    case 'confederation':
      return '/agir/assemblee';
    case 'gt_thematique':
      return `/co-construire/${slug}`;
    case 'groupe_entraide_local':
      return `/s-entraider/groupes-locaux/${slug}`;
    case 'campagne':
      return `/mobiliser/campagnes/${slug}`;
    case 'organisation':
      return `/organisations/${slug}`;
  }
}
