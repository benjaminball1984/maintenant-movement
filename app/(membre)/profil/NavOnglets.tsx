'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Onglets de navigation du profil. Une seule liste source de vérité,
 * cohérente avec la structure de dossiers (cf. 01_ARCHITECTURE.md §9).
 *
 * Client Component parce qu'on lit `usePathname()` pour marquer l'onglet
 * actif visuellement et via `aria-current`.
 */
const ONGLETS = [
  { slug: 'dashboard', libelle: 'Vue d’ensemble' },
  { slug: 'informations', libelle: 'Informations' },
  { slug: 'communes', libelle: 'Communes' },
  { slug: 'contributions', libelle: 'Contributions' },
  { slug: 'notifications', libelle: 'Notifications' },
  { slug: 'wallet', libelle: 'Wallet T99CP' },
  { slug: 'confidentialite', libelle: 'Confidentialité' },
] as const;

export function NavOnglets() {
  const chemin = usePathname();

  return (
    <nav
      aria-label="Sections du profil"
      className="overflow-x-auto border-b border-border bg-surface"
    >
      <ul className="mx-auto flex max-w-5xl gap-1 px-4 sm:px-6 lg:px-8">
        {ONGLETS.map((onglet) => {
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
