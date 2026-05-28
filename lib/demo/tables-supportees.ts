/**
 * Liste fermée des tables qui peuvent porter des données de démonstration.
 *
 * Chantier V2.5.1 (Master Plan V2.6 Phase A). Cette liste est utilisée par
 * deux endroits :
 *
 * 1. `scripts/seed-demo.ts` : pour savoir où poser les données + le marqueur
 *    `objet_demo` correspondant.
 *
 * 2. `lib/demo/marqueur.ts` (fonction `supprimerToutesLesDemos`) : pour
 *    boucler sur chaque table et faire un DELETE WHERE id IN (...) ciblé.
 *
 * Pourquoi une liste fermée et pas une lecture dynamique du `pg_class` :
 * la suppression touche des données réelles, donc on veut une liste auditée
 * à la revue de code. Ajouter une nouvelle table = un commit explicite ici.
 *
 * Ordre d'évaluation : par sécurité, les tables filles (qui ont des FK vers
 * d'autres tables démo) sont supprimées AVANT leurs parents. Concrètement,
 * les contenus produits par les 6 profils démo (publications, signatures,
 * etc.) sont supprimés avant la ligne `personne` elle-même.
 *
 * Cas particulier `personne` : la ligne `personne` a un FK vers `auth.users`.
 * `auth.users` n'est pas dans cette liste (schéma `auth`, hors `public`),
 * mais sa suppression est gérée à part par `marqueur.ts` qui appelle
 * `supabase.auth.admin.deleteUser(userId)` AVANT le DELETE final sur
 * `personne` (pour récupérer le `user_id` avant que la ligne disparaisse).
 */

/**
 * Liste ordonnée des tables marquables comme démo, des plus dépendantes aux
 * plus fondamentales. Le `seed-demo.ts` insère dans l'ordre inverse (parents
 * d'abord, enfants ensuite) ; la suppression suit cet ordre directement.
 */
export const TABLES_DEMO_ORDRE_SUPPRESSION = [
  // === Niveau 1 : contenus utilisateur (dépendent de personne + d'un espace) ===
  'reaction_reseau',
  'commentaire_reseau',
  'message_reseau',
  'post_reseau',
  'relation_reseau',
  'signature_petition',
  'don',
  'reponse_sondage',
  'participation_mobilisation',
  'participation_moment',
  'reservation',

  // === Niveau 2 : appartenances aux espaces (dépendent de personne + espace) ===
  'appartenance_commune',
  'appartenance_federation',
  'appartenance_gt',
  'appartenance_groupe_entraide_local',
  'appartenance_campagne',

  // === Niveau 3 : entités d'espace (dépendent d'un créateur personne) ===
  'petition',
  'mobilisation',
  'cagnotte',
  'sondage',
  'moment_solidaire',
  'campagne',
  'gt_thematique',
  'groupe_entraide_local',
  'offre_entraide',
  'service_sel',
  'journal_affiche',
  'commune',

  // === Niveau 4 : personnes (la racine humaine) ===
  // Le DELETE sur `personne` cascade naturellement vers les lignes
  // historiques internes (ex. journal_admin) selon les FK configurées
  // dans les migrations existantes. Le compte auth.users associé est
  // supprimé séparément via supabase.auth.admin.deleteUser().
  'personne',
] as const;

export type TableDemo = (typeof TABLES_DEMO_ORDRE_SUPPRESSION)[number];

/** Garde de validation : refuse une table inconnue à la pose d'un marqueur. */
export function estTableDemoSupportee(nomTable: string): nomTable is TableDemo {
  return (TABLES_DEMO_ORDRE_SUPPRESSION as readonly string[]).includes(nomTable);
}
