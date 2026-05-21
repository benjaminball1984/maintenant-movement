import { Badge, Card } from '@/components/ui';
import type { ServiceSelEnrichi } from '@/lib/sel/requetes';
import { cn } from '@/lib/utils';
import { Clock, MapPin } from 'lucide-react';
import Link from 'next/link';

interface CarteServiceProps {
  service: ServiceSelEnrichi;
  enAvant?: boolean;
}

export function CarteService({ service, enAvant = false }: CarteServiceProps) {
  const accroche =
    service.description.length > 200
      ? `${service.description.slice(0, 200).trimEnd()}...`
      : service.description;
  return (
    <Card
      variant={enAvant ? 'eleve' : 'ombre'}
      className={cn('flex flex-col gap-3', enAvant && 'border-brand/40')}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant={service.categorie === 'service' ? 'brand' : 'accent'}>
          {service.categorie === 'service' ? 'Service' : 'Volontariat'}
        </Badge>
        <Badge variant={service.sens === 'propose' ? 'success' : 'info'}>
          {service.sens === 'propose' ? 'Offre' : 'Demande'}
        </Badge>
      </header>
      <h3 className="text-lg font-bold leading-tight text-text-1">
        <Link
          href={`/s-entraider/sel/${service.slug}`}
          className="underline-offset-4 hover:underline"
        >
          {service.titre}
        </Link>
      </h3>
      <dl className="grid gap-1 text-sm text-text-2">
        <div className="flex items-start gap-2">
          <Clock size={14} strokeWidth={1.5} className="mt-0.5 text-text-3" />
          <dd>
            {service.duree_minutes_estimee} min ·{' '}
            <span className="text-text-3">{service.duree_minutes_estimee} 99-coin attendus</span>
          </dd>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={14} strokeWidth={1.5} className="mt-0.5 text-text-3" />
          <dd>{service.lieu}</dd>
        </div>
      </dl>
      <p className="text-sm text-text-2">{accroche}</p>
    </Card>
  );
}
