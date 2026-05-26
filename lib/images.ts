/**
 * Helper unifié de résolution d'image pour les objets du site Maintenant!.
 *
 * Exigence transversale ET1 + ET2 du cycle V2
 * (`docs/cdc-v2/01b-EXIGENCES-TRANSVERSALES-UI.md`) :
 *
 * - **Tout objet partageable a TOUJOURS une image.**
 * - Si la personne a téléversé une image (`image_url` non vide), celle-ci
 *   gagne et remplace la défaut pour cet objet précis.
 * - Sinon, on tombe sur l'image par défaut associée au type d'objet
 *   (bibliothèque curée par l'admin, voir `lib/images-defaut.ts`).
 *
 * Ce helper centralise la règle pour que tous les appelants partagent la
 * même logique (DRY). Importer ce module et appeler `getImageObjet(...)`
 * partout où on a besoin d'une URL d'image (cartes de liste, pages détail,
 * tags Open Graph, vignettes de partage, etc.).
 */

import { type TypeObjet, imageDefautPour } from '@/lib/images-defaut';

/**
 * Forme minimale qu'un objet doit avoir pour qu'on puisse résoudre son
 * image. Les tables V1 n'ont pas toutes une colonne `image_url` au même
 * nom (certaines ont `photo_url`, `visuel_url`, etc.) — les appelants
 * sont responsables de mapper avant d'appeler ce helper.
 */
export interface ObjetAvecImage {
  /**
   * URL absolue (https://...) ou relative au site (`/uploads/...`) de
   * l'image téléversée. `null`, `undefined` ou chaîne vide = pas d'image
   * uploadée, on prend la défaut.
   */
  image_url?: string | null;

  /**
   * Type éditorial de l'objet, qui sélectionne l'image par défaut si
   * `image_url` est absent.
   */
  type_objet: TypeObjet | string;
}

/**
 * Résout l'image à afficher pour un objet.
 *
 * - Retourne `image_url` si présent et non vide.
 * - Sinon retourne l'image par défaut associée au type.
 * - Si le type est inconnu, retombe sur l'image par défaut générique.
 *
 * Toujours non-null : un objet a toujours une image.
 */
export function getImageObjet(objet: ObjetAvecImage): string {
  const url = objet.image_url;
  if (typeof url === 'string' && url.trim() !== '') {
    return url;
  }
  return imageDefautPour(objet.type_objet);
}
