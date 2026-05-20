import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

/**
 * Champ de texte standard. Hauteur 44 px (cible tactile minimale, cf.
 * 04_DESIGN-TOKENS.md §5).
 *
 * Pour les états d'erreur, le composant prend `aria-invalid` : un bord
 * danger s'applique automatiquement, en plus du message d'erreur que le
 * formulaire affiche par ailleurs (cf. `<Label>` + helper text).
 */
export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'block w-full rounded-md border border-border bg-surface px-4 py-2.5',
        'font-body text-base text-text-1 placeholder:text-text-4',
        'transition-[box-shadow,border-color] duration-fast',
        'hover:border-border-dark',
        'aria-[invalid=true]:border-danger',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});
