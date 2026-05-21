/**
 * Logique métier du « compteur stretch » des pétitions.
 *
 * Spec : `docs/specs/01_ARCHITECTURE.md §5A` :
 *   « Compteur stretch ×1,5 au franchissement de 90 % de l'objectif (pour
 *     relancer la dynamique). »
 *
 * Mécanique :
 *   - tant que `signatures < 90 % * objectif` : la cible affichée est l'objectif.
 *   - dès que `signatures >= 90 % * objectif` : la cible passe à `objectif × 1,5`
 *     (arrondi à l'entier supérieur), et la jauge repart sur ce nouveau total.
 *
 * Pourquoi côté app (et pas en BDD) : la règle peut évoluer (×2 ? seuil 80 % ?),
 * et garder l'objectif initial intact dans la table `petition` permet de
 * voir l'historique des objectifs réels visés par les créateurices.
 */

/** Seuil à partir duquel on étire (« stretch ») l'objectif. */
export const SEUIL_STRETCH = 0.9;

/** Facteur multiplicateur appliqué au franchissement du seuil. */
export const FACTEUR_STRETCH = 1.5;

export interface EtatStretch {
  /** Cible courante (objectif initial ou objectif × 1,5 si déjà étiré). */
  objectifEffectif: number;
  /** Pourcentage rempli vis-à-vis de la cible courante (0 à 100, plafonné). */
  pourcentage: number;
  /** True si on a déjà franchi le seuil de 90 % et étiré la cible. */
  estEtire: boolean;
  /** True quand la cible courante est atteinte (peut redéclencher un stretch). */
  estAtteint: boolean;
}

/**
 * Calcule l'état affiché du compteur d'une pétition.
 *
 * @param signatures Nombre de signatures actuelles (>= 0).
 * @param objectifInitial Objectif tel que défini par la créatrice (>= 1).
 */
export function calculerEtatStretch(signatures: number, objectifInitial: number): EtatStretch {
  // Garde-fou : on n'autorise pas un objectif <= 0 (le schéma SQL non plus,
  // mais on défend en profondeur).
  const objectifBase = Math.max(1, objectifInitial);
  const signaturesPositives = Math.max(0, signatures);

  const seuilDeclenchement = objectifBase * SEUIL_STRETCH;
  const estEtire = signaturesPositives >= seuilDeclenchement;

  const objectifEffectif = estEtire ? Math.ceil(objectifBase * FACTEUR_STRETCH) : objectifBase;

  const pourcentage = Math.min(100, Math.round((signaturesPositives / objectifEffectif) * 100));
  const estAtteint = signaturesPositives >= objectifEffectif;

  return { objectifEffectif, pourcentage, estEtire, estAtteint };
}
