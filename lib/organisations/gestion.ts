/**
 * Lectures liées à la gestion des organisations (épopée réseau V2, chantier
 * B.2) : suis-je gestionnaire ? qui sont les gestionnaires ?
 *
 * Server-only. Les mutations passent par les Server Actions + RPC SECURITY
 * DEFINER (cf. app/actions/organisation.ts).
 */

import { getSession } from '@/lib/auth/session';
import {
  type IdentiteAffichee,
  chargerIdentitesAffichables,
  nomAffichageRespectantVisibilite,
} from '@/lib/reseau/identite';
import { getSupabaseServer } from '@/lib/supabase';

/** Indique si le lecteur courant est gestionnaire actif d'une organisation. */
export async function estGestionnaireOrganisation(orgId: string): Promise<boolean> {
  const session = await getSession();
  if (session === null) return false;
  const supabase = await getSupabaseServer();
  const { data } = await supabase.rpc('est_gestionnaire_espace', {
    p_espace_type: 'organisation',
    p_espace_id: orgId,
  });
  return data === true;
}

/** Un gestionnaire d'organisation, prêt à afficher. */
export interface GestionnaireAffiche {
  gestionnaireId: string;
  personneId: string;
  numero: string | null;
  nom: string;
  attestation: boolean;
  creeLe: string;
}

/** Liste les gestionnaires actifs d'une organisation (identité respectée). */
export async function listerGestionnairesOrganisation(
  orgId: string,
): Promise<GestionnaireAffiche[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('gestionnaire_espace')
    .select('id, personne_id, attestation, cree_le')
    .eq('espace_type', 'organisation')
    .eq('espace_id', orgId)
    .eq('statut', 'actif')
    .order('cree_le', { ascending: true });
  if (data === null || data.length === 0) return [];

  const identites = await chargerIdentitesAffichables(data.map((g) => g.personne_id));
  return data.map((g) => {
    const identite: IdentiteAffichee | undefined = identites.get(g.personne_id);
    return {
      gestionnaireId: g.id,
      personneId: g.personne_id,
      numero: identite?.numero ?? null,
      nom: nomAffichageRespectantVisibilite(identite),
      attestation: g.attestation,
      creeLe: g.cree_le,
    };
  });
}
