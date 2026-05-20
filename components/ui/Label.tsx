import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import type { LabelHTMLAttributes, ReactNode } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * `htmlFor` est requis : un label sans association à un input est un
   * piège d'accessibilité. La signature force la prop à l'usage.
   */
  htmlFor: string;
  /** Affiche un astérisque rouge à droite si le champ est obligatoire. */
  obligatoire?: boolean;
  children: ReactNode;
}

/**
 * Étiquette de champ de formulaire, toujours associée à un input via `htmlFor`.
 *
 * Le marqueur d'obligatoire est visuel ET sémantique (l'astérisque est
 * dans le DOM, donc lu par les lecteurs d'écran). Penser à mettre
 * `required` sur l'input associé pour cohérence.
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { obligatoire = false, htmlFor, children, className, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      htmlFor={htmlFor}
      className={cn(
        'mb-1.5 inline-flex items-center gap-1 font-body text-sm font-medium text-text-2',
        className,
      )}
      {...props}
    >
      {children}
      {obligatoire ? (
        <span aria-label="champ obligatoire" className="text-danger">
          *
        </span>
      ) : null}
    </label>
  );
});
