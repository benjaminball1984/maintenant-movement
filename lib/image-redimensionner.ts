/**
 * Redimensionnement d'image côté client avant téléversement (pipeline images).
 *
 * Helper navigateur pur (canvas + `createImageBitmap`) : à appeler depuis un
 * Client Component (ex. `components/ui/TeleverseurImage.tsx`) AVANT la
 * validation et l'envoi. Objectif : ne pas téléverser une photo de 8 Mo
 * sortie d'un téléphone alors que l'UI n'affiche jamais plus de ~1600 px.
 *
 * Règles :
 * - Si l'image est déjà sous `maxDimension` ET pèse moins de 500 Ko, elle est
 *   retournée telle quelle (rien à gagner).
 * - Sinon elle est redessinée dans un canvas (côté long ramené à
 *   `maxDimension`, proportions conservées) puis réencodée : JPEG qualité
 *   0.85 par défaut, en conservant le format source pour PNG (transparence)
 *   et WebP.
 * - En cas d'échec (fichier non décodable, canvas indisponible, réencodage
 *   contre-productif), le fichier original est retourné sans erreur : la
 *   validation MIME/taille existante et le serveur restent les filets de
 *   sécurité.
 */

/** Côté long maximal par défaut (px). Suffisant pour une couverture 16/9. */
const MAX_DIMENSION_DEFAUT = 1600;

/** En dessous de ce poids (octets), on ne retraite pas une image déjà petite. */
const SEUIL_OCTETS_SANS_TRAITEMENT = 500 * 1024;

/** Qualité de réencodage avec perte (JPEG / WebP), entre 0 et 1. */
const QUALITE_REENCODAGE = 0.85;

/** Extension de fichier cohérente avec chaque type MIME de sortie. */
const EXTENSION_PAR_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/**
 * Résultat intermédiaire du décodage : une source dessinable dans un canvas,
 * ses dimensions, et une fonction de libération des ressources associées
 * (fermeture du bitmap ou révocation de l'object URL).
 */
interface ImageDecodee {
  source: CanvasImageSource;
  largeur: number;
  hauteur: number;
  liberer: () => void;
}

/**
 * Décode un `File` image en source dessinable. Préfère `createImageBitmap`
 * (rapide, respecte l'orientation EXIF) et retombe sur un `<img>` + object
 * URL pour les navigateurs plus anciens. Rejette si le fichier n'est pas
 * une image décodable.
 */
async function decoderImage(fichier: File): Promise<ImageDecodee> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(fichier);
    return {
      source: bitmap,
      largeur: bitmap.width,
      hauteur: bitmap.height,
      liberer: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(fichier);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Image non décodable'));
      element.src = url;
    });
    return {
      source: image,
      largeur: image.naturalWidth,
      hauteur: image.naturalHeight,
      liberer: () => URL.revokeObjectURL(url),
    };
  } catch (erreur) {
    URL.revokeObjectURL(url);
    throw erreur;
  }
}

/** Promisifie `canvas.toBlob` (API à callback). `null` si encodage impossible. */
function canvasVersBlob(
  canvas: HTMLCanvasElement,
  type: string,
  qualite?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, qualite);
  });
}

/**
 * Type MIME de sortie : on conserve PNG (transparence) et WebP tels quels,
 * tout le reste est réencodé en JPEG.
 */
function typeSortiePour(typeSource: string): string {
  if (typeSource === 'image/png' || typeSource === 'image/webp') return typeSource;
  return 'image/jpeg';
}

/** Remplace l'extension du nom de fichier pour rester cohérente avec le type. */
function nomPourType(nomOriginal: string, typeSortie: string): string {
  const extension = EXTENSION_PAR_TYPE[typeSortie] ?? '.jpg';
  const sansExtension = nomOriginal.replace(/\.[^.]+$/, '');
  return `${sansExtension}${extension}`;
}

/**
 * Redimensionne et réencode une image côté client si elle dépasse
 * `maxDimension` (côté long) ou pèse 500 Ko ou plus.
 *
 * Ne lève jamais : en cas d'échec de décodage ou d'encodage, le fichier
 * original est retourné tel quel (catch silencieux), et les validations en
 * aval (type MIME, 5 Mo max) font leur travail normalement.
 *
 * @param fichier - Le `File` choisi par la personne dans l'input fichier.
 * @param maxDimension - Côté long maximal en pixels (défaut : 1600).
 * @returns Le fichier réduit, ou l'original s'il n'y avait rien à gagner.
 *
 * @example
 * const fichierReduit = await redimensionnerImage(fichierBrut);
 * formData.append('fichier', fichierReduit);
 */
export async function redimensionnerImage(
  fichier: File,
  maxDimension: number = MAX_DIMENSION_DEFAUT,
): Promise<File> {
  try {
    const decodee = await decoderImage(fichier);
    try {
      const coteLong = Math.max(decodee.largeur, decodee.hauteur);
      if (coteLong <= maxDimension && fichier.size < SEUIL_OCTETS_SANS_TRAITEMENT) {
        // Déjà petite ET légère : on ne touche à rien.
        return fichier;
      }

      // Ratio plafonné à 1 : une image sous maxDimension mais lourde est
      // seulement réencodée, jamais agrandie.
      const ratio = Math.min(1, maxDimension / coteLong);
      const largeurCible = Math.max(1, Math.round(decodee.largeur * ratio));
      const hauteurCible = Math.max(1, Math.round(decodee.hauteur * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = largeurCible;
      canvas.height = hauteurCible;
      const contexte = canvas.getContext('2d');
      if (contexte === null) return fichier;
      contexte.drawImage(decodee.source, 0, 0, largeurCible, hauteurCible);

      const typeDemande = typeSortiePour(fichier.type);
      const qualite = typeDemande === 'image/png' ? undefined : QUALITE_REENCODAGE;
      const blob = await canvasVersBlob(canvas, typeDemande, qualite);
      if (blob === null || blob.size >= fichier.size) {
        // Encodage indisponible ou contre-productif : on garde l'original.
        return fichier;
      }

      // Si le navigateur ne sait pas encoder le type demandé (ex. WebP sur
      // un vieux Safari), `toBlob` retombe sur PNG : on suit le type réel.
      const typeFinal = blob.type !== '' ? blob.type : typeDemande;
      return new File([blob], nomPourType(fichier.name, typeFinal), {
        type: typeFinal,
        lastModified: fichier.lastModified,
      });
    } finally {
      decodee.liberer();
    }
  } catch {
    // Décodage impossible (fichier corrompu, type non image...) : on retourne
    // l'original, la validation MIME/taille en aval fera son travail.
    return fichier;
  }
}
