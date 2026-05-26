import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

/**
 * Variantes de boutons (cf. docs/specs/04_DESIGN-TOKENS.md §10 et exigence
 * ET4 du cycle V2, `docs/cdc-v2/01b-EXIGENCES-TRANSVERSALES-UI.md`).
 *
 * - `primary` : CTA principal, porte le dégradé signature
 *   (token `--grad` violet → magenta → framboise) + l'ombre `--shadow-brand`,
 *   dans les deux modes clair/sombre. Réservé aux actions positives majeures
 *   (signer, soutenir, adhérer, créer un compte, envoyer). Règle d'or
 *   anti-saturation : le dégradé est le point fort, pas le fond sonore. Si
 *   tout est en `primary`, l'identité disparaît. Les actions secondaires
 *   restent neutres (`ghost`, `outline`).
 * - `ghost` : action secondaire, fond surface avec bordure discrète.
 * - `outline` : action neutre, bordure brand, fond transparent.
 * - `link` : variante texte, sans fond ni bordure (pour CTA tertiaires).
 *
 * Alias historique : `gradient` reste accepté comme synonyme de `primary`
 * pour ne pas casser le code et la doc V1 qui le nomment ainsi. Les deux
 * pointent vers la même classe.
 */
export type VariantBouton = 'primary' | 'gradient' | 'ghost' | 'outline' | 'link';

/**
 * Tailles (hauteur tactile minimale 44 px pour `md` et `lg`, cf. spec §5).
 */
export type TailleBouton = 'sm' | 'md' | 'lg';

const STYLE_PRIMARY = 'bg-grad text-white shadow-brand hover:brightness-110';

const STYLES_VARIANT: Record<VariantBouton, string> = {
  primary: STYLE_PRIMARY,
  gradient: STYLE_PRIMARY,
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
  { variant = 'primary', taille = 'md', className, type = 'button', ...props },
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
