import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

/**
 * Variantes de boutons (cf. docs/specs/04_DESIGN-TOKENS.md §10).
 *
 * - `gradient` : CTA principal, fond gradient violet/magenta/framboise.
 *   Réservé aux actions positives majeures (signer, soutenir, adhérer).
 * - `ghost` : action secondaire, fond surface avec bordure discrète.
 * - `outline` : action neutre, bordure brand, fond transparent.
 * - `link` : variante texte, sans fond ni bordure (pour CTA tertiaires).
 */
export type VariantBouton = 'gradient' | 'ghost' | 'outline' | 'link';

/**
 * Tailles (hauteur tactile minimale 44 px pour `md` et `lg`, cf. spec §5).
 */
export type TailleBouton = 'sm' | 'md' | 'lg';

const STYLES_VARIANT: Record<VariantBouton, string> = {
  gradient: 'bg-grad text-white shadow-brand hover:brightness-110',
  ghost: 'bg-surface text-text-1 border border-border hover:bg-surface-2',
  outline: 'bg-transparent text-brand border border-brand hover:bg-brand-light',
  link: 'bg-transparent text-brand underline-offset-4 hover:underline px-0',
};

const STYLES_TAILLE: Record<TailleBouton, string> = {
  sm: 'h-9 px-3 text-sm rounded-sm',
  md: 'h-11 px-5 text-sm rounded-md',
  lg: 'h-12 px-6 text-base rounded-md',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: VariantBouton;
  taille?: TailleBouton;
}

/**
 * Bouton standard. Toujours `type="button"` par défaut (évite les
 * soumissions involontaires de formulaire).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'gradient', taille = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-body font-bold',
        'transition-[transform,box-shadow,filter,background-color] duration-fast',
        'active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50',
        STYLES_VARIANT[variant],
        STYLES_TAILLE[taille],
        className,
      )}
      {...props}
    />
  );
});
