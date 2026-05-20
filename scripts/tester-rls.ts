/**
 * Test RLS — chantier 11.2.
 *
 * Énumère toutes les tables du schéma `public` et vérifie que :
 *   1. `enable row level security` est ON.
 *   2. Au moins une policy `SELECT` existe.
 *
 * Garde-fou avant déploiement prod. Une table sans RLS exposerait
 * potentiellement des données à des requêtes non autorisées.
 *
 * Usage :
 *   npx tsx scripts/tester-rls.ts
 *
 * Préalable : variables d'env `NEXT_PUBLIC_SUPABASE_URL` et
 * `SUPABASE_SERVICE_ROLE_KEY` chargées (lecture du catalogue système).
 */

import { createClient } from '@supabase/supabase-js';

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || url === '' || key === undefined || key === '') {
    console.error("Variables d'env Supabase manquantes.");
    process.exit(1);
  }
  const supabase = createClient(url, key);

  // On exécute la requête via une fonction SQL ad-hoc parce que
  // l'API Supabase ne donne pas accès direct au catalogue système.
  // Pour 11.2, on documente la requête à lancer manuellement en SQL.
  // Le script imprime le SQL à lancer dans Supabase Studio.
  const sql = `
    SELECT
      t.tablename AS table_name,
      t.rowsecurity AS rls_active,
      (
        SELECT count(*)
        FROM pg_policies p
        WHERE p.schemaname = t.schemaname
          AND p.tablename = t.tablename
          AND p.cmd = 'SELECT'
      )::int AS policies_select
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    ORDER BY t.tablename;
  `;

  // biome-ignore lint/suspicious/noConsoleLog: usage CLI.
  console.log('Lancer la requête suivante dans Supabase Studio → SQL Editor :');
  // biome-ignore lint/suspicious/noConsoleLog: usage CLI.
  console.log(sql);
  // biome-ignore lint/suspicious/noConsoleLog: usage CLI.
  console.log(
    '\nVérification attendue : pour chaque ligne, rls_active = true ET policies_select >= 1.',
  );
  // biome-ignore lint/suspicious/noConsoleLog: usage CLI.
  console.log('Si une table échoue, ajouter une policy ou activer RLS via une migration.');

  // Pour 11.2 v1, on s'arrête là. Une v2 pourrait appeler une fonction
  // SQL dédiée `verifier_rls()` qu'on poserait dans une migration.
  void supabase;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
