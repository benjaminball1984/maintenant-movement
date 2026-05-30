import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface JaugeT99CPEurosProps {
  totalEurosCentimes: number;
  totalT99CPUnites: number;
  /** Objectif en euros (0 = pas d'objectif chiffré). */
  objectifEuros: number;
  nombreDons: number;
  taille?: 'sm' | 'md';
  className?: string;
}

const FORMAT_EURO = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const FORMAT_NOMBRE = new Intl.NumberFormat('fr-FR');

/**
 * `<JaugeT99CPEuros>` — compteur unifié euros + T99CP d'une cagnotte
 * (cf. composants réutilisables spec §11).
 *
 * Convention de cumul : 1 T99CP = 1 € (cf. SEL spec §6E). Le total
 * affiché est donc la somme des deux. Une note précise la répartition.
 *
 * Si `objectifEuros` est 0, on n'affiche pas de jauge (cagnotte sans
 * objectif chiffré), juste le total cumulé.
 */
export function JaugeT99CPEuros({
  totalEurosCentimes,
  totalT99CPUnites,
  objectifEuros,
  nombreDons,
  taille = 'md',
  className,
}: JaugeT99CPEurosProps) {
  const totalEuros = totalEurosCentimes / 100;
  const totalCumuleEuros = totalEuros + totalT99CPUnites;
  const pourcentage =
    objectifEuros > 0 ? Math.min(100, Math.round((totalCumuleEuros / objectifEuros) * 100)) : 0;
  const objectifAtteint = objectifEuros > 0 && totalCumuleEuros >= objectifEuros;

  return (
    <div className={cn('grid gap-2', className)} data-testid="jauge-cagnotte">
      <div className="flex items-baseline justify-between gap-3">
        <p className={cn('font-bold text-text-1', taille === 'sm' ? 'text-base' : 'text-2xl')}>
          {/* 1 99-coin = 1 € = 1 minute : on affiche les deux monnaies. */}
          {FORMAT_EURO.format(totalCumuleEuros)}
          <span className="ml-1 font-normal text-brand">
            / {FORMAT_NOMBRE.format(Math.round(totalCumuleEuros))} 99-coin
          </span>
          {objectifEuros > 0 ? (
            <span className="ml-1 text-sm font-normal text-text-3">
              sur {FORMAT_EURO.format(objectifEuros)} / {FORMAT_NOMBRE.format(objectifEuros)}{' '}
              99-coin
            </span>
          ) : null}
        </p>
        {objectifAtteint ? (
          <Badge variant="success">Objectif atteint</Badge>
        ) : objectifEuros > 0 ? (
          <span className="text-sm font-bold text-brand">{pourcentage}%</span>
        ) : null}
      </div>

      {objectifEuros > 0 ? (
        <progress
          value={pourcentage}
          max={100}
          aria-label={`Progression : ${pourcentage}% (${FORMAT_EURO.format(totalCumuleEuros)} sur ${FORMAT_EURO.format(objectifEuros)})`}
          className={cn(
            'w-full overflow-hidden rounded-pill bg-surface-2',
            taille === 'sm' ? 'h-1.5' : 'h-2.5',
            '[&::-webkit-progress-bar]:bg-surface-2',
            '[&::-webkit-progress-value]:bg-grad-r [&::-webkit-progress-value]:transition-[width]',
            '[&::-moz-progress-bar]:bg-grad-r',
          )}
        />
      ) : null}

      <p className="text-xs text-text-3">
        {FORMAT_NOMBRE.format(nombreDons)} don{nombreDons > 1 ? 's' : ''} ·{' '}
        {FORMAT_EURO.format(totalEuros)} en euros · {FORMAT_NOMBRE.format(totalT99CPUnites)} 99-coin
      </p>
    </div>
  );
}
