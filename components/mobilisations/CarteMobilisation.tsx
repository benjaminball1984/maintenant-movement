import { Badge, Card } from '@/components/ui';
import { getImageObjet } from '@/lib/images';
import { formaterPlage, formaterRelativeAVenir } from '@/lib/mobilisations/dates';
import type { MobilisationEnrichie } from '@/lib/mobilisations/requetes';
import { cn } from '@/lib/utils';
import { Calendar, MapPin, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CarteMobilisationProps {
  mobilisation: MobilisationEnrichie;
  /** True pour la mise en avant (carte d'ouverture de liste). */
  enAvant?: boolean;
}

/**
 * Carte de listing d'une mobilisation. Montre l'essentiel pour décider
 * de cliquer : date, lieu, accroche, compteur.
 */
export function CarteMobilisation({ mobilisation, enAvant = false }: CarteMobilisationProps) {
  const accroche = extraireAccroche(mobilisation.description, 180);
  const relative = formaterRelativeAVenir(mobilisation.date_debut);
  const lien = `/mobiliser/mobilisations/${mobilisation.slug}`;
  const imageSrc = getImageObjet({ image_url: mobilisation.image_url, type_objet: 'mobilisation' });

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

      <header className="flex items-center justify-between gap-2">
        <Badge variant="brand">Mobilisation</Badge>
        <span className="text-xs font-bold uppercase tracking-cap text-text-3">{relative}</span>
      </header>

      <h3 className="text-lg font-bold leading-tight text-text-1">
        <Link
          href={`/mobiliser/mobilisations/${mobilisation.slug}`}
          className="underline-offset-4 hover:underline"
        >
          {mobilisation.titre}
        </Link>
      </h3>

      <dl className="grid gap-1 text-sm text-text-2">
        <div className="flex items-start gap-2">
          <Calendar
            size={16}
            strokeWidth={1.5}
            className="mt-0.5 shrink-0 text-text-3"
            aria-hidden="true"
          />
          <dt className="sr-only">Dates</dt>
          <dd>{formaterPlage(mobilisation.date_debut, mobilisation.date_fin)}</dd>
        </div>
        <div className="flex items-start gap-2">
          <MapPin
            size={16}
            strokeWidth={1.5}
            className="mt-0.5 shrink-0 text-text-3"
            aria-hidden="true"
          />
          <dt className="sr-only">Lieu</dt>
          <dd>{mobilisation.lieu}</dd>
        </div>
        <div className="flex items-start gap-2">
          <Users
            size={16}
            strokeWidth={1.5}
            className="mt-0.5 shrink-0 text-text-3"
            aria-hidden="true"
          />
          <dt className="sr-only">Participant·es</dt>
          <dd>
            {mobilisation.nombre_participant_es} participant·e
            {mobilisation.nombre_participant_es > 1 ? 's' : ''}
          </dd>
        </div>
      </dl>

      <p className="text-sm text-text-2">{accroche}</p>
    </Card>
  );
}

function extraireAccroche(texte: string, limite: number): string {
  if (texte.length <= limite) return texte;
  const tronque = texte.slice(0, limite);
  const dernierEspace = tronque.lastIndexOf(' ');
  const coupe = dernierEspace > limite * 0.6 ? tronque.slice(0, dernierEspace) : tronque;
  return `${coupe.trimEnd()}...`;
}
