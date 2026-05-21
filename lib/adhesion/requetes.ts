import { getSupabaseServer } from '@/lib/supabase';
import type { AdherentActif, Adhesion } from '@/types/database';

/**
 * Couche de requêtes du sous-espace Adhérer (chantier 5.1).
 *
 * Lecture du statut d'adhésion d'une personne (active ou non) et de
 * l'historique de ses adhésions.
 */

/**
 * Retourne l'adhésion active de la personne, ou null si elle n'est
 * pas adhérente actuellement.
 */
export async function adhesionActive(personneId: string): Promise<AdherentActif | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('adherent_actif')
    .select('*')
    .eq('personne_id', personneId)
    .maybeSingle();
  if (error !== null || data === null) return null;
  return data;
}

/**
 * Historique complet des adhésions d'une personne (renouvellements
 * inclus). Le plus récent en premier.
 */
export async function historiqueAdhesions(personneId: string): Promise<Adhesion[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('adhesion')
    .select('*')
    .eq('personne_id', personneId)
    .order('debute_le', { ascending: false });
  if (error !== null || data === null) return [];
  return data as Adhesion[];
}
