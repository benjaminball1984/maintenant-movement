import { Badge } from '@/components/ui';
import { calculerEtatStretch } from '@/lib/petitions/stretch';
import { cn } from '@/lib/utils';

/**
 * `<CompteurStretch>` — jauge de progression d'une pétition (cf. composants
 * réutilisables listés dans `docs/specs/01_ARCHITECTURE.md §11`).
 *
 * Applique la règle métier « ×1,5 à 90 % » : si la pétition a franchi 90 %
 * de son objectif initial, l'objectif affiché passe à objectif × 1,5, et
 * la jauge redémarre à partir de ce nouveau total. Voir `lib/petitions/stretch.ts`.
 *
 * Variantes d'usage :
 *   - en `taille="md"` : sur la page détail d'une pétition.
 *   - en `taille="sm"` : dans les cartes de liste, sous une Une.
 *
 * Accessible : `<progress>` natif lu par les lecteurs d'écran.
 */
interface CompteurStretchProps {
  /** Nombre de signatures actuelles. */
  signatures: number;
  /** Objectif initial de la pétition (avant stretch). */
  objectif: number;
  /** Taille visuelle de la jauge. */
  taille?: 'sm' | 'md';
  /** Classes additionnelles pour le conteneur. */
  className?: string;
}

const FORMATTER = new Intl.NumberFormat('fr-FR');

export function CompteurStretch({
  signatures,
  objectif,
  taille = 'md',
  className,
}: CompteurStretchProps) {
  const etat = calculerEtatStretch(signatures, objectif);

  return (
    <div className={cn('grid gap-2', className)} data-testid="compteur-stretch">
      <div className="flex items-baseline justify-between gap-3">
        <p className={cn('font-bold text-text-1', taille === 'sm' ? 'text-base' : 'text-2xl')}>
          {FORMATTER.format(signatures)}
          <span className="ml-1 text-sm font-normal text-text-3">
            / {FORMATTER.format(etat.objectifEffectif)} signataires
          </span>
        </p>
        {etat.estEtire ? (
          <Badge variant="accent" aria-label="Objectif initial dépassé">
            Objectif ×1,5
          </Badge>
        ) : null}
      </div>

      <progress
        value={etat.pourcentage}
        max={100}
        className={cn(
          'w-full overflow-hidden rounded-pill bg-surface-2',
          taille === 'sm' ? 'h-1.5' : 'h-2.5',
          // styling cross-navigateur : <progress> a deux pseudo-éléments
          // distincts selon le moteur (WebKit vs. Mozilla).
          '[&::-webkit-progress-bar]:bg-surface-2',
          '[&::-webkit-progress-value]:bg-grad-r [&::-webkit-progress-value]:transition-[width]',
          '[&::-moz-progress-bar]:bg-grad-r',
        )}
        aria-label={`Progression de la pétition : ${etat.pourcentage}% (${signatures} signataires sur ${etat.objectifEffectif})`}
      />

      {etat.estAtteint ? (
        <p className="text-xs font-bold uppercase tracking-cap text-success">
          Objectif atteint, on continue.
        </p>
      ) : null}
    </div>
  );
}
