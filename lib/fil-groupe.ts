/**
 * Helpers pour le fil de discussion de groupe (cycle V2 §18, chantier
 * V2.2.1). Le fil de groupe est distinct de la messagerie individuelle
 * (`message_reseau`, V1) : c'est une **conversation collective** rattachée
 * à un espace (commune, campagne, GT, groupe d'entraide, etc.) où les
 * membres coordonnent, partagent, organisent.
 *
 * Cf. migration `supabase/migrations/20260527030000_fil_groupe.sql` pour
 * le schéma, les policies RLS et le helper SQL `est_membre_espace`.
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * Types d'espace qui peuvent porter un fil de groupe. Liste fermée
 * extensible (cohérent avec le CHECK SQL et l'esprit D13).
 */
export type EspaceTypeFil =
  | 'commune'
  | 'federation'
  | 'confederation'
  | 'campagne'
  | 'gt_thematique'
  | 'groupe_entraide_local';

export interface MessageFil {
  id: string;
  espaceType: EspaceTypeFil;
  espaceId: string;
  auteurId: string;
  contenu: string;
  parentId: string | null;
  supprimeLe: string | null;
  motifSuppression: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PosterMessageOptions {
  espaceType: EspaceTypeFil;
  espaceId: string;
  /** Compte authentifié qui poste. Doit correspondre à la session. */
  auteurId: string;
  contenu: string;
  /** Réponse à un message précédent (fil filé). */
  parentId?: string | null;
}

export type ResultatMessage = { ok: true; message: MessageFil } | { ok: false; message: string };

const LONGUEUR_MIN = 1;
const LONGUEUR_MAX = 4000;

/**
 * Poste un message dans le fil d'un espace. La RLS vérifie côté serveur
 * que l'auteur est bien membre de l'espace ; cette fonction fait une
 * validation préalable de la longueur et de la non-vacuité.
 */
export async function posterMessageFil(options: PosterMessageOptions): Promise<ResultatMessage> {
  const contenuNettoye = options.contenu.trim();
  if (contenuNettoye.length < LONGUEUR_MIN) {
    return { ok: false, message: 'Le message ne peut pas être vide.' };
  }
  if (contenuNettoye.length > LONGUEUR_MAX) {
    return {
      ok: false,
      message: `Le message dépasse la longueur maximale (${LONGUEUR_MAX} caractères).`,
    };
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('fil_groupe_message')
    .insert({
      espace_type: options.espaceType,
      espace_id: options.espaceId,
      auteur_id: options.auteurId,
      contenu: contenuNettoye,
      parent_id: options.parentId ?? null,
    })
    .select('*')
    .single();

  if (error !== null || data === null) {
    return { ok: false, message: error?.message ?? 'Insertion impossible.' };
  }

  return { ok: true, message: ligneEnMessage(data) };
}

export interface ListerFilOptions {
  espaceType: EspaceTypeFil;
  espaceId: string;
  /** Limite de messages renvoyés (les plus récents en tête). */
  limite?: number;
  /** Curseur de pagination : ne renvoie que les messages plus anciens que ce timestamp. */
  avantDate?: string;
}

/**
 * Liste les messages d'un fil. La RLS filtre déjà aux membres de l'espace
 * ; cette fonction se contente de la requête bornée.
 */
export async function listerMessagesFil(options: ListerFilOptions): Promise<MessageFil[]> {
  const supabase = await getSupabaseServer();
  let requete = supabase
    .from('fil_groupe_message')
    .select('*')
    .eq('espace_type', options.espaceType)
    .eq('espace_id', options.espaceId)
    .is('supprime_le', null)
    .order('created_at', { ascending: false })
    .limit(options.limite ?? 50);

  if (options.avantDate !== undefined) {
    requete = requete.lt('created_at', options.avantDate);
  }

  const { data, error } = await requete;
  if (error !== null || data === null) {
    return [];
  }
  return data.map(ligneEnMessage);
}

export interface SupprimerMessageOptions {
  messageId: string;
  /** Modérateur qui agit. */
  supprimeParPersonneId: string;
  motif: string;
}

/**
 * Soft delete d'un message (modération). La RLS exige un rôle admin /
 * modérateur réseau ; on documente le motif pour l'audit.
 */
export async function supprimerMessageFil(
  options: SupprimerMessageOptions,
): Promise<{ ok: boolean; message?: string }> {
  if (options.motif.trim().length < 3) {
    return { ok: false, message: 'Le motif de suppression doit être renseigné.' };
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('fil_groupe_message')
    .update({
      supprime_le: new Date().toISOString(),
      supprime_par: options.supprimeParPersonneId,
      motif_suppression: options.motif.trim(),
    })
    .eq('id', options.messageId);

  if (error !== null) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

function ligneEnMessage(ligne: {
  id: string;
  espace_type: string;
  espace_id: string;
  auteur_id: string;
  contenu: string;
  parent_id: string | null;
  supprime_le: string | null;
  motif_suppression: string | null;
  created_at: string;
  updated_at: string;
}): MessageFil {
  return {
    id: ligne.id,
    espaceType: ligne.espace_type as EspaceTypeFil,
    espaceId: ligne.espace_id,
    auteurId: ligne.auteur_id,
    contenu: ligne.contenu,
    parentId: ligne.parent_id,
    supprimeLe: ligne.supprime_le,
    motifSuppression: ligne.motif_suppression,
    createdAt: ligne.created_at,
    updatedAt: ligne.updated_at,
  };
}
