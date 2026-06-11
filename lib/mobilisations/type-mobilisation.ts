/**
 * Référentiel des types de mobilisation (revue 2026-06-11).
 *
 * Taxonomie maison de types d'ACTION (et non de catégories de luttes) :
 * chaque type porte un pictogramme dédié (icône lucide, le langage
 * iconographique du site) pour une reconnaissance immédiate dans les
 * listes, fiches, agenda et cartes.
 */

export type TypeMobilisation =
  | 'manifestation'
  | 'rassemblement'
  | 'blocage_greve'
  | 'assemblee_reunion'
  | 'projection_debat'
  | 'concert_fete'
  | 'formation_atelier'
  | 'occupation_village'
  | 'autre';

/** Liste ordonnée pour les formulaires (l'ordre est celui du menu). */
export const TYPES_MOBILISATION: ReadonlyArray<TypeMobilisation> = [
  'manifestation',
  'rassemblement',
  'blocage_greve',
  'assemblee_reunion',
  'projection_debat',
  'concert_fete',
  'formation_atelier',
  'occupation_village',
  'autre',
] as const;

/** Libellés humains affichés à côté du pictogramme. */
export const LIBELLE_TYPE_MOBILISATION: Record<TypeMobilisation, string> = {
  manifestation: 'Manifestation',
  rassemblement: 'Rassemblement',
  blocage_greve: 'Blocage / grève',
  assemblee_reunion: 'Assemblée / réunion',
  projection_debat: 'Projection / débat',
  concert_fete: 'Concert / fête',
  formation_atelier: 'Formation / atelier',
  occupation_village: 'Occupation / village',
  autre: 'Autre action',
};

/**
 * Garde de validation : retourne le type s'il est connu, null sinon.
 * Pratique pour normaliser une valeur venant d'un import ou d'un form.
 */
export function typeMobilisationOuNull(valeur: string | null | undefined): TypeMobilisation | null {
  if (valeur === null || valeur === undefined) return null;
  return (TYPES_MOBILISATION as ReadonlyArray<string>).includes(valeur)
    ? (valeur as TypeMobilisation)
    : null;
}
