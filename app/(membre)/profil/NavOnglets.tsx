'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Onglets de navigation du profil. Une seule liste source de verite,
 * coherente avec la structure de dossiers (cf. 01_ARCHITECTURE.md §9).
 *
 * Client Component parce qu'on lit `usePathname()` pour marquer l'onglet
 * actif visuellement et via `aria-current`. Les libelles sont passes en
 * props par le layout parent (Server Component) qui les lit depuis le CMS.
 *
 * Onglet « Wallet T99CP » retire au chantier V2.1.1 : §19 du cycle V2
 * proscrit tout wallet integre cote plateforme. Le 99-coin se gere
 * entierement a l'exterieur (redirection vers `the99coinproject.org`).
 */
export interface OngletConfig {
  slug: string;
  libelle: string;
}

export function NavOnglets({ onglets }: { onglets: ReadonlyArray<OngletConfig> }) {
  const chemin = usePathname();

  return (
    <nav
      aria-label="Sections du profil"
      className="overflow-x-auto border-b border-border bg-surface"
    >
      <ul className="mx-auto flex max-w-5xl gap-1 px-4 sm:px-6 lg:px-8">
        {onglets.map((onglet) => {
          const href = `/profil/${onglet.slug}`;
          const estActif = chemin === href;
          return (
            <li key={onglet.slug}>
              <Link
                href={href}
                aria-current={estActif ? 'page' : undefined}
                className={cn(
                  'inline-flex h-12 items-center border-b-2 px-3 text-sm font-medium transition-colors duration-fast',
                  estActif
                    ? 'border-brand text-brand'
                    : 'border-transparent text-text-2 hover:text-text-1',
                )}
              >
                {onglet.libelle}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
