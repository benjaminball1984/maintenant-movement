/**
 * Applique du SQL sur le projet Supabase distant via l'API Management
 * (https://api.supabase.com), authentifiée par `SUPABASE_ACCESS_TOKEN`.
 *
 * Utile quand la CLI `supabase` n'est pas disponible dans l'environnement
 * (pas de `supabase db push` possible). À réserver aux migrations et aux
 * vérifications ponctuelles : c'est un accès privilégié au schéma.
 *
 * Usage (charger l'env avec --env-file) :
 *   node --env-file=.env.local --import tsx scripts/appliquer-sql-distant.ts --query "select 1 as ok"
 *   node --env-file=.env.local --import tsx scripts/appliquer-sql-distant.ts supabase/migrations/AAA.sql supabase/migrations/BBB.sql
 *
 * Le `--query` exécute une requête unique et imprime le résultat JSON
 * (pratique pour des contrôles en lecture). Les chemins de fichiers
 * appliquent chaque fichier SQL dans l'ordre.
 */

import { readFileSync } from 'node:fs';

function refDepuisUrl(url: string): string {
  return new URL(url).hostname.split('.')[0] ?? '';
}

async function executerSql(ref: string, token: string, sql: string): Promise<string> {
  const reponse = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const texte = await reponse.text();
  if (!reponse.ok) {
    throw new Error(`HTTP ${reponse.status} : ${texte}`);
  }
  return texte;
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (url === undefined || url === '' || token === undefined || token === '') {
    console.error(
      'NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_ACCESS_TOKEN manquant (charger --env-file).',
    );
    process.exit(1);
  }
  const ref = refDepuisUrl(url);
  const args = process.argv.slice(2);

  const iQuery = args.indexOf('--query');
  if (iQuery >= 0) {
    const sql = args[iQuery + 1] ?? '';
    // biome-ignore lint/suspicious/noConsoleLog: sortie CLI volontaire.
    console.log(await executerSql(ref, token, sql));
    return;
  }

  if (args.length === 0) {
    console.error('Rien à faire : fournir --query "SQL" ou des chemins de fichiers .sql.');
    process.exit(1);
  }

  for (const fichier of args) {
    const sql = readFileSync(fichier, 'utf-8');
    process.stdout.write(`Application ${fichier} ... `);
    await executerSql(ref, token, sql);
    // biome-ignore lint/suspicious/noConsoleLog: sortie CLI volontaire.
    console.log('OK');
  }
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
