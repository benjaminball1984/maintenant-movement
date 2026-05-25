import { nomAffiche } from '@/lib/reseau/requetes';
import { getSupabaseServer } from '@/lib/supabase';

/**
 * Membres d'une commune libre, pour l'affichage ENTRE MEMBRES (décision A,
 * 2026-05-25). Passe par la fonction SQL `membres_commune` (SECURITY DEFINER),
 * qui ne renvoie la liste QUE si le lecteur est lui-même membre, et masque les
 * champs d'identité selon `preferences_visibilite`.
 */
export interface MembreCommune {
  personneId: string;
  /** Numéro public M+7 (lien vers le profil réseau), ou null. */
  numero: string | null;
  /** Nom affiché (prénom + nom dans le respect de la visibilité). */
  nom: string;
  photoUrl: string | null;
}

/** Liste les membres actifs d'une commune (vide si le lecteur n'est pas membre). */
export async function listerMembresCommune(communeId: string): Promise<MembreCommune[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.rpc('membres_commune', { commune_cible: communeId });
  if (error !== null || data === null) {
    return [];
  }
  return data.map((m) => ({
    personneId: m.personne_id,
    numero: m.numero_unique,
    nom: nomAffiche(m.prenom, m.nom),
    photoUrl: m.photo_url,
  }));
}
