import { SEUIL_PONDERATION, pondererResultats } from '@/lib/sondages/ponderation';
import { getSupabaseServer } from '@/lib/supabase';
import type { Sondage, SondageResultats } from '@/types/database';

/**
 * Couche de requêtes des Sondages (chantier 7.4, étendu revue 2026-06-12).
 *
 * `listerSondages` renvoie les sondages ouverts.
 * `sondageParSlugAvecResultats` renvoie le sondage + l'agrégat des votes,
 * bruts ET pondérés (méthode des quotas sur l'âge, cf. spec §4D).
 *
 * Affichage (décision Lilou/Ben 2026-06-12) : brut d'office sous
 * 300 répondant·es, pondéré d'office au-delà, bascule offerte au visiteur.
 * Le mode stocké en base est conservé (historique) mais n'influence plus
 * l'affichage.
 */

export interface SondageAvecResultats extends Sondage {
  total_votes: number;
  resultats_par_option: number[];
  /**
   * Compteurs redressés par quotas (fractionnaires), ou null si la vue
   * d'agrégat par tranche n'est pas disponible.
   */
  resultats_ponderes: number[] | null;
  /** Somme des compteurs pondérés (base des pourcentages pondérés). */
  total_pondere: number;
  /** Vrai dès que le seuil de répondant·es (300) est atteint. */
  pondere_disponible: boolean;
  /** Prénom du créateur·ice (crédit auteur cliquable vers le réseau). */
  createurice_prenom: string | null;
  /** Nom du créateur·ice. */
  createurice_nom: string | null;
}

export async function listerSondagesOuverts(limite = 50): Promise<Sondage[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('sondage')
    .select('*')
    .in('statut', ['ouvert', 'ferme'])
    .order('created_at', { ascending: false })
    .limit(limite);
  return (data ?? []) as Sondage[];
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

  const sondageNarrowed = sondage as Sondage;

  // Crédit auteur·ice : prénom/nom du créateur·ice (pour le lien réseau).
  let createuricePrenom: string | null = null;
  let createuriceNom: string | null = null;
  if (sondageNarrowed.createurice_id !== null) {
    const { data: createurice } = await supabase
      .from('personne')
      .select('prenom, nom')
      .eq('id', sondageNarrowed.createurice_id)
      .maybeSingle();
    createuricePrenom = createurice?.prenom ?? null;
    createuriceNom = createurice?.nom ?? null;
  }
  const compteurs = new Array(sondageNarrowed.options.length).fill(0) as number[];
  let total = 0;
  for (const r of (resultats ?? []) as SondageResultats[]) {
    const idx = r.option_index;
    const votes = r.nombre_votes;
    if (idx === null || votes === null) continue;
    if (idx >= 0 && idx < compteurs.length) {
      compteurs[idx] = votes;
      total += votes;
    }
  }

  // Résultats pondérés (quotas sur l'âge) depuis l'agrégat par tranche.
  // Dégradation propre : si la vue n'existe pas encore sur le distant
  // (migration pas appliquée), on retombe sur null (vue brute seule).
  let resultatsPonderes: number[] | null = null;
  let totalPondere = 0;
  const { data: parTranche, error: erreurTranche } = await supabase
    .from('sondage_resultats_par_tranche')
    .select('option_index, tranche_age, nombre_votes')
    .eq('sondage_id', sondageNarrowed.id);
  if (erreurTranche === null && parTranche !== null) {
    const lignes = parTranche
      .filter((l) => l.option_index !== null && l.nombre_votes !== null)
      .map((l) => ({
        option_index: l.option_index as number,
        tranche_age: l.tranche_age,
        nombre_votes: l.nombre_votes as number,
      }));
    const pondere = pondererResultats(lignes, sondageNarrowed.options.length);
    resultatsPonderes = pondere.compteurs;
    totalPondere = pondere.total;
  }

  return {
    ...sondageNarrowed,
    total_votes: total,
    resultats_par_option: compteurs,
    resultats_ponderes: resultatsPonderes,
    total_pondere: totalPondere,
    pondere_disponible: total >= SEUIL_PONDERATION && resultatsPonderes !== null,
    createurice_prenom: createuricePrenom,
    createurice_nom: createuriceNom,
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
