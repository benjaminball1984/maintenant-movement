import { OPTIONS_LOGEMENT, QUESTIONS_PAR_CLE } from '@/lib/sondages/qualification';

/**
 * Marges de référence des sondages : la part RÉELLE de chaque modalité dans la
 * population française, par variable. C'est le socle du redressement par quotas
 * (calage sur marges / raking) : on compare la structure des répondant·es à ces
 * cibles et on pondère.
 *
 * Collecte multi-agents sourcée du 2026-06-14 (INSEE, ministère de l'Intérieur
 * pour les résultats électoraux, CEVIPOF, DARES, CRÉDOC), validée par Ben.
 * Détail complet, sources et notes : `docs/sondages-marges-reference.md`.
 *
 * IMPORTANT — anti-désynchronisation : les `cibles` sont des TABLEAUX alignés
 * sur l'ORDRE des `options` de chaque question dans `qualification.ts`
 * (cibles[i] = part de options[i]). `null` = modalité non redressée (« Ne
 * souhaite pas répondre », modalité sans référence nationale, abstention/blanc
 * pour les votes). Le test `marges-reference.test.ts` vérifie que chaque
 * tableau a la même longueur que les options : si une option est ajoutée /
 * réordonnée sans mettre à jour la cible, le test casse.
 *
 * Les parts ne somment pas toujours exactement à 1 (arrondis, modalités
 * résiduelles non mesurées) : le moteur NORMALISE les cibles non nulles à
 * somme 1 avant de pondérer (cf. `margesNormalisees`).
 */

export interface MargeVariable {
  /** Clé de la question (`profil_qualification.question_cle`). */
  cle: string;
  /** Année de la donnée de référence. */
  annee: string;
  /** Institution + référence courte. */
  source: string;
  /** True si la variable sert au calage (raking) ; false = analyse/croisements seulement. */
  redressement: boolean;
  /** Part cible par option, alignée sur l'ordre des options (null = non redressée). */
  cibles: (number | null)[];
  /** Réserve méthodologique éventuelle. */
  note?: string;
}

const pct = (...valeurs: (number | null)[]): (number | null)[] =>
  valeurs.map((v) => (v === null ? null : v / 100));

export const MARGES_REFERENCE: MargeVariable[] = [
  {
    cle: 'genre',
    annee: '2026',
    source: 'INSEE, estimations de population (18 ans et plus)',
    redressement: true,
    // Homme, Femme, Non binaire, Autre
    cibles: pct(47.8, 52.2, null, null),
    note: 'Aucune statistique officielle pour « Non binaire » / « Autre » → non redressées (poids neutre).',
  },
  {
    cle: 'tranche_age_fine',
    annee: '2026',
    source: 'INSEE, estimations de population au 1er janvier 2026 (15 ans et plus)',
    redressement: true,
    // 15-17, 18-24, 25-34, 35-49, 50-64, 65-74, 75+
    cibles: pct(4.8, 10.6, 15.1, 16.1, 24.7, 14.3, 14.4),
  },
  {
    cle: 'csp',
    annee: '2023',
    source: 'INSEE, enquête Emploi / recensement (population 15 ans et plus)',
    redressement: true,
    // agri, artisan, cadre, prof. interm., employé, ouvrier, retraité, étudiant, sans activité, NSPP
    cibles: pct(0.8, 3.5, 11, 13, 14, 11.7, 28, 9, 9, null),
  },
  {
    cle: 'diplome',
    annee: '2022',
    source: 'INSEE, recensement (population non scolarisée 15 ans et plus)',
    redressement: true,
    // aucun, CEP/brevet, CAP-BEP, bac, bac+2, bac+3/4, bac+5, en cours, NSPP
    cibles: pct(25, 6, 22, 17, 11, 9, 10, null, null),
  },
  {
    cle: 'revenu_foyer',
    annee: '2024 (extrapolé 2015)',
    source: 'INSEE, distribution du revenu disponible des ménages',
    redressement: true,
    // <650, 650-999, 1000-1499, 1500-1999, 2000-2499, 2500-2999, 3000-3999, 4000-5999, 6000+, NSPP
    cibles: pct(5, 3, 6, 14, 12, 11, 18, 19, 12, null),
    note: 'Marge la plus fragile (structure extrapolée de 2015) : point de départ, à réactualiser.',
  },
  {
    cle: 'logement',
    annee: '2025',
    source: 'INSEE, statut d’occupation des logements (enquête Logement)',
    redressement: true,
    // 6 postes (OPTIONS_LOGEMENT) + NSPP
    cibles: [...OPTIONS_LOGEMENT.map((o) => o.partCible), null],
  },
  {
    cle: 'type_commune',
    annee: '2021',
    source: 'INSEE, grille communale de densité',
    redressement: true,
    // grande ville, ville moyenne, petite ville, banlieue, village, rural isolé, NSPP
    cibles: pct(38, 17, 9, 4, 28, 4, null),
  },
  {
    cle: 'region_residence',
    annee: '2023',
    source: 'INSEE, populations légales par région',
    redressement: true,
    // 13 métropole (ordre alpha) + 5 DROM + Hors de France + NSPP
    cibles: pct(
      12.01,
      4.1,
      5.05,
      3.78,
      0.52,
      8.14,
      8.77,
      18.23,
      4.9,
      9,
      8.96,
      5.72,
      7.64,
      0.56,
      0.53,
      0.43,
      1.3,
      0.38,
      null,
      null,
    ),
  },
  {
    cle: 'situation_maritale',
    annee: '2017-2020',
    source: 'INSEE, état matrimonial et type d’union',
    redressement: true,
    // marié, pacsé, union libre, célibataire, divorcé, veuf, NSPP
    cibles: pct(43, 4, 13, 23, 9, 7.5, null),
  },
  {
    cle: 'composition_foyer',
    annee: '2021',
    source: 'INSEE, structure des ménages',
    redressement: true,
    // seul, couple sans enfant, couple avec enfant, monoparentale, chez parents, coloc, autre, NSPP
    cibles: pct(38, 25, 24, 9.5, null, null, null, null),
    note: 'Chez les parents / colocation / autre : pas de référence ménage INSEE → non redressées.',
  },
  {
    cle: 'secteur_activite',
    annee: '2023-2024',
    source: 'INSEE / DARES, secteur employeur',
    redressement: true,
    // public, privé, ESS, indépendant, jamais travaillé, NSPP
    cibles: pct(19, 60, 9, 11, null, null),
    note: 'L’ESS chevauche le privé dans la nomenclature INSEE ; isolée ici par choix éditorial (Ben).',
  },
  {
    cle: 'patrimoine',
    annee: '2024',
    source: 'INSEE, enquête Patrimoine',
    redressement: true,
    // aucune épargne, précaution, confortable, immobilier locatif, NSPP
    cibles: pct(13, 37, 30, 20, null),
  },
  {
    cle: 'aisance_financiere',
    annee: '2024',
    source: 'CRÉDOC, conditions de vie',
    redressement: true,
    // confortable, ça va, c'est juste, difficilement, sans s'endetter, NSPP
    cibles: pct(5, 43, 35, 7, 10, null),
  },
  {
    cle: 'presidentielle_2022',
    annee: '2022',
    source: 'Ministère de l’Intérieur, présidentielle 1er tour (% suffrages exprimés)',
    redressement: true,
    // 12 candidat·es (ordre du bulletin) + blanc/nul, abstention, pas en âge, NSPP
    cibles: pct(
      0.56,
      2.06,
      1.75,
      4.63,
      3.13,
      23.15,
      27.85,
      21.95,
      4.78,
      0.77,
      2.28,
      7.07,
      null,
      null,
      null,
      null,
    ),
    note: 'Calage sur le vote réel : neutralise la sur/sous-déclaration. Abstention 2022 T1 ≈ 26 %.',
  },
  {
    cle: 'presidentielle_2022_t2',
    annee: '2022',
    source: 'Ministère de l’Intérieur, présidentielle 2nd tour (% suffrages exprimés)',
    redressement: true,
    // Macron, Le Pen, blanc/nul, abstention, pas en âge, NSPP
    cibles: pct(58.54, 41.46, null, null, null, null),
  },
  {
    cle: 'gauche_droite',
    annee: '2025',
    source: 'CEVIPOF, auto-positionnement gauche-droite (tranches réparties)',
    redressement: true,
    // 0..10 + « Cet axe ne veut rien dire pour moi »
    cibles: pct(2, 2, 7, 7, 11, 11, 11, 9, 9, 5, 5, 21),
    note: 'Référence par tranches (0-1, 2-3, 4-6, 7-8, 9-10) répartie sur les points individuels.',
  },
];

/** Accès direct à une marge par clé de variable. */
export const MARGES_PAR_CLE: ReadonlyMap<string, MargeVariable> = new Map(
  MARGES_REFERENCE.map((m) => [m.cle, m]),
);

/** Clés des variables utilisables pour le calage (raking). */
export const CLES_REDRESSEMENT: string[] = MARGES_REFERENCE.filter((m) => m.redressement).map(
  (m) => m.cle,
);

/**
 * Cibles normalisées (somme = 1 sur les modalités mesurées) d'une variable,
 * indexées par le LIBELLÉ exact de l'option. Les modalités `null` sont exclues.
 * Retourne null si la variable est inconnue ou sans option correspondante.
 */
export function margesNormalisees(cle: string): Map<string, number> | null {
  const marge = MARGES_PAR_CLE.get(cle);
  const question = QUESTIONS_PAR_CLE.get(cle);
  if (marge === undefined || question === undefined) return null;
  const total = marge.cibles.reduce<number>((s, c) => s + (c ?? 0), 0);
  if (total <= 0) return null;
  const map = new Map<string, number>();
  question.options.forEach((libelle, i) => {
    const c = marge.cibles[i];
    if (c !== null && c !== undefined) map.set(libelle, c / total);
  });
  return map;
}

/** Part cible (normalisée) d'une réponse donnée, ou null si non redressée. */
export function cibleParReponse(cle: string, reponse: string): number | null {
  return margesNormalisees(cle)?.get(reponse) ?? null;
}
