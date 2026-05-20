import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Variantes de badges.
 *
 * - `vous` : badge signature « ✨ Vous » sur les contenus créés par
 *   la personne connectée (cf. 04_DESIGN-TOKENS.md §10).
 * - `default` : neutre, surface 2.
 * - `success`, `info`, `warning`, `danger` : sémantique.
 * - `accent`, `brand`, `hue` : marqueurs colorés sobres.
 */
export type VariantBadge =
  | 'default'
  | 'vous'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'brand'
  | 'hue';

const STYLES_VARIANT: Record<VariantBadge, string> = {
  default: 'bg-surface-2 text-text-2 border border-border',
  vous: 'bg-grad-r text-white shadow-brand',
  success: 'bg-success-light text-success border border-success/30',
  info: 'bg-info-light text-info border border-info/30',
  warning: 'bg-warning-light text-warning border border-warning/30',
  danger: 'bg-danger-light text-danger border border-danger/30',
  accent: 'bg-accent-light text-accent border border-accent/30',
  brand: 'bg-brand-light text-brand border border-brand/30',
  hue: 'bg-hue-light text-hue border border-hue/30',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: VariantBadge;
  children: ReactNode;
}

/**
 * Badge inline. Pour la variante `vous`, une icône Sparkles est posée
 * automatiquement à gauche du texte.
 */
export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-2 py-0.5',
        'font-body text-xs font-bold uppercase tracking-cap',
        STYLES_VARIANT[variant],
        className,
      )}
      {...props}
    >
      {variant === 'vous' ? <Sparkles size={12} strokeWidth={2} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
