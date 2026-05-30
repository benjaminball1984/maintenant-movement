/**
 * Lectures des revendications d'organisation (épopée réseau V2, chantier B.3).
 *
 * Une revendication = une demande pour devenir gestionnaire d'une organisation
 * existante. L'admin arbitre. Server-only.
 */

import { getSession } from '@/lib/auth/session';
import {
  type IdentiteAffichee,
  chargerIdentitesAffichables,
  nomAffichageRespectantVisibilite,
} from '@/lib/reseau/identite';
import { getSupabaseServer } from '@/lib/supabase';

/**
 * Statut de la revendication du lecteur courant sur une organisation donnée :
 * - `aucune` : pas de revendication (ni gestionnaire).
 * - `en_attente` : revendication déposée, en file d'attente.
 * - `gestionnaire` : déjà gestionnaire (rien à revendiquer).
 */
export type StatutRevendicationCourante = 'aucune' | 'en_attente' | 'gestionnaire';

/**
 * Indique l'état du lecteur courant vis-à-vis de la gestion d'une organisation.
 * Sert à afficher le bon bouton (revendiquer / en attente / rien).
 */
export async function statutRevendicationCourante(
  orgId: string,
  estDejaGestionnaire: boolean,
): Promise<StatutRevendicationCourante> {
  if (estDejaGestionnaire) return 'gestionnaire';
  const session = await getSession();
  if (session === null) return 'aucune';
  const supabase = await getSupabaseServer();
  const { count } = await supabase
    .from('revendication_organisation')
    .select('*', { count: 'exact', head: true })
    .eq('organisation_id', orgId)
    .eq('personne_id', session.userId)
    .eq('statut', 'en_attente');
  return (count ?? 0) > 0 ? 'en_attente' : 'aucune';
}

/** Une revendication en attente, prête à afficher dans la console admin. */
export interface RevendicationAffichee {
  id: string;
  organisationId: string;
  organisationNom: string;
  organisationSlug: string;
  personneId: string;
  numero: string | null;
  nom: string;
  message: string | null;
  creeLe: string;
}

/**
 * Liste les revendications EN ATTENTE (console admin), de la plus ancienne à la
 * plus récente (premier arrivé, premier traité). Joint l'organisation et résout
 * l'identité du demandeur.
 */
export async function listerRevendicationsEnAttente(): Promise<RevendicationAffichee[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('revendication_organisation')
    .select('id, organisation_id, personne_id, message, created_at, organisation(nom, slug)')
    .eq('statut', 'en_attente')
    .order('created_at', { ascending: true });
  if (data === null || data.length === 0) return [];

  const identites = await chargerIdentitesAffichables(data.map((r) => r.personne_id));
  return data.map((r) => {
    const identite: IdentiteAffichee | undefined = identites.get(r.personne_id);
    // La jointure peut renvoyer un objet ou un tableau selon la inférence ; on
    // normalise défensivement.
    const org = Array.isArray(r.organisation) ? r.organisation[0] : r.organisation;
    return {
      id: r.id,
      organisationId: r.organisation_id,
      organisationNom: org?.nom ?? 'Organisation',
      organisationSlug: org?.slug ?? '',
      personneId: r.personne_id,
      numero: identite?.numero ?? null,
      nom: nomAffichageRespectantVisibilite(identite),
      message: r.message,
      creeLe: r.created_at,
    };
  });
}

/** Compte les revendications en attente (badge de la file de modération). */
export async function compterRevendicationsEnAttente(): Promise<number> {
  const supabase = await getSupabaseServer();
  const { count } = await supabase
    .from('revendication_organisation')
    .select('*', { count: 'exact', head: true })
    .eq('statut', 'en_attente');
  return count ?? 0;
}
