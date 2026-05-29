import { getSupabaseServer } from '@/lib/supabase';

/**
 * Résout le numéro public M+7 d'une personne (le « handle » de son profil
 * réseau), pour construire un lien `/s-informer/reseau/[numero]`.
 *
 * Passe par la RPC `personne_affichage` (SECURITY DEFINER) qui renvoie le
 * `numero_unique` de façon INCONDITIONNELLE (le numéro est le handle public ;
 * seuls nom/photo/bio sont masqués selon la visibilité). Donc le lien est
 * public, même si l'affichage du profil reste piloté par les préférences.
 *
 * Retourne `null` si la personne n'a pas (encore) de profil unifié → l'appelant
 * affiche alors le nom en clair sans lien.
 */
export async function numeroReseauDe(
  personneId: string | null | undefined,
): Promise<string | null> {
  if (personneId === null || personneId === undefined || personneId === '') return null;
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.rpc('personne_affichage', { cible: personneId });
  if (error !== null || data === null || data.length === 0) return null;
  return data[0]?.numero_unique ?? null;
}
