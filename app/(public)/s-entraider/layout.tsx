import { Container } from '@/components/ui';
import { SOUS_ESPACES } from '@/lib/entraide/config';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Layout du sous-espace S'entraider (chantier 4.1).
 *
 * Nav latérale (ou en bandeau mobile) qui liste les 4 sous-espaces
 * couverts par le chantier + lien vers SEL et Marché solidaire (en
 * stub jusqu'aux chantiers 4.2 et 4.3).
 */
export default function LayoutEntraide({ children }: { children: ReactNode }) {
  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">S'entraider</p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <nav aria-label="Sous-espaces S'entraider">
            <ul className="grid gap-1">
              {Object.values(SOUS_ESPACES).map((config) => (
                <li key={config.type}>
                  <Link
                    href={`/s-entraider/${config.slug}`}
                    className={cn(
                      'block rounded-sm px-3 py-2 text-sm text-text-1 hover:bg-surface-2',
                    )}
                  >
                    {config.titre}
                  </Link>
                </li>
              ))}
              <li className="px-3 py-2 text-sm text-text-4">
                SEL <span className="text-xs">(4.2)</span>
              </li>
              <li className="px-3 py-2 text-sm text-text-4">
                Marché solidaire <span className="text-xs">(4.3)</span>
              </li>
            </ul>
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </Container>
  );
}
