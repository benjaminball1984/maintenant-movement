import { Badge, Card } from '@/components/ui';
import type { CommuneEnrichie } from '@/lib/communes/requetes';
import { cn } from '@/lib/utils';
import { MapPin, Users } from 'lucide-react';
import Link from 'next/link';

interface CarteCommuneProps {
  commune: CommuneEnrichie;
  enAvant?: boolean;
}

export function CarteCommune({ commune, enAvant = false }: CarteCommuneProps) {
  const estLibre = commune.statut_creation === 'auto_creee';
  return (
    <Card
      variant={enAvant ? 'eleve' : 'ombre'}
      className={cn('flex flex-col gap-2', enAvant && 'border-brand/40')}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant={estLibre ? 'accent' : 'brand'}>
          {estLibre ? 'Commune libre' : 'Commune'}
        </Badge>
      </header>
      <h3 className="text-lg font-bold leading-tight text-text-1">
        <Link
          href={`/agir/communes/${commune.slug}`}
          className="underline-offset-4 hover:underline"
        >
          {commune.nom}
        </Link>
      </h3>
      {commune.description_courte !== null && commune.description_courte.trim() !== '' ? (
        <p className="text-sm text-text-2">{commune.description_courte}</p>
      ) : null}
      <dl className="grid gap-1 text-sm text-text-3">
        {commune.code_postal_principal !== null ? (
          <div className="flex items-center gap-2">
            <MapPin size={14} strokeWidth={1.5} aria-hidden="true" />
            <dt className="sr-only">Code postal</dt>
            <dd>{commune.code_postal_principal}</dd>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <Users size={14} strokeWidth={1.5} aria-hidden="true" />
          <dt className="sr-only">Adhérent·es</dt>
          <dd>
            {commune.nombre_adherents} adhérent{commune.nombre_adherents > 1 ? 's·es' : ''}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
