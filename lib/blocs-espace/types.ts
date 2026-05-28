/**
 * Types des blocs personnalisables d'espace collectif (V2.5.5).
 *
 * Quatre types supportés en V2.5.5, alignés sur le CHECK SQL :
 *   - `texte`   : Markdown léger
 *   - `image`   : URL + alt + légende optionnelle
 *   - `lien`    : URL + libellé + indication interne/externe
 *   - `bouton`  : URL + libellé + variante de bouton
 *
 * Pour ajouter un type : étendre `TypeBloc`, ajouter un schéma Zod
 * dans `validation.ts`, un composant de rendu dans `components/blocs/`,
 * et mettre à jour la CHECK SQL en migration additive.
 */

export type TypeBloc = 'texte' | 'image' | 'lien' | 'bouton';

export type TypeEspace =
  | 'commune'
  | 'federation'
  | 'confederation'
  | 'gt_thematique'
  | 'groupe_entraide_local'
  | 'campagne';

export interface ContenuBlocTexte {
  texte: string;
}

export interface ContenuBlocImage {
  url: string;
  alt: string;
  legende?: string;
}

export interface ContenuBlocLien {
  url: string;
  libelle: string;
  externe?: boolean;
}

export interface ContenuBlocBouton {
  url: string;
  libelle: string;
  variante?: 'primary' | 'ghost' | 'outline';
}

/**
 * Union discriminée par `type`. Le contenu JSON typé permet à
 * `RenduBlocsEspace` de dispatcher proprement vers le bon composant.
 */
export type BlocEspaceDecode =
  | { type: 'texte'; contenu: ContenuBlocTexte }
  | { type: 'image'; contenu: ContenuBlocImage }
  | { type: 'lien'; contenu: ContenuBlocLien }
  | { type: 'bouton'; contenu: ContenuBlocBouton };
