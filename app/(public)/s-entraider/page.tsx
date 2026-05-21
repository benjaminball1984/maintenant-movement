import { Alert, Heading } from '@/components/ui';
import { SOUS_ESPACES } from '@/lib/entraide/config';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'S’entraider',
  description:
    "L'entraide concrète et économique entre les gens : hébergement, transport, prêt d'objets, alimentation, SEL, marché solidaire.",
};

/**
 * Page d'accueil de l'espace S'entraider (chantier 4.1 v1).
 *
 * Pour 4.1, on affiche les 4 sous-espaces couverts + un placeholder pour
 * SEL (4.2) et Marché solidaire (4.3) avec leur chantier de référence.
 */
export default function PageSEntraider() {
  return (
    <>
      <Heading niveau={1}>S'entraider</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        L'entraide concrète et économique entre les gens. 4 sous-espaces actifs (hébergement,
        transport, prêt d'objets, alimentation), 2 à venir (SEL, marché solidaire).
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {Object.values(SOUS_ESPACES).map((config) => (
          <li key={config.type}>
            <Link
              href={`/s-entraider/${config.slug}`}
              className={cn(
                'block rounded-lg border border-border bg-surface p-4 transition',
                'hover:border-brand hover:bg-surface-2',
              )}
            >
              <p className="font-bold text-text-1">{config.titre}</p>
              <p className="mt-1 text-sm text-text-3">{config.description}</p>
            </Link>
          </li>
        ))}
      </ul>

      <Alert variant="info" titre="À venir" className="mt-8">
        <strong>SEL (4.2)</strong> : système d'échange local, 1 99-coin = 1 € = 1 minute.
        <br />
        <strong>Marché solidaire (4.3)</strong> : Bon Coin/Vinted-like, vente ou don gratuit.
      </Alert>
    </>
  );
}
