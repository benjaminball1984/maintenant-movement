import { getSupabaseServer } from '@/lib/supabase';
import type { Sondage, SondageResultats } from '@/types/database';

/**
 * Couche de requêtes des Sondages (chantier 7.4).
 *
 * `listerSondages` renvoie les sondages ouverts.
 * `sondageParSlugAvecResultats` renvoie le sondage + l'agrégat des votes.
 *
 * Mode pondéré (cf. spec §4D « méthode des quotas dès 300 répondant·es ») :
 * en v1 on retourne les résultats bruts, le calcul pondéré sera fait
 * dans un job dédié (chantier polish quand on aura les premières
 * réponses à pondérer).
 */

export interface SondageAvecResultats extends Sondage {
  total_votes: number;
  resultats_par_option: number[];
  /** Pour le mode pondéré, seuil 300 répondant·es de la spec. */
  pondere_disponible: boolean;
}

export async function listerSondagesOuverts(limite = 50): Promise<Sondage[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('sondage')
    .select('*')
    .in('statut', ['ouvert', 'ferme'])
    .order('created_at', { ascending: false })
    .limit(limite);
  return data ?? [];
}

export async function sondageParSlugAvecResultats(
  slug: string,
): Promise<SondageAvecResultats | null> {
  const supabase = await getSupabaseServer();
  const { data: sondage } = await supabase
    .from('sondage')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (sondage === null) return null;

  const { data: resultats } = await supabase
    .from('sondage_resultats')
    .select('*')
    .eq('sondage_id', sondage.id);

  const compteurs = new Array(sondage.options.length).fill(0) as number[];
  let total = 0;
  for (const r of (resultats ?? []) as SondageResultats[]) {
    if (r.option_index >= 0 && r.option_index < compteurs.length) {
      compteurs[r.option_index] = r.nombre_votes;
      total += r.nombre_votes;
    }
  }

  return {
    ...sondage,
    total_votes: total,
    resultats_par_option: compteurs,
    pondere_disponible: sondage.mode === 'pondere' && total >= 300,
  };
}

/**
 * Indique si une personne a déjà voté à un sondage donné.
 * Utilisé par la page pour cacher le formulaire.
 */
export async function aVotePersonne(sondageId: string, personneId: string): Promise<boolean> {
  const supabase = await getSupabaseServer();
  const { count } = await supabase
    .from('reponse_sondage')
    .select('id', { count: 'exact', head: true })
    .eq('sondage_id', sondageId)
    .eq('personne_id', personneId);
  return (count ?? 0) > 0;
}
