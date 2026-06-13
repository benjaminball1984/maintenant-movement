/**
 * Sites du réseau Demosphère en France (agendas militants locaux,
 * demande Ben 2026-06-13). Chaque sous-domaine `<ville>.demosphere.net`
 * expose les mêmes endpoints (cf. `lib/import-demosphere/importer`).
 *
 * Les sites hors France (Bruxelles, Liège, São Paulo, Würzburg,
 * Frankfurt) sont volontairement exclus : pour l'instant on n'importe que
 * les mobilisations en France (décision Ben). Un site dont l'endpoint
 * casse est simplement sauté (dégradation propre).
 */

export interface SiteDemosphere {
  /** Sous-domaine (ex. `paris`, `toulouse`). */
  cle: string;
  /** Nom affiché de l'agenda local. */
  nom: string;
}

/** Sous-domaines Demosphère en France (liste de la home + pied de page). */
export const SITES_DEMOSPHERE: SiteDemosphere[] = [
  { cle: 'paris', nom: 'Démosphère Paris/Île-de-France' },
  { cle: 'toulouse', nom: 'Démosphère Toulouse' },
  { cle: 'rennes', nom: 'Démosphère Rennes' },
  { cle: 'lille', nom: 'Démosphère Lille' },
  { cle: 'nice', nom: 'Démosphère Nice' },
  { cle: 'gironde', nom: 'Démosphère Gironde' },
  { cle: 'gard', nom: 'Démosphère Gard' },
  { cle: 'tarn', nom: 'Démosphère Tarn' },
  { cle: 'ariege', nom: 'Démosphère Ariège' },
  { cle: 'aveyron', nom: 'Démosphère Aveyron' },
  { cle: 'berry', nom: 'Démosphère Berry' },
  { cle: 'carcassonne', nom: 'Démosphère Carcassonne' },
  { cle: 'dunkerque', nom: 'Démosphère Dunkerque' },
  { cle: 'lot', nom: 'Démosphère Lot' },
  { cle: 'poitiers', nom: 'Démosphère Poitiers' },
  { cle: 'pyrenees', nom: 'Démosphère Pyrénées' },
  { cle: 'sarthe', nom: 'Démosphère Sarthe' },
  { cle: 'strasbourgfurieuse', nom: 'Démosphère Strasbourg' },
  { cle: '05', nom: 'Démosphère Hautes-Alpes' },
  { cle: '04', nom: 'Démosphère Alpes-de-Haute-Provence' },
  { cle: '63', nom: 'Démosphère Puy-de-Dôme' },
  { cle: 'limoges', nom: 'Démosphère Limoges' },
];

/** URL de base d'un site Demosphère. */
export function baseDemosphere(cle: string): string {
  return `https://${cle}.demosphere.net`;
}
