/**
 * Helpers de gestion du marqueur de démonstration (table `objet_demo`).
 *
 * Chantier V2.5.1 — Master Plan V2.6 Phase A.
 *
 * Trois usages :
 *
 * 1. `poserMarqueurDemo(table, id)` : appelé par `seed-demo.ts` après
 *    chaque INSERT pour marquer la ligne fraîchement créée. Idempotent
 *    (ON CONFLICT DO NOTHING via la PK composite).
 *
 * 2. `compterDemoParTable()` : utilisé par la page admin de la démo
 *    (compteurs par espace) et par `seed-demo.ts` au démarrage pour
 *    décider quoi seeder (skip si déjà fait).
 *
 * 3. `supprimerToutesLesDemos()` : appelée par la Server Action "Supprimer
 *    toute la démo" et par `seed-demo.ts --reset`. Itère sur la liste
 *    ordonnée des tables (cf. `tables-supportees.ts`), DELETE par batch,
 *    puis TRUNCATE de `objet_demo`. Les comptes auth.users démo sont
 *    supprimés à part (cf. note dans `tables-supportees.ts`).
 *
 * Sécurité : toutes les écritures passent par le client service_role
 * (`getSupabaseAdmin()`). Aucune de ces fonctions ne doit être appelée
 * depuis du code côté client.
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  TABLES_DEMO_ORDRE_SUPPRESSION,
  type TableDemo,
  estTableDemoSupportee,
} from './tables-supportees';

/**
 * Pose un marqueur démo sur une ligne fraîchement créée.
 *
 * Idempotent : si le marqueur existe déjà (même `(nom_table, id_ligne)`),
 * l'opération est silencieusement ignorée grâce à `ON CONFLICT DO NOTHING`.
 *
 * @throws si `nom_table` n'est pas dans la liste fermée (garde-fou contre
 *         les coquilles dans le script de seeding).
 */
export async function poserMarqueurDemo(nomTable: string, idLigne: string): Promise<void> {
  if (!estTableDemoSupportee(nomTable)) {
    throw new Error(
      `Table "${nomTable}" non supportée comme cible démo. Ajouter à TABLES_DEMO_ORDRE_SUPPRESSION dans lib/demo/tables-supportees.ts.`,
    );
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('objet_demo')
    .upsert({ nom_table: nomTable, id_ligne: idLigne }, { onConflict: 'nom_table,id_ligne' });
  if (error !== null) {
    throw new Error(`poserMarqueurDemo(${nomTable}, ${idLigne}) : ${error.message}`);
  }
}

/**
 * Vérifie si une ligne donnée est marquée comme démo. Lecture-seule, peut
 * être appelé depuis un Server Component.
 */
export async function estObjetDemo(nomTable: string, idLigne: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('objet_demo')
    .select('*', { count: 'exact', head: true })
    .eq('nom_table', nomTable)
    .eq('id_ligne', idLigne);
  if (error !== null) {
    throw new Error(`estObjetDemo(${nomTable}, ${idLigne}) : ${error.message}`);
  }
  return (count ?? 0) > 0;
}

/**
 * Retourne le nombre d'objets démo par table, dans l'ordre canonique défini
 * par `TABLES_DEMO_ORDRE_SUPPRESSION`. Les tables sans aucun objet démo sont
 * incluses avec un compte de 0 (utile pour l'UI admin qui affiche un état
 * complet).
 *
 * Une seule requête (GROUP BY côté serveur) + reconstruction côté TS.
 */
export async function compterDemoParTable(): Promise<Array<{ table: TableDemo; nombre: number }>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('objet_demo').select('nom_table');
  if (error !== null) {
    throw new Error(`compterDemoParTable : ${error.message}`);
  }
  const compteurs = new Map<string, number>();
  for (const ligne of data ?? []) {
    compteurs.set(ligne.nom_table, (compteurs.get(ligne.nom_table) ?? 0) + 1);
  }
  return TABLES_DEMO_ORDRE_SUPPRESSION.map((table) => ({
    table,
    nombre: compteurs.get(table) ?? 0,
  }));
}

/** Compte le nombre total d'objets démo, toutes tables confondues. */
export async function compterDemoTotal(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('objet_demo')
    .select('*', { count: 'exact', head: true });
  if (error !== null) {
    throw new Error(`compterDemoTotal : ${error.message}`);
  }
  return count ?? 0;
}

/**
 * Récupère les `id_ligne` marqués démo pour une table donnée. Utilisé par
 * la procédure de suppression : on lit la liste, puis on fait un seul
 * `DELETE WHERE id IN (...)` ciblé.
 */
export async function listerIdsDemo(nomTable: TableDemo): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('objet_demo')
    .select('id_ligne')
    .eq('nom_table', nomTable);
  if (error !== null) {
    throw new Error(`listerIdsDemo(${nomTable}) : ${error.message}`);
  }
  return (data ?? []).map((l) => l.id_ligne);
}

/**
 * Supprime toutes les données démo, dans l'ordre défini par
 * `TABLES_DEMO_ORDRE_SUPPRESSION` (enfants avant parents).
 *
 * Étapes :
 *  1. Pour chaque table de la liste, lire les `id_ligne` démo, puis
 *     DELETE WHERE id IN (...). La PK des tables métier est généralement
 *     `id uuid`, mais le helper utilise `id_ligne text` côté `objet_demo`
 *     (Supabase fait la conversion uuid <-> text automatiquement à l'IN).
 *  2. Cas spécial `personne` : avant le DELETE, récupérer les `user_id`
 *     liés, puis appeler `supabase.auth.admin.deleteUser` pour chaque
 *     compte auth.users (sinon ils restent orphelins).
 *  3. TRUNCATE de `objet_demo` à la fin.
 *
 * Retourne un récapitulatif (par table : nombre supprimé) pour l'UI admin.
 */
export async function supprimerToutesLesDemos(): Promise<{
  parTable: Array<{ table: TableDemo; supprimes: number }>;
  comptesAuthSupprimes: number;
  total: number;
}> {
  const supabase = getSupabaseAdmin();
  const recap: Array<{ table: TableDemo; supprimes: number }> = [];
  let total = 0;
  let comptesAuthSupprimes = 0;

  for (const table of TABLES_DEMO_ORDRE_SUPPRESSION) {
    const ids = await listerIdsDemo(table);
    if (ids.length === 0) {
      recap.push({ table, supprimes: 0 });
      continue;
    }

    // Cas spécial : `personne.id = auth.users.id` (FK avec ON DELETE
    // CASCADE, cf. migration 20260520120002_personne.sql). Donc supprimer
    // auth.users supprime personne automatiquement par cascade. On itère
    // sur chaque id et on appelle l'API admin Auth ; pas de DELETE direct
    // sur personne nécessaire.
    if (table === 'personne') {
      let supprimesIci = 0;
      for (const userId of ids) {
        const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
        if (authErr !== null) {
          // On ne stoppe pas : un échec sur un compte auth (déjà supprimé,
          // ou cassé) ne doit pas bloquer le nettoyage des autres.
          console.warn(`Suppression compte auth ${userId} échouée : ${authErr.message}`);
          continue;
        }
        supprimesIci += 1;
      }
      comptesAuthSupprimes += supprimesIci;
      recap.push({ table, supprimes: supprimesIci });
      total += supprimesIci;
      continue;
    }

    // Cas général : DELETE WHERE id IN (...).
    const { error } = await supabase.from(table).delete().in('id', ids);
    if (error !== null) {
      throw new Error(`DELETE ${table} démo : ${error.message}`);
    }
    recap.push({ table, supprimes: ids.length });
    total += ids.length;
  }

  // Nettoyer la table de marqueurs elle-même.
  const { error: truncErr } = await supabase.from('objet_demo').delete().neq('nom_table', '');
  if (truncErr !== null) {
    throw new Error(`Nettoyage objet_demo : ${truncErr.message}`);
  }

  return { parTable: recap, comptesAuthSupprimes, total };
}
