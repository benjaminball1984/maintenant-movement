import { getSupabaseServer } from '@/lib/supabase';
import type { NiveauDroitAdmin } from '@/types/database';

/**
 * Lectures liées à la gestion des droits d'administration.
 *
 * Réservé à la console nationale : la RLS (`droit_admin_select`) n'autorise
 * la lecture de l'ensemble des droits qu'à l'admin nationale. Une personne
 * sans ce niveau ne verra rien remonter, même si elle atteignait ce code.
 */

/** Bénéficiaire d'un droit, tel qu'affiché dans la liste. */
export interface BeneficiaireDroit {
  id: string;
  prenom: string | null;
  nom: string | null;
  email: string | null;
}

/** Un droit actif, enrichi pour l'affichage (bénéficiaire + commune). */
export interface DroitAdminAffichage {
  id: string;
  niveau: NiveauDroitAdmin;
  perimetre_onglet: string[] | null;
  scope_commune_id: string | null;
  accorde_le: string;
  beneficiaire: BeneficiaireDroit | null;
  commune: { nom: string } | null;
}

/**
 * Liste les droits d'administration actifs (non retirés), du plus récent
 * au plus ancien. Joint le bénéficiaire et, pour les droits d'animation,
 * la commune ciblée.
 */
export async function listerDroitsActifs(): Promise<DroitAdminAffichage[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('droit_admin')
    .select(
      `id, niveau, perimetre_onglet, scope_commune_id, accorde_le,
       beneficiaire:personne!droit_admin_personne_id_fkey ( id, prenom, nom, email ),
       commune:commune!droit_admin_scope_commune_id_fkey ( nom )`,
    )
    .is('retire_le', null)
    .order('accorde_le', { ascending: false });

  if (error !== null || data === null) {
    return [];
  }

  // Cast maîtrisé : la colonne `niveau` est un `text` côté base, contraint
  // par un CHECK aux valeurs de `NiveauDroitAdmin`.
  return data as unknown as DroitAdminAffichage[];
}
