import { Badge, Card } from '@/components/ui';
import type { CampagneEnrichie } from '@/lib/campagnes/requetes';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CarteCampagneProps {
  campagne: CampagneEnrichie;
  enAvant?: boolean;
}

const LIBELLE_TYPE_MODULE: Record<string, string> = {
  petition: 'Pétition',
  mobilisation: 'Mobilisation',
  cagnotte: 'Cagnotte',
  sondage: 'Sondage',
  page_editoriale: 'Page éditoriale',
};

/**
 * Carte de listing d'une campagne. Affiche le nombre et les types de
 * modules attachés (badges), pour donner à voir la dimension multi-canal.
 */
export function CarteCampagne({ campagne, enAvant = false }: CarteCampagneProps) {
  const accroche = extraireAccroche(campagne.texte, 220);
  const typesModules = [...new Set(campagne.modules.map((m) => m.type_module))];

  return (
    <Card
      variant={enAvant ? 'eleve' : 'ombre'}
      className={cn('flex flex-col gap-3', enAvant && 'border-accent/40')}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="accent">Campagne</Badge>
        <span className="text-xs text-text-3">
          {campagne.modules.length} module{campagne.modules.length > 1 ? 's' : ''}
        </span>
      </header>

      <h3 className="text-lg font-bold leading-tight text-text-1">
        <Link
          href={`/mobiliser/campagnes/${campagne.slug}`}
          className="underline-offset-4 hover:underline"
        >
          {campagne.titre}
        </Link>
      </h3>

      <p className="text-sm text-text-2">{accroche}</p>

      {typesModules.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {typesModules.map((type) => (
            <li key={type}>
              <Badge variant="default">{LIBELLE_TYPE_MODULE[type] ?? type}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
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
