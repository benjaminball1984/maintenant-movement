import { JaugeT99CPEuros } from '@/components/cagnottes/JaugeT99CPEuros';
import { Badge, Card } from '@/components/ui';
import type { CagnotteEnrichie } from '@/lib/cagnottes/requetes';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CarteCagnotteProps {
  cagnotte: CagnotteEnrichie;
  enAvant?: boolean;
}

const LIBELLE_TYPE: Record<string, string> = {
  ouverte: 'Cagnotte ouverte',
  lutte: 'Caisse de lutte',
  cotisation: 'Cotisation',
};

export function CarteCagnotte({ cagnotte, enAvant = false }: CarteCagnotteProps) {
  const accroche = extraireAccroche(cagnotte.texte, 200);
  const estSuspendue = cagnotte.statut === 'suspendue';

  return (
    <Card
      variant={enAvant ? 'eleve' : 'ombre'}
      className={cn('flex flex-col gap-3', enAvant && 'border-success/40')}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant={cagnotte.type === 'cotisation' ? 'accent' : 'success'}>
          {LIBELLE_TYPE[cagnotte.type] ?? cagnotte.type}
        </Badge>
        {estSuspendue ? <Badge variant="warning">Suspendue</Badge> : null}
      </header>

      <h3 className="text-lg font-bold leading-tight text-text-1">
        <Link
          href={`/mobiliser/cagnottes/${cagnotte.slug}`}
          className="underline-offset-4 hover:underline"
        >
          {cagnotte.titre}
        </Link>
      </h3>

      <p className="text-sm text-text-2">{accroche}</p>

      <JaugeT99CPEuros
        totalEurosCentimes={cagnotte.total_euros_centimes}
        totalT99CPUnites={cagnotte.total_t99cp_unites}
        objectifEuros={cagnotte.objectif_euros}
        nombreDons={cagnotte.nombre_dons}
        taille="sm"
      />
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
