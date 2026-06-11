import { cn } from '@/lib/utils';
import Image from 'next/image';

export interface ImageAfficheProps {
  /** URL de l'image (locale ou hébergée sur Supabase Storage). */
  src: string;
  /** Alternative textuelle ; vide par défaut (image décorative). */
  alt?: string;
  /**
   * Classes du conteneur. Donner ici le ratio voulu (défaut : aspect-[16/9]).
   * Le conteneur doit rester `relative` + `overflow-hidden` (posés ici).
   */
  className?: string;
  /** Attribut `sizes` passé à next/image (responsive). */
  sizes?: string;
}

/**
 * Affichage « affiche » d'une image de couverture (revue du 2026-06-11).
 *
 * Les visuels du mouvement sont souvent des affiches porteuses de texte
 * (titres, mots d'ordre). Un recadrage `object-cover` dans un ratio fixe
 * coupait ces écritures (vu en prod sur les pétitions Epstein et l'article
 * Bagayoko). Ici, l'image est montrée EN ENTIER (`object-contain`) par
 * dessus un fond constitué de la même image floutée et atténuée : pas de
 * bandes vides disgracieuses, et les écritures restent lisibles quel que
 * soit le ratio du visuel d'origine.
 */
export function ImageAffiche({ src, alt = '', className, sizes }: ImageAfficheProps) {
  return (
    <span className={cn('relative block overflow-hidden aspect-[16/9]', className)}>
      {/* Fond : la même image, floutée et atténuée, recadrée pour remplir. */}
      <Image
        src={src}
        alt=""
        fill
        unoptimized
        aria-hidden="true"
        sizes={sizes}
        className="scale-110 object-cover opacity-40 blur-lg"
      />
      {/* Premier plan : l'affiche entière, jamais recadrée. */}
      <Image src={src} alt={alt} fill unoptimized sizes={sizes} className="object-contain" />
    </span>
  );
}
