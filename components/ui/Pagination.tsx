import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Composant Pagination (V2.4.58).
 *
 * Affiche une barre de navigation Page précédente / pages numériques /
 * Page suivante. Préserve les paramètres de recherche existants
 * (`?q=&statut=...`) en injectant juste `?page=N`.
 *
 * Server Component, pas de state. Branché sur `lib/pagination.ts`.
 *
 * Si nbPages <= 1, rend null (rien à paginer).
 */

export interface PaginationProps {
  page: number;
  nbPages: number;
  /** Chemin de base (sans query string). Ex : `/admin/national/personnes`. */
  href: string;
  /** Paramètres à préserver (sauf `page`). Map clé → valeur string. */
  paramsAPreserver?: Record<string, string>;
  /** Nombre de pages numériques à afficher autour de la courante. Défaut 2. */
  fenetreAutour?: number;
}

function lienVersPage(
  href: string,
  page: number,
  paramsAPreserver: Record<string, string> = {},
): string {
  const sp = new URLSearchParams();
  for (const [cle, val] of Object.entries(paramsAPreserver)) {
    if (val !== '' && cle !== 'page') sp.set(cle, val);
  }
  sp.set('page', String(page));
  return `${href}?${sp.toString()}`;
}

function calculerPagesAffichees(
  page: number,
  nbPages: number,
  fenetre: number,
): Array<number | 'ellipsis'> {
  if (nbPages <= 7 + fenetre * 2) {
    return Array.from({ length: nbPages }, (_, i) => i + 1);
  }
  const debut = Math.max(2, page - fenetre);
  const fin = Math.min(nbPages - 1, page + fenetre);
  const pages: Array<number | 'ellipsis'> = [1];
  if (debut > 2) pages.push('ellipsis');
  for (let i = debut; i <= fin; i++) pages.push(i);
  if (fin < nbPages - 1) pages.push('ellipsis');
  pages.push(nbPages);
  return pages;
}

export function Pagination({
  page,
  nbPages,
  href,
  paramsAPreserver = {},
  fenetreAutour = 2,
}: PaginationProps) {
  if (nbPages <= 1) return null;
  const pages = calculerPagesAffichees(page, nbPages, fenetreAutour);
  const aPrecedente = page > 1;
  const aSuivante = page < nbPages;

  const styleNum = 'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm';
  const styleActif = `${styleNum} bg-brand font-bold text-white`;
  const styleInactif = `${styleNum} text-text-2 hover:bg-surface-2 hover:text-text-1`;
  const styleDisabled = `${styleNum} cursor-not-allowed text-text-3 opacity-50`;

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-1">
      {aPrecedente ? (
        <Link
          href={lienVersPage(href, page - 1, paramsAPreserver)}
          className={styleInactif}
          aria-label="Page précédente"
          rel="prev"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </Link>
      ) : (
        <span className={styleDisabled} aria-hidden="true">
          <ChevronLeft size={16} />
        </span>
      )}

      {pages.map((p, idx) => {
        if (p === 'ellipsis') {
          // Clé stable basée sur la position (avant/après le bloc central).
          // Il ne peut y avoir au plus 2 ellipses (une à gauche, une à droite).
          const cle = idx < pages.length / 2 ? 'ell-gauche' : 'ell-droite';
          return (
            <span key={cle} className="px-1 text-text-3 text-sm" aria-hidden="true">
              …
            </span>
          );
        }
        if (p === page) {
          return (
            <span key={p} className={styleActif} aria-current="page">
              {p}
            </span>
          );
        }
        return (
          <Link
            key={p}
            href={lienVersPage(href, p, paramsAPreserver)}
            className={styleInactif}
            aria-label={`Page ${p}`}
          >
            {p}
          </Link>
        );
      })}

      {aSuivante ? (
        <Link
          href={lienVersPage(href, page + 1, paramsAPreserver)}
          className={styleInactif}
          aria-label="Page suivante"
          rel="next"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      ) : (
        <span className={styleDisabled} aria-hidden="true">
          <ChevronRight size={16} />
        </span>
      )}
    </nav>
  );
}
