import { Container } from '@/components/ui';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
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
 *
 * Server Component asynchrone : le surtitre « Espace » est lu via la clé
 * CMS partagée des pages hub (hub.preheader.espace), avec fallback en dur.
 */
export default async function LayoutEntraide({ children }: { children: ReactNode }) {
  // Surtitre commun aux en-têtes d'espace (cf. /s-informer, /mobiliser, /agir).
  const preheader = await lireContenuEditorial('hub.preheader.espace', { valeurMd: 'Espace' });

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">{preheader.valeurMd}</p>
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">S’entraider</p>
      </header>

      {/* Sur mobile (colonne), le contenu (et donc le titre de la page)
          passe avant le sommaire latéral ; sur desktop (lg), le sommaire
          revient à gauche via les classes order-*. */}
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="order-2 lg:order-1 lg:w-56 lg:shrink-0">
          <nav aria-label="Sous-espaces S’entraider">
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
              <li>
                <Link
                  href="/s-entraider/sel"
                  className="block rounded-sm px-3 py-2 text-sm text-text-1 hover:bg-surface-2"
                >
                  SEL
                </Link>
              </li>
              <li>
                <Link
                  href="/s-entraider/marche"
                  className="block rounded-sm px-3 py-2 text-sm text-text-1 hover:bg-surface-2"
                >
                  Marché solidaire
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
        <main className="order-1 flex-1 lg:order-2">{children}</main>
      </div>
    </Container>
  );
}
