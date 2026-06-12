import type { TrancheAge } from '@/types/database';

/**
 * Pondération des résultats de sondage par la méthode des quotas
 * (redressement sur la tranche d'âge), cf. doctrine §4D et revue
 * 2026-06-12 (Lilou/Ben) : « il s'affiche en brut d'office tant qu'il n'y a
 * pas assez de données et en pondéré d'office dès qu'il y en a plus ;
 * un toggle permet au visiteur de choisir sa vue ».
 *
 * Principe du redressement : chaque tranche d'âge déclarée reçoit un poids
 * (part cible dans la population / part observée parmi les répondant·es).
 * Les votes sans tranche déclarée (et les moins de 18 ans, hors cible des
 * quotas adultes) gardent un poids de 1 : on ne les écarte pas, on ne les
 * redresse pas.
 *
 * MÉTHODOLOGIE À VALIDER PAR LILOU/BEN (signalée au manifest) : un seul
 * critère de quota (l'âge) en v1 ; le code postal et le genre déclaré,
 * déjà collectés, pourront enrichir le redressement dans un chantier dédié.
 */

/** Seuil de répondant·es à partir duquel la vue pondérée devient la vue par défaut. */
export const SEUIL_PONDERATION = 300;

/**
 * Parts cibles des tranches d'âge dans la population adulte de France
 * (estimations INSEE 2024, population 18 ans et plus, arrondies).
 * Constantes techniques de redressement : la somme fait 1.
 */
export const QUOTAS_TRANCHE_AGE: Record<Exclude<TrancheAge, 'moins_18'>, number> = {
  '18_24': 0.105,
  '25_34': 0.147,
  '35_49': 0.235,
  '50_64': 0.243,
  '65_plus': 0.27,
};

/** Ligne d'agrégat de la vue `sondage_resultats_par_tranche`. */
export interface VotesParTranche {
  option_index: number;
  tranche_age: string | null;
  nombre_votes: number;
}

export interface ResultatsPonderes {
  /** Compteurs pondérés par option (fractionnaires, à formater à l'affichage). */
  compteurs: number[];
  /** Somme des compteurs pondérés (= base des pourcentages). */
  total: number;
  /** Poids appliqué à chaque tranche (1 pour non déclaré / moins de 18 ans). */
  poidsParTranche: Record<string, number>;
}

function estTrancheQuota(tranche: string | null): tranche is keyof typeof QUOTAS_TRANCHE_AGE {
  return tranche !== null && tranche in QUOTAS_TRANCHE_AGE;
}

/**
 * Redresse les compteurs de votes par la méthode des quotas sur l'âge.
 * Fonction pure : prend l'agrégat (option, tranche, votes) et le nombre
 * d'options, retourne les compteurs pondérés.
 */
export function pondererResultats(
  votesParTranche: VotesParTranche[],
  nbOptions: number,
): ResultatsPonderes {
  // 1. Part observée de chaque tranche quota parmi les votes redressables.
  const votesParTrancheQuota = new Map<keyof typeof QUOTAS_TRANCHE_AGE, number>();
  let totalRedressable = 0;
  for (const ligne of votesParTranche) {
    if (!estTrancheQuota(ligne.tranche_age)) continue;
    votesParTrancheQuota.set(
      ligne.tranche_age,
      (votesParTrancheQuota.get(ligne.tranche_age) ?? 0) + ligne.nombre_votes,
    );
    totalRedressable += ligne.nombre_votes;
  }

  // 2. Poids de chaque tranche : part cible / part observée. Une tranche
  //    absente des réponses n'a pas de poids (aucun vote à redresser) ;
  //    les votes non redressables gardent un poids de 1.
  const poidsParTranche: Record<string, number> = {};
  for (const [tranche, votes] of votesParTrancheQuota) {
    const partObservee = totalRedressable === 0 ? 0 : votes / totalRedressable;
    poidsParTranche[tranche] = partObservee === 0 ? 1 : QUOTAS_TRANCHE_AGE[tranche] / partObservee;
  }

  // 3. Compteurs pondérés par option.
  const compteurs = new Array(nbOptions).fill(0) as number[];
  let total = 0;
  for (const ligne of votesParTranche) {
    if (ligne.option_index < 0 || ligne.option_index >= nbOptions) continue;
    const poids = estTrancheQuota(ligne.tranche_age)
      ? (poidsParTranche[ligne.tranche_age] ?? 1)
      : 1;
    const contribution = ligne.nombre_votes * poids;
    compteurs[ligne.option_index] = (compteurs[ligne.option_index] ?? 0) + contribution;
    total += contribution;
  }

  return { compteurs, total, poidsParTranche };
}
