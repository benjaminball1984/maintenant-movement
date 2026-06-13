/**
 * Mise en page de la mosaïque de couverture d'un sondage (V2.6.111).
 *
 * Module PUR (aucun accès au DOM, au canvas ou au réseau) : il décrit
 * uniquement la géométrie de la mosaïque (taille du bandeau de titre, grille
 * des tuiles, découpage du texte en lignes). Il est donc entièrement testable
 * en Vitest et partagé entre le générateur navigateur (`mosaique-canvas.ts`,
 * qui dessine vraiment) et, le cas échéant, un script Node de rattrapage.
 *
 * Séparation des responsabilités (CLAUDE.md §2) : la géométrie vit ici, le
 * dessin (canvas, chargement d'images) vit dans le module navigateur.
 *
 * Format cible : 1200 x 630, le standard Open Graph (aperçu de partage des
 * réseaux sociaux), le même que la mosaïque du sondage présidentielle.
 */

/** Largeur de la mosaïque en pixels (format Open Graph). */
export const MOSAIQUE_LARGEUR = 1200;
/** Hauteur de la mosaïque en pixels (format Open Graph). */
export const MOSAIQUE_HAUTEUR = 630;

/** Marge intérieure haute du bandeau de titre (px). */
export const BANDEAU_PAD_HAUT = 30;
/** Marge intérieure basse du bandeau de titre (px). */
export const BANDEAU_PAD_BAS = 24;
/** Espace entre la dernière ligne de titre et le sous-titre (px). */
export const BANDEAU_GAP_SOUSTITRE = 12;
/** Hauteur réservée au sous-titre « Sondage · … » (px). */
export const BANDEAU_H_SOUSTITRE = 26;
/** Épaisseur du filet d'accent en bas du bandeau (px). */
export const BANDEAU_FILET = 6;
/** Bandeau plafonné pour toujours laisser de la place aux tuiles (px). */
export const BANDEAU_HAUTEUR_MAX = 320;

export interface GrilleMosaique {
  colonnes: number;
  lignes: number;
}

/**
 * Choisit la grille (colonnes x lignes) selon le nombre d'options, en
 * privilégiant peu de lignes (comme la mosaïque présidentielle, 9x2) :
 * 1 ligne jusqu'à 3 options, 2 lignes jusqu'à 18, 3 lignes au-delà.
 *
 * `nbOptions` est borné à l'intervalle réel d'un sondage (1 à 20).
 */
export function grilleMosaique(nbOptions: number): GrilleMosaique {
  const n = Math.max(1, Math.min(20, Math.round(nbOptions)));
  const lignes = n <= 3 ? 1 : n <= 18 ? 2 : 3;
  const colonnes = Math.ceil(n / lignes);
  return { colonnes, lignes };
}

export interface Cellule {
  /** Index de l'option (0-based). */
  index: number;
  /** Coin haut-gauche X (px). */
  x: number;
  /** Coin haut-gauche Y (px). */
  y: number;
  largeur: number;
  hauteur: number;
}

export interface OptionsCellules {
  /** Espace (px) laissé entre les tuiles. 0 = tuiles jointives. */
  gouttiere?: number;
}

/**
 * Calcule la position de chaque tuile sous le bandeau de titre. La dernière
 * ligne, si elle est incomplète, est centrée horizontalement pour éviter un
 * trou disgracieux à droite.
 *
 * @param nbOptions - Nombre d'options du sondage (borné 1..20).
 * @param bandeauHauteur - Hauteur du bandeau de titre (voir `hauteurBandeau`).
 * @param opts - Gouttière optionnelle entre les tuiles.
 */
export function cellulesMosaique(
  nbOptions: number,
  bandeauHauteur: number,
  opts: OptionsCellules = {},
): Cellule[] {
  const n = Math.max(1, Math.min(20, Math.round(nbOptions)));
  const { colonnes, lignes } = grilleMosaique(n);
  const gouttiere = opts.gouttiere ?? 0;

  const zoneHauteur = MOSAIQUE_HAUTEUR - bandeauHauteur;
  const largeurCol = MOSAIQUE_LARGEUR / colonnes;
  const hauteurLigne = zoneHauteur / lignes;

  const cellules: Cellule[] = [];
  for (let i = 0; i < n; i += 1) {
    const ligne = Math.floor(i / colonnes);
    const colonneDansLigne = i % colonnes;

    // Centrage horizontal de la dernière ligne si elle est incomplète.
    const debutLigne = ligne * colonnes;
    const elementsCetteLigne = Math.min(colonnes, n - debutLigne);
    const decalageCentrage = ((colonnes - elementsCetteLigne) * largeurCol) / 2;

    cellules.push({
      index: i,
      x: decalageCentrage + colonneDansLigne * largeurCol + gouttiere / 2,
      y: bandeauHauteur + ligne * hauteurLigne + gouttiere / 2,
      largeur: largeurCol - gouttiere,
      hauteur: hauteurLigne - gouttiere,
    });
  }
  return cellules;
}

/** Hauteur d'une ligne de titre (interligne) selon le nombre de lignes. */
export function interligneTitre(nbLignes: number): number {
  if (nbLignes >= 4) return 40;
  if (nbLignes === 3) return 46;
  return 54;
}

/** Taille de police du titre (px) selon le nombre de lignes. */
export function tailleTitre(nbLignes: number): number {
  if (nbLignes >= 4) return 30;
  if (nbLignes === 3) return 36;
  return 44;
}

/**
 * Hauteur totale du bandeau de titre selon le nombre de lignes du titre
 * (1 à 4). Cohérente avec les positions de dessin de `mosaique-canvas.ts`,
 * qui réutilise les mêmes constantes. Plafonnée pour garder de la place aux
 * tuiles.
 */
export function hauteurBandeau(nbLignes: number): number {
  const lignes = Math.max(1, Math.min(4, Math.round(nbLignes)));
  const hauteur =
    BANDEAU_PAD_HAUT +
    lignes * interligneTitre(lignes) +
    BANDEAU_GAP_SOUSTITRE +
    BANDEAU_H_SOUSTITRE +
    BANDEAU_PAD_BAS;
  return Math.round(Math.min(hauteur, BANDEAU_HAUTEUR_MAX));
}

/**
 * Découpe un texte en lignes qui tiennent dans `largeurMax`, à l'aide d'une
 * fonction de mesure injectée (`ctx.measureText(...).width` côté canvas, une
 * fonction simulée en test). Au-delà de `maxLignes`, la dernière ligne est
 * tronquée avec une ellipse « … ».
 *
 * Pur et testable : la mesure est un paramètre, pas une dépendance au DOM.
 *
 * @param texte - Le texte à découper (titre, libellé d'option).
 * @param largeurMax - Largeur disponible (mêmes unités que `mesurer`).
 * @param mesurer - Renvoie la largeur d'une chaîne donnée.
 * @param maxLignes - Nombre maximal de lignes (défaut 3).
 */
export function decouperLignes(
  texte: string,
  largeurMax: number,
  mesurer: (s: string) => number,
  maxLignes = 3,
): string[] {
  const mots = texte
    .trim()
    .split(/\s+/)
    .filter((m) => m !== '');
  if (mots.length === 0) return [''];

  const lignes: string[] = [];
  let courante = '';
  for (const mot of mots) {
    const essai = courante === '' ? mot : `${courante} ${mot}`;
    if (courante !== '' && mesurer(essai) > largeurMax) {
      lignes.push(courante);
      courante = mot;
    } else {
      courante = essai;
    }
  }
  if (courante !== '') lignes.push(courante);

  if (lignes.length <= maxLignes) return lignes;

  // Surplus de lignes : on garde `maxLignes`, la dernière absorbe le reste
  // puis est tronquée avec « … » jusqu'à tenir dans la largeur.
  const gardees = lignes.slice(0, maxLignes);
  let derniere = lignes.slice(maxLignes - 1).join(' ');
  while (derniere !== '' && mesurer(`${derniere}…`) > largeurMax) {
    const sansDernierMot = derniere.replace(/\s*\S+$/, '');
    derniere =
      sansDernierMot === derniere || sansDernierMot === '' ? derniere.slice(0, -1) : sansDernierMot;
  }
  gardees[maxLignes - 1] = derniere === '' ? '…' : `${derniere}…`;
  return gardees;
}
