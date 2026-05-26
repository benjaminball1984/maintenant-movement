/**
 * Bibliothèque d'images par défaut du site Maintenant! (exigence transversale
 * ET1 du cycle V2, `docs/cdc-v2/01b-EXIGENCES-TRANSVERSALES-UI.md`).
 *
 * **Ce qu'est cette bibliothèque** : la matrice qui associe à chaque type
 * d'objet une image curée par l'admin, utilisée par défaut tant que la
 * personne qui crée l'objet n'a pas téléversé sa propre image. **Tout
 * objet partageable a TOUJOURS une image** : c'est ce qui rend le site
 * immédiatement beau au lancement, qui donne un aperçu de partage
 * (Open Graph) toujours présentable et qui garantit la cohérence visuelle.
 *
 * **Ce qu'elle n'est PAS** : un fallback technique en cas de bug. La
 * bibliothèque est délibérée, organisée par type d'objet, et son contenu
 * visuel relève d'une **décision politique et esthétique de Lilou/Ben**.
 *
 * État au chantier V2.0.3 (fondation) : les images réelles ne sont pas
 * encore curées. On installe ici la **structure** (la matrice de types, le
 * helper de résolution, des **placeholders SVG identifiables**) pour que
 * le système soit fonctionnel et que les chantiers suivants n'aient qu'à
 * remplacer un fichier dans `public/defaults/` quand Lilou/Ben fournira
 * les vraies images.
 *
 * Voir `docs/manifests/v2-0-3-fondations-ui-transversales.md` rubrique
 * « Contenus à arbitrer » pour la liste des images à fournir.
 */

/**
 * Catalogue des types d'objet du site connus à ce jour. Étendre la liste
 * (et la matrice ci-dessous) au moment d'introduire un nouveau type. Le
 * choix d'un type plutôt qu'un autre est une question éditoriale : c'est
 * ce qui détermine quelle image par défaut la personne verra.
 *
 * Cette union TypeScript ne reflète pas (encore) une colonne BDD : le
 * cycle V2 prévoit un tronc commun `Objet` avec une colonne `type_objet`,
 * mais cette convergence est reportée (cf. CLAUDE.md §0.3, interdit n°3).
 * En attendant, l'union sert d'**index de la matrice d'images par défaut**.
 */
export type TypeObjet =
  | 'petition'
  | 'mobilisation'
  | 'campagne'
  | 'cagnotte'
  | 'moment_solidaire'
  | 'offre_marche'
  | 'produit_marche'
  | 'boutique_marche'
  | 'minimarche_solidaire'
  | 'commune'
  | 'commune_libre'
  | 'federation'
  | 'confederation'
  | 'gt_thematique'
  | 'article'
  | 'sondage'
  | 'service_sel'
  | 'offre_entraide'
  | 'offre_transport'
  | 'offre_hebergement'
  | 'offre_pret'
  | 'organisation_partenaire'
  | 'profil'
  | 'generique';

/**
 * Liste exhaustive des types connus, utilisable pour itérer (validation,
 * page admin de curation des images, etc.).
 */
export const TYPES_OBJETS: readonly TypeObjet[] = [
  'petition',
  'mobilisation',
  'campagne',
  'cagnotte',
  'moment_solidaire',
  'offre_marche',
  'produit_marche',
  'boutique_marche',
  'minimarche_solidaire',
  'commune',
  'commune_libre',
  'federation',
  'confederation',
  'gt_thematique',
  'article',
  'sondage',
  'service_sel',
  'offre_entraide',
  'offre_transport',
  'offre_hebergement',
  'offre_pret',
  'organisation_partenaire',
  'profil',
  'generique',
] as const;

/**
 * Matrice : pour chaque type d'objet, le chemin (servi par Next.js depuis
 * `public/`) de l'image par défaut.
 *
 * Les valeurs pointent toutes vers `public/defaults/*.svg` à la date de
 * V2.0.3. Quand Lilou/Ben fournira des images JPEG/WebP curées, il
 * suffira de remplacer le fichier (même chemin) ou de pointer ici vers
 * un nouveau chemin. Aucun appelant n'a besoin de changer.
 */
export const IMAGES_DEFAUT: Record<TypeObjet, string> = {
  petition: '/defaults/petition.svg',
  mobilisation: '/defaults/mobilisation.svg',
  campagne: '/defaults/campagne.svg',
  cagnotte: '/defaults/cagnotte.svg',
  moment_solidaire: '/defaults/moment-solidaire.svg',
  offre_marche: '/defaults/offre-marche.svg',
  produit_marche: '/defaults/offre-marche.svg',
  boutique_marche: '/defaults/offre-marche.svg',
  minimarche_solidaire: '/defaults/offre-marche.svg',
  commune: '/defaults/commune.svg',
  commune_libre: '/defaults/commune.svg',
  federation: '/defaults/commune.svg',
  confederation: '/defaults/commune.svg',
  gt_thematique: '/defaults/gt-thematique.svg',
  article: '/defaults/article.svg',
  sondage: '/defaults/sondage.svg',
  service_sel: '/defaults/service-sel.svg',
  offre_entraide: '/defaults/offre-entraide.svg',
  offre_transport: '/defaults/offre-entraide.svg',
  offre_hebergement: '/defaults/offre-entraide.svg',
  offre_pret: '/defaults/offre-entraide.svg',
  organisation_partenaire: '/defaults/organisation.svg',
  profil: '/defaults/profil.svg',
  generique: '/defaults/generique.svg',
};

/**
 * Récupère le chemin de l'image par défaut pour un type. Si le type passé
 * n'est pas répertorié (ce qui ne devrait pas arriver avec le typage
 * strict, mais peut arriver si on lit une chaîne de la BDD), on retombe
 * sur `generique`.
 */
export function imageDefautPour(type: TypeObjet | string): string {
  if (type in IMAGES_DEFAUT) {
    return IMAGES_DEFAUT[type as TypeObjet];
  }
  return IMAGES_DEFAUT.generique;
}
