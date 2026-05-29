import { BadgesMonnaies } from '@/components/marche/BadgesMonnaies';
import { Badge, Card } from '@/components/ui';
import type { MinimarcheSolidaireEnrichi } from '@/lib/marche/requetes';
import { cn } from '@/lib/utils';
import { CalendarRange, MapPin } from 'lucide-react';
import Link from 'next/link';

interface CarteMinimarcheProps {
  minimarche: MinimarcheSolidaireEnrichi;
  enAvant?: boolean;
}

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: 'numeric',
});

/**
 * `<CarteMinimarche>` — vignette d'un minimarché solidaire physique.
 * Affiche la date, le lieu, et les monnaies acceptées.
 */
export function CarteMinimarche({ minimarche, enAvant = false }: CarteMinimarcheProps) {
  const debut = FORMATEUR.format(new Date(minimarche.commence_le));
  const fin = FORMATEUR.format(new Date(minimarche.termine_le));
  const accroche =
    minimarche.description.length > 180
      ? `${minimarche.description.slice(0, 180).trimEnd()}...`
      : minimarche.description;
  return (
    <Card
      variant={enAvant ? 'eleve' : 'ombre'}
      className={cn('flex flex-col gap-3', enAvant && 'border-accent/40')}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant={minimarche.statut === 'en_cours' ? 'success' : 'brand'}>
          {minimarche.statut === 'en_cours'
            ? 'En cours'
            : minimarche.statut === 'annonce'
              ? 'Annoncé'
              : minimarche.statut === 'termine'
                ? 'Terminé'
                : 'Annulé'}
        </Badge>
      </header>

      <h3 className="text-lg font-bold leading-tight text-text-1">
        <Link
          href={`/s-entraider/marche/minimarches/${minimarche.slug}`}
          className="underline-offset-4 hover:underline"
        >
          {minimarche.titre}
        </Link>
      </h3>

      <p className="text-sm text-text-2">{accroche}</p>

      <dl className="grid gap-1 text-sm text-text-2">
        <div className="flex items-start gap-2">
          <CalendarRange
            size={14}
            strokeWidth={1.5}
            className="mt-0.5 text-text-3"
            aria-hidden="true"
          />
          <dt className="sr-only">Dates</dt>
          <dd>
            {debut} → {fin}
          </dd>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={14} strokeWidth={1.5} className="mt-0.5 text-text-3" aria-hidden="true" />
          <dt className="sr-only">Lieu</dt>
          <dd>{minimarche.lieu}</dd>
        </div>
      </dl>

      <BadgesMonnaies monnaies={minimarche.monnaies_acceptees} />
    </Card>
  );
}
