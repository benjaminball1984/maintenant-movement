/**
 * Helpers de pagination (V2.4.55).
 *
 * Convention : pages numérotées à partir de 1 (1, 2, 3…), pas 0. Le
 * SDK Supabase utilise des offsets `range(debut, fin)` 0-indexés ; on
 * traduit ici.
 *
 * Pur, testable, sans dépendance.
 */

export interface ResultatPagination {
  /** Page courante (1-indexée, normalisée dans [1, nbPagesMax]). */
  page: number;
  /** Nombre total de pages (au moins 1, même si rien à afficher). */
  nbPages: number;
  /** Offset du premier élément (0-indexé, pour `range(debutIdx, finIdx)`). */
  debutIdx: number;
  /** Offset du dernier élément inclus (0-indexé). */
  finIdx: number;
  /** True si on peut aller à la page précédente. */
  aPagePrecedente: boolean;
  /** True si on peut aller à la page suivante. */
  aPageSuivante: boolean;
}

/**
 * Calcule les paramètres de pagination à partir du total connu.
 *
 * @example paginer({ page: 1, parPage: 20, total: 100 })
 *   → { page: 1, nbPages: 5, debutIdx: 0, finIdx: 19, aPagePrecedente: false, aPageSuivante: true }
 *
 * @example paginer({ page: 999, parPage: 20, total: 100 })
 *   → page clampée à 5
 */
export function paginer(opts: {
  page: number;
  parPage: number;
  total: number;
}): ResultatPagination {
  const parPage = Math.max(1, Math.floor(opts.parPage));
  const total = Math.max(0, Math.floor(opts.total));
  const nbPages = Math.max(1, Math.ceil(total / parPage));
  const page = Math.min(Math.max(1, Math.floor(opts.page)), nbPages);
  const debutIdx = (page - 1) * parPage;
  const finIdx = Math.min(debutIdx + parPage - 1, total - 1);
  return {
    page,
    nbPages,
    debutIdx,
    finIdx: Math.max(debutIdx, finIdx),
    aPagePrecedente: page > 1,
    aPageSuivante: page < nbPages,
  };
}

/**
 * Lit la page d'une URLSearchParams ou objet équivalent. Retourne 1
 * si absent ou invalide (NaN, négatif, 0).
 */
export function lirePageDepuisParams(
  searchParams: { page?: string | undefined } | URLSearchParams,
): number {
  const v =
    searchParams instanceof URLSearchParams
      ? searchParams.get('page')
      : (searchParams.page ?? null);
  if (v === null || v === undefined) return 1;
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n) || n < 1) return 1;
  return n;
}
