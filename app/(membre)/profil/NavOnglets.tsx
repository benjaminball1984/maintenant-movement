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
/**
 * Onglet « Wallet T99CP » retiré au chantier V2.1.1 : §19 du cycle V2
 * proscrit tout wallet intégré côté plateforme. Le 99-coin se gère
 * entièrement à l'extérieur (redirection vers la home `the99coinproject.org`).
 * Le solde T99CP de la personne sera réintroduit dans un chantier V2 dédié
 * en lecture seule, via l'adapter `lib/t99cp/`, dans l'onglet
 * « Contributions » ou un nouvel onglet « 99-coin ».
 */
const ONGLETS = [
  { slug: 'dashboard', libelle: 'Vue d’ensemble' },
  { slug: 'informations', libelle: 'Informations' },
  { slug: 'communes', libelle: 'Communes' },
  { slug: 'contributions', libelle: 'Contributions' },
  { slug: 'reservations', libelle: 'Mes réservations' },
  { slug: 'demandes-reservations', libelle: 'Demandes reçues' },
  { slug: 'notifications', libelle: 'Notifications' },
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
