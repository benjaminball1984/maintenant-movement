/**
 * Générateur de mosaïque de couverture d'un sondage, CÔTÉ NAVIGATEUR
 * (V2.6.111, demande Ben 2026-06-13).
 *
 * « Faire en sorte que les sondages produisent systématiquement une mosaïque,
 * du même type que celle du sondage présidentielle : images des options +
 * titre incrusté au-dessus, servant de couverture, de miniature et d'aperçu
 * de partage. »
 *
 * Pourquoi côté navigateur ? Le site tourne en production sur Cloudflare
 * Workers (via OpenNext), où `sharp` (l'outil du script présidentiel) ne
 * fonctionne pas (binaire natif). Le navigateur, lui, sait composer une image
 * avec `<canvas>` sans aucune dépendance : c'est exactement le procédé déjà
 * utilisé par `lib/image-redimensionner.ts` avant chaque téléversement. La
 * mosaïque produite est ensuite envoyée par le même canal d'upload que les
 * autres images (Server Action `televerserImage`), et son URL alimente le
 * champ `image_url` du sondage, déjà lu par la fiche, la liste ET les
 * métadonnées Open Graph de partage.
 *
 * Comportement (réponses Ben) :
 * - génération AUTOMATIQUE (jamais un bouton à cliquer) ;
 * - chaque tuile montre la photo de l'option quand elle existe, sinon une
 *   tuile colorée portant le numéro et le libellé de l'option ;
 * - si le créateur téléverse sa propre image de couverture, elle remplace la
 *   mosaïque (géré côté formulaire, pas ici).
 *
 * Robustesse : ne lève jamais. En cas d'échec (canvas indisponible, image
 * d'option illisible ou bloquée par CORS), on dégrade proprement (tuile texte,
 * voire mosaïque sans photos), et en dernier recours on renvoie `null` :
 * l'appelant retombe alors sur l'image par défaut du sondage.
 */

import {
  BANDEAU_FILET,
  BANDEAU_GAP_SOUSTITRE,
  BANDEAU_PAD_HAUT,
  type Cellule,
  MOSAIQUE_HAUTEUR,
  MOSAIQUE_LARGEUR,
  cellulesMosaique,
  decouperLignes,
  hauteurBandeau,
  interligneTitre,
  tailleTitre,
} from './mosaique-layout';

/**
 * Palette de la mosaïque. Reprend les teintes validées par Ben sur la
 * mosaïque du sondage présidentielle (fond sombre, accent rose du mouvement,
 * sous-titre jaune), miroir des design tokens du site.
 */
const PALETTE = {
  fond: '#14101c',
  accent: '#e85d75',
  sousTitre: '#ffd166',
  titre: '#ffffff',
  tuileA: '#221b33',
  tuileB: '#2a2340',
  tuileTexte: '#ffffff',
  tuileNumero: '#ffd166',
} as const;

const POLICE = 'Arial, Helvetica, sans-serif';
const SOUS_TITRE = 'Sondage · maintenant-le-mouvement.org';
const GOUTTIERE = 8;
const MARGE_TITRE = 100;
const QUALITE_JPEG = 0.86;

export interface ParamsMosaique {
  /** Titre du sondage, incrusté dans le bandeau. */
  titre: string;
  /** Libellés des options (sert au texte des tuiles sans photo). */
  options: string[];
  /**
   * Images des options, tableau parallèle à `options` (`null` = pas de photo).
   * URLs Supabase Storage en prod, `data:` URL en mode mock (dev/tests).
   */
  optionsImages?: (string | null)[];
}

/**
 * Compose la mosaïque et renvoie un `Blob` JPEG 1200x630, ou `null` si la
 * génération est impossible (l'appelant retombe alors sur l'image par défaut).
 */
export async function genererMosaiqueSondage(params: ParamsMosaique): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;

  const titre = params.titre.trim();
  const options = params.options;
  const optionsImages = params.optionsImages ?? [];

  const canvas = document.createElement('canvas');
  canvas.width = MOSAIQUE_LARGEUR;
  canvas.height = MOSAIQUE_HAUTEUR;
  const ctx = canvas.getContext('2d');
  if (ctx === null) return null;

  // Attendre les polices web (best-effort) pour un titre net.
  try {
    if ('fonts' in document) await document.fonts.ready;
  } catch {
    // Sans FontFaceSet on dessine avec la police système, c'est acceptable.
  }

  // 1. Découpage du titre : on réduit la police jusqu'à tenir en <= 3 lignes,
  //    avec un plancher à 30 px (au pire 4 lignes, la dernière ellipsée).
  const largeurTitre = MOSAIQUE_LARGEUR - MARGE_TITRE;
  let lignesTitre: string[] = [titre];
  for (const taille of [44, 36, 30]) {
    ctx.font = `bold ${taille}px ${POLICE}`;
    const lignes = decouperLignes(titre, largeurTitre, (s) => ctx.measureText(s).width, 4);
    lignesTitre = lignes;
    if (lignes.length <= 3) break;
  }
  const nbLignes = lignesTitre.length;
  const bandeau = hauteurBandeau(nbLignes);

  // 2. Préchargement des photos d'options (en parallèle, best-effort).
  const images = await Promise.all(
    options.map((_, i) => {
      const url = optionsImages[i] ?? null;
      return url !== null && url !== '' ? chargerImage(url) : Promise.resolve(null);
    }),
  );

  // 3. Dessin complet, paramétré par `autoriserImages` : le second passage
  //    (sans images) sert de repli si une photo cross-origin a « taché » le
  //    canvas et empêche l'export.
  const dessinerTout = (autoriserImages: boolean): void => {
    ctx.fillStyle = PALETTE.fond;
    ctx.fillRect(0, 0, MOSAIQUE_LARGEUR, MOSAIQUE_HAUTEUR);

    const cellules = cellulesMosaique(options.length, bandeau, { gouttiere: GOUTTIERE });
    for (const cellule of cellules) {
      const image = autoriserImages ? (images[cellule.index] ?? null) : null;
      if (image !== null) {
        dessinerImageCouvrante(ctx, image, cellule);
      } else {
        dessinerTuileTexte(ctx, cellule, options[cellule.index] ?? '');
      }
    }

    dessinerBandeau(ctx, lignesTitre, bandeau, nbLignes);
  };

  dessinerTout(true);
  let blob = await canvasVersBlob(canvas);
  if (blob === null) {
    dessinerTout(false);
    blob = await canvasVersBlob(canvas);
  }
  return blob;
}

/** Dessine le bandeau de titre opaque (titre + filet d'accent + sous-titre). */
function dessinerBandeau(
  ctx: CanvasRenderingContext2D,
  lignesTitre: string[],
  bandeau: number,
  nbLignes: number,
): void {
  ctx.fillStyle = PALETTE.fond;
  ctx.fillRect(0, 0, MOSAIQUE_LARGEUR, bandeau);
  ctx.fillStyle = PALETTE.accent;
  ctx.fillRect(0, bandeau - BANDEAU_FILET, MOSAIQUE_LARGEUR, BANDEAU_FILET);

  const interligne = interligneTitre(nbLignes);
  const centreX = MOSAIQUE_LARGEUR / 2;

  ctx.fillStyle = PALETTE.titre;
  ctx.font = `bold ${tailleTitre(nbLignes)}px ${POLICE}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lignesTitre.forEach((ligne, idx) => {
    ctx.fillText(ligne, centreX, BANDEAU_PAD_HAUT + idx * interligne);
  });

  ctx.fillStyle = PALETTE.sousTitre;
  ctx.font = `${nbLignes >= 4 ? 20 : 24}px ${POLICE}`;
  ctx.fillText(
    SOUS_TITRE,
    centreX,
    BANDEAU_PAD_HAUT + nbLignes * interligne + BANDEAU_GAP_SOUSTITRE,
  );
}

/** Dessine une photo d'option en mode « couvrir » (cover), biais vers le haut. */
function dessinerImageCouvrante(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cellule: Cellule,
): void {
  const largeurImage = image.naturalWidth || image.width;
  const hauteurImage = image.naturalHeight || image.height;
  if (largeurImage === 0 || hauteurImage === 0) return;

  const echelle = Math.max(cellule.largeur / largeurImage, cellule.hauteur / hauteurImage);
  const largeurSource = cellule.largeur / echelle;
  const hauteurSource = cellule.hauteur / echelle;
  const sourceX = (largeurImage - largeurSource) / 2;
  // Biais vers le haut (visages en haut des portraits), comme le présidentiel.
  const sourceY = 0;

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    largeurSource,
    hauteurSource,
    cellule.x,
    cellule.y,
    cellule.largeur,
    cellule.hauteur,
  );
}

/** Dessine une tuile colorée portant le numéro et le libellé d'une option. */
function dessinerTuileTexte(
  ctx: CanvasRenderingContext2D,
  cellule: Cellule,
  libelle: string,
): void {
  ctx.fillStyle = cellule.index % 2 === 0 ? PALETTE.tuileA : PALETTE.tuileB;
  ctx.fillRect(cellule.x, cellule.y, cellule.largeur, cellule.hauteur);

  // Filet d'accent à gauche.
  ctx.fillStyle = PALETTE.accent;
  ctx.fillRect(cellule.x, cellule.y, 10, cellule.hauteur);

  const centreY = cellule.y + cellule.hauteur / 2;
  const padGauche = 26;

  // Numéro de l'option.
  const tailleNumero = Math.min(58, Math.max(26, cellule.hauteur * 0.3));
  ctx.fillStyle = PALETTE.tuileNumero;
  ctx.font = `bold ${tailleNumero}px ${POLICE}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const numero = `${cellule.index + 1}`;
  ctx.fillText(numero, cellule.x + padGauche, centreY);

  // Libellé, à droite du numéro, sur 1 à 3 lignes.
  const xTexte = cellule.x + padGauche + ctx.measureText(numero).width + 16;
  const largeurTexte = cellule.x + cellule.largeur - xTexte - 16;
  const tailleLibelle = Math.min(32, Math.max(17, cellule.hauteur * 0.16));
  ctx.fillStyle = PALETTE.tuileTexte;
  ctx.font = `${tailleLibelle}px ${POLICE}`;
  const interligne = tailleLibelle * 1.22;
  const maxLignes = Math.max(1, Math.min(3, Math.floor((cellule.hauteur - 16) / interligne)));
  const lignes = decouperLignes(
    libelle,
    Math.max(40, largeurTexte),
    (s) => ctx.measureText(s).width,
    maxLignes,
  );
  const yDebut = centreY - ((lignes.length - 1) * interligne) / 2;
  lignes.forEach((ligne, idx) => {
    ctx.fillText(ligne, xTexte, yDebut + idx * interligne);
  });
}

/**
 * Charge une image pour le canvas. `crossOrigin = 'anonymous'` permet de
 * dessiner les photos d'options hébergées sur Supabase Storage sans « tacher »
 * le canvas (le bucket public renvoie les en-têtes CORS). En cas d'échec
 * (réseau, CORS, format) ou de délai dépassé, on renvoie `null` : la tuile
 * basculera sur le rendu texte.
 */
function chargerImage(url: string, delaiMaxMs = 8000): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    let termine = false;
    const finir = (resultat: HTMLImageElement | null): void => {
      if (termine) return;
      termine = true;
      resolve(resultat);
    };
    image.crossOrigin = 'anonymous';
    image.onload = () => finir(image);
    image.onerror = () => finir(null);
    setTimeout(() => finir(null), delaiMaxMs);
    image.src = url;
  });
}

/**
 * Promisifie `canvas.toBlob` (API à callback). Renvoie `null` si l'encodage
 * est impossible, y compris quand le canvas est « taché » par une image
 * cross-origin (`toBlob` lève alors une `SecurityError` synchrone).
 */
function canvasVersBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', QUALITE_JPEG);
    } catch {
      resolve(null);
    }
  });
}
