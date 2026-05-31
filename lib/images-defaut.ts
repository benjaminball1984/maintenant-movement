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
 * État au chantier V2.6.27 : la plupart des types pointent désormais vers de
 * **vraies photos curées** (Unsplash, licence libre sans attribution),
 * téléchargées dans `public/defaults/*.jpg` par le script
 * `scripts/telecharger-images-defaut.ts`. Seuls `profil` et `generique`
 * restent des SVG de repli (avatar et visuel neutre). Pour remplacer une
 * image, soit déposer un fichier au même chemin, soit changer l'identifiant
 * de photo dans le script et le relancer. Aucun appelant n'a besoin de changer.
 *
 * (Fondation initiale au V2.0.3 : placeholders SVG, voir
 * `docs/manifests/v2-0-3-fondations-ui-transversales.md`.)
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
 * Les valeurs pointent vers `public/defaults/*.jpg` (photos curées) sauf
 * `profil` et `generique` restés en `.svg`. Pour changer une image, remplacer
 * le fichier (même chemin) ou pointer ici vers un nouveau chemin. Aucun
 * appelant n'a besoin de changer.
 */
export const IMAGES_DEFAUT: Record<TypeObjet, string> = {
  petition: '/defaults/petition.jpg',
  mobilisation: '/defaults/mobilisation.jpg',
  campagne: '/defaults/campagne.jpg',
  cagnotte: '/defaults/cagnotte.jpg',
  moment_solidaire: '/defaults/moment-solidaire.jpg',
  offre_marche: '/defaults/offre-marche.jpg',
  produit_marche: '/defaults/offre-marche.jpg',
  boutique_marche: '/defaults/offre-marche.jpg',
  minimarche_solidaire: '/defaults/offre-marche.jpg',
  commune: '/defaults/commune.jpg',
  commune_libre: '/defaults/commune.jpg',
  federation: '/defaults/commune.jpg',
  confederation: '/defaults/commune.jpg',
  gt_thematique: '/defaults/gt-thematique.jpg',
  article: '/defaults/article.jpg',
  sondage: '/defaults/sondage.jpg',
  service_sel: '/defaults/service-sel.jpg',
  offre_entraide: '/defaults/offre-entraide.jpg',
  offre_transport: '/defaults/offre-entraide.jpg',
  offre_hebergement: '/defaults/offre-entraide.jpg',
  offre_pret: '/defaults/offre-entraide.jpg',
  organisation_partenaire: '/defaults/organisation.jpg',
  // profil et generique restent en SVG : avatar et visuel neutre de repli,
  // pas des photos de scène (cf. chantier V2.6.27).
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
