import { getSupabaseServer } from '@/lib/supabase';

/**
 * Couche d'accès au profil unifié (identité durable, chantier 13.3-E).
 *
 * Le profil unifié porte le numéro public « M » + 7 lettres, stable à vie et
 * indépendant de l'email. Voir la migration 038 (`profil_unifie`).
 */

/** Format du numéro public : « M » suivi de 7 lettres majuscules A-Z. */
export const NUMERO_UNIFIE_REGEX = /^M[A-Z]{7}$/;

/** True si la chaîne respecte le format du numéro unifié (« M » + 7 lettres). */
export function estNumeroUnifieValide(valeur: string): boolean {
  return NUMERO_UNIFIE_REGEX.test(valeur);
}

/**
 * Numéro unifié de la personne connectée, ou `null` si indisponible (profil pas
 * encore rattaché, ou migration 038 pas encore appliquée sur la base).
 *
 * Dégradation propre : l'UI affiche « en cours d'activation » plutôt que de
 * planter (même logique que les compteurs commune, cf. chantier 13.3-C).
 */
export async function getNumeroUnifie(personneId: string): Promise<string | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('profil_unifie')
    .select('numero_unique')
    .eq('personne_id', personneId)
    .maybeSingle();
  if (error !== null || data === null) {
    return null;
  }
  return data.numero_unique;
}
