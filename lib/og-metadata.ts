/**
 * Helper de génération des métadonnées Open Graph côté serveur (cycle V2 §10,
 * chantier V2.2.4).
 *
 * Le §10 V2 dit : « métadonnées OG (titre + description + IMAGE par défaut
 * ou uploadée) générées CÔTÉ SERVEUR sur chaque page partageable. Les
 * robots OG ne lisent pas le JS — c'est un point dur de Next.js. »
 *
 * Avant V2.2.4, les pages de détail (pétition, cagnotte, mobilisation,
 * moment solidaire, article) avaient `generateMetadata` qui ne retournait
 * que `title` + `description`. Next.js dérivait des balises OG minimales
 * SANS image, donc les aperçus de partage (WhatsApp, Facebook, X) étaient
 * vides ou affichaient le favicon. Inacceptable selon ET1 (« tout objet
 * partageable a TOUJOURS une image »).
 *
 * Ce helper standardise la production des balises OG + Twitter pour
 * toutes les pages partageables. Il s'appuie sur :
 * - `lib/images.ts:getImageObjet` (V2.0.3 ET1+ET2) pour la résolution
 *   de l'image (uploadée gagne, sinon défaut par type).
 * - `config/site.ts:SITE.urlProd` pour les URL absolues exigées par les
 *   crawlers OG.
 */

import { SITE } from '@/config/site';
import { getImageObjet } from '@/lib/images';
import type { TypeObjet } from '@/lib/images-defaut';
import type { Metadata } from 'next';

export interface ObjetPartageable {
  /** Titre humain de l'objet (pétition, cagnotte, etc.). */
  titre: string;
  /** Description longue (sera tronquée à 200 caractères pour l'OG). */
  description: string;
  /** URL uploadée si présente, sinon `null` → on tombe sur la défaut. */
  image_url?: string | null;
  /** Type éditorial qui sélectionne l'image par défaut. */
  type_objet: TypeObjet;
}

export interface MetadataPartageOptions {
  /** Objet à partager (lecture image + texte). */
  objet: ObjetPartageable;
  /** Chemin du site relatif à la racine (ex. `/mobiliser/petitions/abc`). */
  cheminPage: string;
  /**
   * Type Open Graph : `website` par défaut, `article` pour les articles
   * éditoriaux (Maintenant Médias) qui doivent porter `og:type=article`.
   */
  ogType?: 'website' | 'article';
}

const LONGUEUR_DESCRIPTION_OG = 200;
const LONGUEUR_DESCRIPTION_TWITTER = 200;

/**
 * Convertit un chemin relatif (`/uploads/xxx.jpg` ou `/defaults/xxx.svg`)
 * en URL absolue en utilisant `SITE.urlProd`. Si le chemin est déjà absolu
 * (commence par `http`), on le retourne tel quel.
 */
function enUrlAbsolue(chemin: string): string {
  if (chemin.startsWith('http://') || chemin.startsWith('https://')) {
    return chemin;
  }
  const base = SITE.urlProd.replace(/\/$/, '');
  const chemNorm = chemin.startsWith('/') ? chemin : `/${chemin}`;
  return `${base}${chemNorm}`;
}

function tronquer(texte: string, longueurMax: number): string {
  const propre = texte.trim();
  if (propre.length <= longueurMax) return propre;
  return `${propre.slice(0, longueurMax - 1).trimEnd()}…`;
}

/**
 * Construit la `Metadata` Next.js complète pour une page partageable :
 * - balises de base (title, description) ;
 * - balises Open Graph (titre, description, image absolue, type, locale,
 *   site_name, url canonique) ;
 * - balises Twitter Card (summary_large_image, image absolue).
 *
 * À utiliser dans `generateMetadata` de chaque page de détail :
 *
 *   export async function generateMetadata({ params }) {
 *     const objet = await chargerObjet(params.slug);
 *     return metadataPourPartage({
 *       objet: { titre: objet.titre, description: objet.texte, image_url: objet.image_url, type_objet: 'petition' },
 *       cheminPage: `/mobiliser/petitions/${objet.slug}`,
 *     });
 *   }
 */
export function metadataPourPartage(options: MetadataPartageOptions): Metadata {
  const { objet, cheminPage, ogType = 'website' } = options;

  const titre = objet.titre.trim();
  const descriptionOg = tronquer(objet.description, LONGUEUR_DESCRIPTION_OG);
  const descriptionTwitter = tronquer(objet.description, LONGUEUR_DESCRIPTION_TWITTER);

  const imageRelative = getImageObjet({
    image_url: objet.image_url ?? null,
    type_objet: objet.type_objet,
  });
  const imageAbsolue = enUrlAbsolue(imageRelative);

  const urlCanonique = enUrlAbsolue(cheminPage);

  return {
    title: titre,
    description: descriptionOg,
    alternates: {
      canonical: urlCanonique,
    },
    openGraph: {
      title: titre,
      description: descriptionOg,
      url: urlCanonique,
      siteName: SITE.nom,
      locale: 'fr_FR',
      type: ogType,
      images: [
        {
          url: imageAbsolue,
          width: 1200,
          height: 675,
          alt: titre,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: titre,
      description: descriptionTwitter,
      images: [imageAbsolue],
    },
  };
}
