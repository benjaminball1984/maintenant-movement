import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Bouton icône carré, accessible.
 *
 * `aria-label` est obligatoire (la prop typée le rend explicite) : sans
 * texte visible, l'icône doit avoir une étiquette accessible.
 */
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  children: ReactNode;
  taille?: 'sm' | 'md' | 'lg';
}

const STYLES_TAILLE = {
  sm: 'h-9 w-9 rounded-sm',
  md: 'h-11 w-11 rounded-md',
  lg: 'h-12 w-12 rounded-md',
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { taille = 'md', className, type = 'button', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center',
        'border border-border bg-surface text-text-1',
        'transition-[transform,background-color] duration-fast',
        'hover:bg-surface-2 active:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        STYLES_TAILLE[taille],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
