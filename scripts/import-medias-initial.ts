/**
 * Peuplement initial de la revue de presse multi-format (demande Ben
 * 2026-06-13) : podcasts, vidéos, lives, dessins de presse. Importe le
 * contenu le plus récent de chaque source (jusqu'à une source par
 * contenu), pour chacun des quatre formats.
 *
 * Usage :
 *   npx tsx scripts/import-medias-initial.ts --dry-run   (rapport, zéro écriture)
 *   npx tsx scripts/import-medias-initial.ts --confirm   (images bucket + insert)
 *   (option : --format=podcast|video|live|dessin pour ne traiter qu'un format)
 *
 * Variables : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
 * (charger par exemple avec `node --env-file=.env.local`).
 */

import { importerFormat } from '../lib/import-medias/importer-medias';
import { type FormatMedia, SOURCES_PAR_FORMAT } from '../lib/import-medias/sources-medias';

const estDryRun = process.argv.includes('--dry-run');
const estConfirme = process.argv.includes('--confirm');
if (!estDryRun && !estConfirme) {
  console.error('Préciser --dry-run ou --confirm.');
  process.exit(1);
}
const argFormat = process.argv.find((a) => a.startsWith('--format='))?.split('=')[1];
const FORMATS: FormatMedia[] = ['podcast', 'video', 'live', 'dessin'];
const formats = argFormat ? FORMATS.filter((f) => f === argFormat) : FORMATS;

async function main(): Promise<void> {
  const urlSb = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (urlSb === undefined || urlSb === '' || cle === undefined || cle === '') {
    console.error('Variables Supabase manquantes (charger --env-file=.env.local).');
    process.exit(1);
  }

  if (estDryRun) {
    for (const format of formats) {
      const n = SOURCES_PAR_FORMAT[format].length;
      console.log(`${format} : ${n} sources, cible ${n} (1 contenu récent par source).`);
    }
    console.log('\n[DRY-RUN] Aucune écriture. Relancer avec --confirm.');
    return;
  }

  for (const format of formats) {
    const cible = SOURCES_PAR_FORMAT[format].length;
    console.log(`\n=== ${format.toUpperCase()} (cible ${cible}) ===`);
    const rapport = await importerFormat(format, urlSb, cle, cible);
    for (const c of rapport.crees) console.log(`OK ${c}`);
    console.log(`${rapport.crees.length} créés, ${rapport.echecs.length} écartés.`);
    for (const e of rapport.echecs) console.log(`  - ${e}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
