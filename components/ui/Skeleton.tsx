import { cn } from '@/lib/utils';

/**
 * Composant Skeleton — placeholder animé pendant le chargement (V2.4.85).
 *
 * Affiche un rectangle gris animé (pulse). À utiliser dans les
 * suspense boundaries ou les états de chargement client. Server Component
 * compatible (le pulse est en CSS pur via Tailwind `animate-pulse`).
 *
 * @example <Skeleton className="h-4 w-32" />
 * @example <SkeletonText lignes={3} />
 * @example <SkeletonCarte />
 */

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-md bg-surface-2', className)} aria-hidden="true" />
  );
}

/** N lignes de texte placeholders, largeurs variées pour réalisme. */
export function SkeletonText({ lignes = 3 }: { lignes?: number }) {
  // Largeurs déterministes par index pour éviter le React hydration mismatch.
  const largeurs = ['w-full', 'w-11/12', 'w-10/12', 'w-9/12', 'w-8/12'];
  return (
    <div className="grid gap-2" aria-label="Chargement…" aria-busy="true">
      {Array.from({ length: lignes }).map((_, i) => (
        <Skeleton
          key={`l-${i}-${largeurs[i % largeurs.length]}`}
          className={cn('h-4', largeurs[i % largeurs.length])}
        />
      ))}
    </div>
  );
}

/** Skeleton de carte type liste : titre + 2 lignes + footer. */
export function SkeletonCarte() {
  return (
    <div className="grid gap-3 rounded-md border border-border bg-surface p-4" aria-busy="true">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
