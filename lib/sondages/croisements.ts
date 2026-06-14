import { estFiable } from '@/lib/sondages/fiabilite';
import type { RepondantQuota } from '@/lib/sondages/raking';

/**
 * Tris croisés (vote × variable de profil), réservés à l'admin (décision Ben
 * 2026-06-14). Pour chaque modalité de la variable, on regarde comment ce
 * groupe a voté (répartition en colonne, pondérée).
 *
 * Anonymat + fiabilité : une modalité comptant moins de `seuil` répondant·es
 * BRUTS est marquée `fiable=false` (à griser / masquer côté affichage).
 */

export interface ColonneCroisement {
  /** Libellé de la modalité (ex. « Ouvrier·ère »). */
  modalite: string;
  /** Nombre de répondant·es bruts dans cette modalité. */
  nBrut: number;
  /** Répartition pondérée des votes de ce groupe, par option (somme = 1 si non vide). */
  pourcentages: number[];
  /** Publiable (assez de répondant·es) ? */
  fiable: boolean;
}

export interface Croisement {
  cle: string;
  colonnes: ColonneCroisement[];
}

/**
 * Croise le vote avec une variable de profil.
 *
 * @param modalites libellés des modalités à afficher en colonnes (ordre stable)
 * @param seuil seuil d'anonymat/fiabilité (défaut : SEUIL_CELLULE)
 */
export function croiserParVariable(
  repondants: RepondantQuota[],
  poids: number[],
  nbOptions: number,
  cle: string,
  modalites: string[],
  seuil?: number,
): Croisement {
  const colonnes: ColonneCroisement[] = modalites.map((modalite) => {
    const pondParOption = new Array<number>(nbOptions).fill(0);
    let totalPond = 0;
    let nBrut = 0;
    for (let i = 0; i < repondants.length; i += 1) {
      if (repondants[i]?.reponses[cle] !== modalite) continue;
      nBrut += 1;
      const w = poids[i] ?? 0;
      const idx = repondants[i]?.optionIndex ?? -1;
      if (idx >= 0 && idx < nbOptions) {
        pondParOption[idx] = (pondParOption[idx] ?? 0) + w;
        totalPond += w;
      }
    }
    const pourcentages = pondParOption.map((w) => (totalPond > 0 ? w / totalPond : 0));
    return { modalite, nBrut, pourcentages, fiable: estFiable(nBrut, seuil) };
  });
  return { cle, colonnes };
}
