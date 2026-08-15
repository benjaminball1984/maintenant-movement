import type { CandidatCagnotte } from '@/lib/import-cagnottes/types';

/**
 * Curation des candidats : dédoublonnage + filtre de pertinence. Les
 * recherches sur les plateformes sont volontairement larges (la recherche
 * Ulule est floue) ; on resserre ici sur ce qui touche réellement une cause
 * du mouvement, le reste étant de toute façon soumis à la modération a priori.
 */

/** Types de collecte intrinsèquement solidaires (gardés même sans thème). */
const TYPES_SOLIDAIRES = new Set(['caisse_greve', 'cantine']);

/** Une collecte est pertinente si elle porte un thème OU est solidaire. */
export function estPertinent(c: CandidatCagnotte): boolean {
  return c.themes.length > 0 || (c.type_collecte !== null && TYPES_SOLIDAIRES.has(c.type_collecte));
}

/** Dédoublonne par `source_url` (garde la première occurrence). */
export function dedupParUrl(candidats: CandidatCagnotte[]): CandidatCagnotte[] {
  const vus = new Set<string>();
  const out: CandidatCagnotte[] = [];
  for (const c of candidats) {
    if (vus.has(c.source_url)) continue;
    vus.add(c.source_url);
    out.push(c);
  }
  return out;
}

/** Pipeline complet : dédoublonnage puis filtre de pertinence. */
export function curer(candidats: CandidatCagnotte[]): CandidatCagnotte[] {
  return dedupParUrl(candidats).filter(estPertinent);
}
