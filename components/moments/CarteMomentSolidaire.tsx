import { Badge, Card } from '@/components/ui';
import { getImageObjet } from '@/lib/images';
import { TYPES_MOMENTS } from '@/lib/moments/config';
import type { MomentSolidaireEnrichi } from '@/lib/moments/requetes';
import { cn } from '@/lib/utils';
import { CalendarRange, MapPin, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CarteMomentProps {
  moment: MomentSolidaireEnrichi;
  enAvant?: boolean;
}

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: 'numeric',
});

export function CarteMomentSolidaire({ moment, enAvant = false }: CarteMomentProps) {
  const config = TYPES_MOMENTS[moment.type];
  const accroche =
    moment.description.length > 200
      ? `${moment.description.slice(0, 200).trimEnd()}...`
      : moment.description;
  const lien = `/agir/moments-solidaires/${moment.slug}`;
  // La table `moment_solidaire` n'a pas de colonne image : visuel par défaut du type.
  const imageSrc = getImageObjet({ image_url: null, type_objet: 'moment_solidaire' });
  return (
    <Card
      variant={enAvant ? 'eleve' : 'ombre'}
      className={cn('flex flex-col gap-3', enAvant && 'border-brand/40')}
    >
      <Link
        href={lien}
        className="relative block aspect-[16/9] w-full overflow-hidden rounded-md border border-border bg-surface-2"
      >
        <Image
          src={imageSrc}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover"
        />
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant={moment.type === 'porte_a_porte' ? 'brand' : 'accent'}>
          {config.libelle}
        </Badge>
        {moment.statut !== 'annonce' ? <Badge variant="default">{moment.statut}</Badge> : null}
      </header>
      <h3 className="text-lg font-bold leading-tight text-text-1">
        <Link
          href={`/agir/moments-solidaires/${moment.slug}`}
          className="underline-offset-4 hover:underline"
        >
          {moment.titre}
        </Link>
      </h3>
      <p className="text-sm text-text-2">{accroche}</p>
      <dl className="grid gap-1 text-sm text-text-3">
        <div className="flex items-center gap-2">
          <CalendarRange size={14} strokeWidth={1.5} aria-hidden="true" />
          <dt className="sr-only">Date</dt>
          <dd>{FORMATEUR.format(new Date(moment.commence_le))}</dd>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={14} strokeWidth={1.5} aria-hidden="true" />
          <dt className="sr-only">Lieu</dt>
          <dd>{moment.lieu}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} strokeWidth={1.5} aria-hidden="true" />
          <dt className="sr-only">Participant·es</dt>
          <dd>
            {moment.nombre_participants} participant·e{moment.nombre_participants > 1 ? 's' : ''}
            {moment.capacite_max !== null ? ` / ${moment.capacite_max}` : ''}
          </dd>
        </div>
      </dl>
      {moment.enfants.length > 0 ? (
        <p className="text-xs text-text-3">
          Cycle de {moment.enfants.length} RDV (porte-à-porte solidaire)
        </p>
      ) : null}
    </Card>
  );
}
