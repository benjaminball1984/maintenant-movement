/**
 * Liaisons contenu ↔ organisation porteuse (épopée réseau V2, chantier B.4).
 *
 * Lectures server-only. Les mutations passent par les Server Actions + RPC
 * SECURITY DEFINER (cf. app/actions/organisation.ts).
 */

import { getSupabaseServer } from '@/lib/supabase';

/** Types de contenu pouvant être portés par une organisation (= CHECK SQL). */
export const TYPES_CONTENU_ORGANISATION = [
  'petition',
  'cagnotte',
  'mobilisation',
  'campagne',
  'sondage',
  'moment',
] as const;

export type TypeContenuOrganisation = (typeof TYPES_CONTENU_ORGANISATION)[number];

/** Organisation porteuse d'un contenu, prête à afficher. */
export interface OrganisationPorteuse {
  id: string;
  nom: string;
  slug: string;
  badgeOfficiel: boolean;
}

/** Retourne l'organisation qui porte ce contenu, ou null. */
export async function organisationDuContenu(
  objetType: TypeContenuOrganisation,
  objetId: string,
): Promise<OrganisationPorteuse | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('contenu_organisation')
    .select('organisation(id, nom, slug, badge_officiel)')
    .eq('objet_type', objetType)
    .eq('objet_id', objetId)
    .maybeSingle();
  if (data === null) return null;
  const org = Array.isArray(data.organisation) ? data.organisation[0] : data.organisation;
  if (org === null || org === undefined) return null;
  return { id: org.id, nom: org.nom, slug: org.slug, badgeOfficiel: org.badge_officiel };
}

/** Une organisation gérée par le lecteur (pour le sélecteur de rattachement). */
export interface OrganisationGeree {
  id: string;
  nom: string;
}

/**
 * Liste les organisations gérées (gestionnaire actif) par une personne. Sert au
 * sélecteur « rattacher ce contenu à une de mes organisations ».
 */
export async function listerOrganisationsGereesPar(
  personneId: string,
): Promise<OrganisationGeree[]> {
  const supabase = await getSupabaseServer();
  // `gestionnaire_espace.espace_id` est polymorphe (pas de FK vers organisation) :
  // on ne peut pas joindre via PostgREST, on fait deux requêtes.
  const { data: gestions } = await supabase
    .from('gestionnaire_espace')
    .select('espace_id')
    .eq('espace_type', 'organisation')
    .eq('personne_id', personneId)
    .eq('statut', 'actif');
  if (gestions === null || gestions.length === 0) return [];

  const ids = gestions.map((g) => g.espace_id);
  const { data: orgs } = await supabase.from('organisation').select('id, nom').in('id', ids);
  return (orgs ?? []).map((o) => ({ id: o.id, nom: o.nom }));
}
