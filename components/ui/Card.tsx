import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

export type VariantCard = 'plat' | 'ombre' | 'eleve';

const STYLES_VARIANT: Record<VariantCard, string> = {
  plat: 'border border-border',
  ombre: 'border border-border shadow-sm',
  eleve: 'border border-border shadow-md',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Niveau de prééminence de la carte.
   * - `plat` : juste un bord (listes denses).
   * - `ombre` : bord + ombre discrète (par défaut).
   * - `eleve` : ombre plus marquée (mise en avant ponctuelle).
   */
  variant?: VariantCard;
}

/**
 * Carte de contenu. Padding intérieur 24 px (cf. 04_DESIGN-TOKENS.md §5).
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'ombre', className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('rounded-lg bg-surface p-6 text-text-1', STYLES_VARIANT[variant], className)}
      {...props}
    />
  );
});
