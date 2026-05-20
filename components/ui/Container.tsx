import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export type TailleContainer = 'sm' | 'md' | 'lg' | 'xl';

const STYLES_TAILLE: Record<TailleContainer, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-7xl',
};

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  taille?: TailleContainer;
}

/**
 * Conteneur de largeur maximale centré, avec padding horizontal
 * responsive. Utilisé comme racine de chaque page éditoriale.
 *
 * Tailles : `sm` (lectures longues), `md` (par défaut, articles),
 * `lg` (dashboards), `xl` (cartes pleine largeur).
 */
export function Container({ taille = 'md', className, ...props }: ContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', STYLES_TAILLE[taille], className)}
      {...props}
    />
  );
}
