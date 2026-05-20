import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Niveaux de titre supportés (h1 à h4). h5/h6 sont rarement nécessaires
 * dans une hiérarchie éditoriale propre : on préfère reconcevoir la
 * structure plutôt que descendre plus bas.
 */
export type NiveauHeading = 1 | 2 | 3 | 4;

const ELEMENTS: Record<NiveauHeading, 'h1' | 'h2' | 'h3' | 'h4'> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
};

/**
 * Classes Tailwind correspondant à l'apparence de chaque niveau.
 * On les écrit en dur (et pas via interpolation) pour que le scanner
 * Tailwind les conserve dans le CSS compilé.
 */
const CLASSE_APPARENCE: Record<NiveauHeading, string> = {
  1: 'text-5xl',
  2: 'text-3xl',
  3: 'text-2xl',
  4: 'text-xl',
};

export interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'children'> {
  niveau: NiveauHeading;
  /**
   * Permet de styliser comme un autre niveau (ex : un `h2` qui prend
   * l'apparence d'un `h1`). Utile pour préserver la hiérarchie HTML/SEO
   * sans contrainte visuelle.
   */
  apparenceComme?: NiveauHeading;
  children: ReactNode;
}

/**
 * Titre éditorial.
 *
 * Le style provient des règles globales (`app/globals.css`). Cette
 * abstraction sert surtout à dissocier la balise sémantique (`niveau`)
 * de l'apparence (`apparenceComme`), tout en exposant un composant à
 * importer cohérent avec les autres `ui/`.
 */
export function Heading({ niveau, apparenceComme, className, children, ...props }: HeadingProps) {
  const Element = ELEMENTS[niveau];
  const classeApparence =
    apparenceComme !== undefined && apparenceComme !== niveau
      ? CLASSE_APPARENCE[apparenceComme]
      : '';
  return (
    <Element className={cn(classeApparence, className)} {...props}>
      {children}
    </Element>
  );
}
