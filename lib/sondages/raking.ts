import { CLES_REDRESSEMENT, margesNormalisees } from '@/lib/sondages/marges-reference';

/**
 * Redressement par calage sur marges (raking / IPF — iterative proportional
 * fitting). Remplace le redressement à un seul critère (l'âge) par un calage
 * sur PLUSIEURS variables à la fois.
 *
 * Principe (cf. l'explication des matrices, session 2026-06-14) : on cherche un
 * poids par répondant·e tel que, une fois pondéré, l'échantillon respecte la
 * marge de population de CHAQUE variable. On ne peut pas multiplier les poids
 * marginaux (les variables sont corrélées) : on cale sur la 1ʳᵉ variable, puis
 * la 2ᵉ… puis on RECOMMENCE, jusqu'à ce que les poids se stabilisent.
 *
 * Fonctions pures (l'algorithme est indépendant des données réelles : les
 * marges sont injectées → testable avec des marges synthétiques).
 */

export interface RepondantQuota {
  /** Index de l'option votée. */
  optionIndex: number;
  /** Réponse déclarée par variable de quota (cle → libellé d'option). */
  reponses: Record<string, string>;
}

export interface ResultatRaking {
  /** Poids par répondant·e (normalisés pour que la somme = nombre de répondant·es). */
  poids: number[];
  /** Nombre d'itérations effectuées. */
  iterations: number;
  /** True si la convergence a été atteinte avant la limite. */
  convergence: boolean;
}

export interface OptionsRaking {
  maxIterations?: number;
  /** Convergence : écart max d'un facteur d'ajustement à 1, en dessous duquel on s'arrête. */
  tolerance?: number;
  /** Bornage des poids extrêmes (anti-poids fous) : [min, max]. Désactivé si absent. */
  bornes?: [number, number];
}

/**
 * Calcule les poids de redressement par raking.
 *
 * @param repondants un élément par répondant·e (option votée + réponses de profil)
 * @param margesParVariable cle → (libellé d'option → part cible, somme 1)
 */
export function calculerPoidsRaking(
  repondants: RepondantQuota[],
  margesParVariable: Map<string, Map<string, number>>,
  opts: OptionsRaking = {},
): ResultatRaking {
  const n = repondants.length;
  const maxIterations = opts.maxIterations ?? 50;
  const tolerance = opts.tolerance ?? 1e-4;
  const poids = new Array<number>(n).fill(1);
  if (n === 0) return { poids, iterations: 0, convergence: true };

  const variables = [...margesParVariable.keys()];
  let iterations = 0;
  let convergence = false;

  for (let iter = 0; iter < maxIterations; iter += 1) {
    iterations = iter + 1;
    let ecartMax = 0;

    for (const cle of variables) {
      const cibles = margesParVariable.get(cle);
      if (cibles === undefined) continue;

      // Poids observé par modalité (parmi les répondant·es ayant une modalité mesurée).
      const poidsObserve = new Map<string, number>();
      let totalValide = 0;
      for (let i = 0; i < n; i += 1) {
        const rep = repondants[i]?.reponses[cle];
        if (rep === undefined || !cibles.has(rep)) continue;
        poidsObserve.set(rep, (poidsObserve.get(rep) ?? 0) + (poids[i] ?? 0));
        totalValide += poids[i] ?? 0;
      }
      if (totalValide <= 0) continue;

      // Facteur d'ajustement par modalité = part cible / part observée.
      const facteur = new Map<string, number>();
      for (const [modalite, cible] of cibles) {
        const observe = (poidsObserve.get(modalite) ?? 0) / totalValide;
        if (observe <= 0) continue;
        const f = cible / observe;
        facteur.set(modalite, f);
        ecartMax = Math.max(ecartMax, Math.abs(f - 1));
      }

      // Application aux répondant·es de chaque modalité.
      for (let i = 0; i < n; i += 1) {
        const rep = repondants[i]?.reponses[cle];
        if (rep === undefined) continue;
        const f = facteur.get(rep);
        if (f !== undefined) poids[i] = (poids[i] ?? 0) * f;
      }
    }

    // Bornage optionnel des poids extrêmes (limite l'effet de plan).
    if (opts.bornes !== undefined) {
      const [bmin, bmax] = opts.bornes;
      for (let i = 0; i < n; i += 1) {
        poids[i] = Math.min(bmax, Math.max(bmin, poids[i] ?? 1));
      }
    }

    if (ecartMax < tolerance) {
      convergence = true;
      break;
    }
  }

  // Normalisation : somme des poids = n (poids moyen = 1, lecture intuitive).
  const sommePoids = poids.reduce((s, w) => s + w, 0);
  if (sommePoids > 0) {
    const k = n / sommePoids;
    for (let i = 0; i < n; i += 1) poids[i] = (poids[i] ?? 0) * k;
  }

  return { poids, iterations, convergence };
}

/** Construit la table des marges (cle → modalité → cible) pour les variables de quota. */
export function margesRedressement(
  clesActives: string[] = CLES_REDRESSEMENT,
): Map<string, Map<string, number>> {
  const table = new Map<string, Map<string, number>>();
  for (const cle of clesActives) {
    const m = margesNormalisees(cle);
    if (m !== null && m.size > 0) table.set(cle, m);
  }
  return table;
}

export interface ResultatPondere {
  /** Compteurs pondérés par option (fractionnaires). */
  totaux: number[];
  /** Somme des compteurs pondérés. */
  total: number;
  /** Taille d'échantillon effective = (Σp)² / Σp². */
  nEffectif: number;
  /** Effet de plan de Kish = n·Σp² / (Σp)² (≥ 1 ; le redressement gonfle la variance). */
  effetDePlan: number;
}

/** Agrège les votes pondérés par option et calcule la taille effective + l'effet de plan. */
export function agregerPondere(
  repondants: RepondantQuota[],
  poids: number[],
  nbOptions: number,
): ResultatPondere {
  const totaux = new Array<number>(nbOptions).fill(0);
  let total = 0;
  let sommeP = 0;
  let sommeP2 = 0;
  for (let i = 0; i < repondants.length; i += 1) {
    const w = poids[i] ?? 0;
    sommeP += w;
    sommeP2 += w * w;
    const idx = repondants[i]?.optionIndex ?? -1;
    if (idx >= 0 && idx < nbOptions) {
      totaux[idx] = (totaux[idx] ?? 0) + w;
      total += w;
    }
  }
  const nEffectif = sommeP2 > 0 ? (sommeP * sommeP) / sommeP2 : 0;
  const n = repondants.length;
  const effetDePlan = sommeP > 0 && nEffectif > 0 ? n / nEffectif : 1;
  return { totaux, total, nEffectif, effetDePlan };
}
