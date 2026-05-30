/**
 * Helpers de lecture pour l'amitié réseau (épopée réseau V2, chantier D.1).
 *
 * L'amitié est une relation STOCKÉE (table `amitie`, migration V2.6.7),
 * distincte du suivi (`relation_reseau`) : elle a un cycle
 * demande → acceptation. Ce module lit l'état d'amitié pour alimenter l'UI
 * (bouton « Demander en ami·e » / « Ami·e » / « Répondre »), et liste les
 * demandes reçues.
 *
 * Server-only : s'appuie sur `getSession` + `getSupabaseServer` (RLS active :
 * une personne ne voit que les lignes d'amitié qui la concernent).
 */

import { getSession } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import {
  type IdentiteAffichee,
  chargerIdentitesAffichables,
  nomAffichageRespectantVisibilite,
} from './identite';

/**
 * État de l'amitié entre le lecteur courant et une cible, du point de vue du
 * lecteur :
 * - `aucune` : pas de relation d'amitié active.
 * - `demande_envoyee` : le lecteur a demandé, en attente de réponse.
 * - `demande_recue` : la cible a demandé au lecteur, à lui de répondre.
 * - `amis` : amitié acceptée.
 */
export type StatutAmitie = 'aucune' | 'demande_envoyee' | 'demande_recue' | 'amis';

export interface EtatAmitie {
  statut: StatutAmitie;
  /** Identifiant de la ligne `amitie` (présent dès qu'une relation existe). */
  amitieId: string | null;
  /**
   * À l'état `aucune` : indique si le lecteur a le droit d'envoyer une demande
   * (la cible le suit déjà, ou autorise les demandes ouvertes). Faux dans les
   * autres états (sans objet).
   */
  peutDemander: boolean;
}

/** Ligne d'amitié minimale, telle que lue depuis la table. */
export interface LigneAmitie {
  demandeur_id: string;
  destinataire_id: string;
  statut: string;
}

/**
 * Dérive le statut d'amitié du point de vue du lecteur `moi` à partir d'une
 * ligne active (non refusée). Fonction PURE (testable sans base) :
 * - statut `acceptee` → `amis` ;
 * - `en_attente` et je suis le demandeur → `demande_envoyee` ;
 * - `en_attente` et je suis le destinataire → `demande_recue`.
 *
 * Toute autre valeur de statut (ex. `refusee` qui ne devrait pas arriver ici)
 * retombe sur `aucune`.
 */
export function deriverStatutAmitie(ligne: LigneAmitie, moi: string): StatutAmitie {
  if (ligne.statut === 'acceptee') return 'amis';
  if (ligne.statut === 'en_attente') {
    return ligne.demandeur_id === moi ? 'demande_envoyee' : 'demande_recue';
  }
  return 'aucune';
}

/**
 * Calcule l'état d'amitié entre le lecteur courant et `cibleId`.
 * Retourne `aucune` (sans droit de demander) si non connecté ou cible = soi.
 */
export async function etatAmitieAvec(cibleId: string): Promise<EtatAmitie> {
  const session = await getSession();
  if (session === null || session.userId === cibleId) {
    return { statut: 'aucune', amitieId: null, peutDemander: false };
  }
  const supabase = await getSupabaseServer();

  // Ligne d'amitié active (non refusée) entre les deux, quel que soit le sens.
  const { data } = await supabase
    .from('amitie')
    .select('id, demandeur_id, destinataire_id, statut')
    .neq('statut', 'refusee')
    .or(
      `and(demandeur_id.eq.${session.userId},destinataire_id.eq.${cibleId}),` +
        `and(demandeur_id.eq.${cibleId},destinataire_id.eq.${session.userId})`,
    )
    .maybeSingle();

  if (data !== null) {
    return {
      statut: deriverStatutAmitie(data, session.userId),
      amitieId: data.id,
      peutDemander: false,
    };
  }

  // Aucune relation : le bouton « Demander » dépend du droit côté cible.
  const { data: peut } = await supabase.rpc('peut_demander_ami', { cible: cibleId });
  return { statut: 'aucune', amitieId: null, peutDemander: peut === true };
}

/** Une demande d'ami reçue, prête à afficher (identité respectant la visibilité). */
export interface DemandeAmiRecue {
  amitieId: string;
  demandeurId: string;
  /** Numéro public M+7 du demandeur (handle réseau, jamais masqué). */
  numero: string | null;
  /** Étiquette humaine (Prénom Nom, ou numéro, ou « Membre »). */
  nom: string;
  creeLe: string;
}

/**
 * Liste les demandes d'ami EN ATTENTE reçues par le lecteur courant, de la plus
 * récente à la plus ancienne. Identité du demandeur résolue via
 * `personne_affichage` (respect de la visibilité).
 */
export async function listerDemandesAmiRecues(): Promise<DemandeAmiRecue[]> {
  const session = await getSession();
  if (session === null) return [];
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('amitie')
    .select('id, demandeur_id, created_at')
    .eq('destinataire_id', session.userId)
    .eq('statut', 'en_attente')
    .order('created_at', { ascending: false });
  if (data === null || data.length === 0) return [];

  const identites = await chargerIdentitesAffichables(data.map((d) => d.demandeur_id));
  return data.map((d) => {
    const identite: IdentiteAffichee | undefined = identites.get(d.demandeur_id);
    return {
      amitieId: d.id,
      demandeurId: d.demandeur_id,
      numero: identite?.numero ?? null,
      nom: nomAffichageRespectantVisibilite(identite),
      creeLe: d.created_at,
    };
  });
}

/**
 * Indique si le lecteur courant peut envoyer un message à `cibleId` (chantier
 * D.3 : messagerie verrouillée). Vrai si ami·es, si la cible a ouvert sa
 * messagerie, ou si elle a déjà écrit au lecteur. Sert à afficher (ou non) le
 * bouton d'envoi ; la RLS reste la barrière réelle côté insertion.
 */
export async function peutEnvoyerMessageA(cibleId: string): Promise<boolean> {
  const session = await getSession();
  if (session === null || session.userId === cibleId) return false;
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.rpc('peut_envoyer_message_reseau', {
    destinataire: cibleId,
  });
  // Dégradation propre : si la RPC n'existe pas encore au distant, on n'empêche
  // pas l'affichage du bouton (la RLS reste la barrière). On ne masque que sur
  // un refus EXPLICITE (`false`).
  if (error !== null) return true;
  return data !== false;
}

/** Compte les demandes d'ami en attente reçues (pour un badge de navigation). */
export async function compterDemandesAmiRecues(): Promise<number> {
  const session = await getSession();
  if (session === null) return 0;
  const supabase = await getSupabaseServer();
  const { count } = await supabase
    .from('amitie')
    .select('*', { count: 'exact', head: true })
    .eq('destinataire_id', session.userId)
    .eq('statut', 'en_attente');
  return count ?? 0;
}
