import { Badge, Card } from '@/components/ui';
import type { OffreEnrichie } from '@/lib/entraide/requetes';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import Link from 'next/link';

interface CarteOffreProps {
  offre: OffreEnrichie;
  enAvant?: boolean;
}

export function CarteOffre({ offre, enAvant = false }: CarteOffreProps) {
  const accroche = extraireAccroche(offre.description, 180);
  return (
    <Card
      variant={enAvant ? 'eleve' : 'ombre'}
      className={cn('flex flex-col gap-3', enAvant && 'border-info/40')}
    >
      <header className="flex items-center justify-between gap-2">
        <Badge variant={offre.sens === 'propose' ? 'success' : 'info'}>
          {offre.sens === 'propose' ? 'Offre' : 'Demande'}
        </Badge>
      </header>

      <h3 className="text-lg font-bold leading-tight text-text-1">
        <Link
          href={`/s-entraider/offre/${offre.slug}`}
          className="underline-offset-4 hover:underline"
        >
          {offre.titre}
        </Link>
      </h3>

      <p className="flex items-center gap-1.5 text-sm text-text-3">
        <MapPin size={14} strokeWidth={1.5} aria-hidden="true" />
        {offre.lieu}
      </p>

      <p className="text-sm text-text-2">{accroche}</p>
    </Card>
  );
}

function extraireAccroche(texte: string, limite: number): string {
  if (texte.length <= limite) return texte;
  const t = texte.slice(0, limite);
  const e = t.lastIndexOf(' ');
  const c = e > limite * 0.6 ? t.slice(0, e) : t;
  return `${c.trimEnd()}...`;
}
