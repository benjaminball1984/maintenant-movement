import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Zone de texte multi-lignes. Mêmes conventions visuelles que `<Input>`.
 * Hauteur minimale 6 lignes pour ne pas être trop serré.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 6, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'block w-full rounded-md border border-border bg-surface px-4 py-3',
        'font-body text-base text-text-1 placeholder:text-text-4',
        'transition-[box-shadow,border-color] duration-fast resize-y',
        'hover:border-border-dark',
        'aria-[invalid=true]:border-danger',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});
