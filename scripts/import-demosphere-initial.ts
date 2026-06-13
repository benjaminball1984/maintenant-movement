/**
 * Peuplement initial des mobilisations Demosphère (demande Ben
 * 2026-06-13) : pour chaque site Demosphère de France, importe TOUS les
 * événements à venir qui ont une affiche (exhaustivité demandée).
 *
 * Usage :
 *   npx tsx scripts/import-demosphere-initial.ts --dry-run
 *   npx tsx scripts/import-demosphere-initial.ts --confirm
 *   (option : --site=toulouse pour ne traiter qu'un site ; --max=N)
 *
 * Variables : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.
 */

import {
  importerSiteDemosphere,
  liensDemosphereExistants,
  listerEvenementsSite,
} from '../lib/import-demosphere/importer-demosphere';
import { SITES_DEMOSPHERE } from '../lib/import-demosphere/sources-demosphere';

const estDryRun = process.argv.includes('--dry-run');
const estConfirme = process.argv.includes('--confirm');
if (!estDryRun && !estConfirme) {
  console.error('Préciser --dry-run ou --confirm.');
  process.exit(1);
}
const argSite = process.argv.find((a) => a.startsWith('--site='))?.split('=')[1];
const argMax = Number(process.argv.find((a) => a.startsWith('--max='))?.split('=')[1] ?? '100');
const sites = argSite ? SITES_DEMOSPHERE.filter((s) => s.cle === argSite) : SITES_DEMOSPHERE;

async function main(): Promise<void> {
  const urlSb = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (urlSb === undefined || urlSb === '' || cle === undefined || cle === '') {
    console.error('Variables Supabase manquantes (charger --env-file=.env.local).');
    process.exit(1);
  }

  const maintenantSec = Math.floor(Date.now() / 1000);
  const finSec = maintenantSec + 365 * 24 * 3600;

  if (estDryRun) {
    for (const site of sites) {
      try {
        const evs = await listerEvenementsSite(site, maintenantSec, finSec);
        const geo = evs.filter((e) => e.latitude !== null).length;
        console.log(`${site.cle} : ${evs.length} événements à venir (${geo} géolocalisés)`);
      } catch (e) {
        console.log(`${site.cle} : ÉCHEC (${e instanceof Error ? e.message : e})`);
      }
    }
    console.log('\n[DRY-RUN] Aucune écriture. Relancer avec --confirm.');
    return;
  }

  const liens = await liensDemosphereExistants(urlSb, cle);
  let totalCrees = 0;
  for (const site of sites) {
    const r = await importerSiteDemosphere(site, urlSb, cle, liens, argMax);
    totalCrees += r.crees.length;
    console.log(
      `\n=== ${site.cle} : ${r.crees.length} créées, ${r.ignores} déjà là, ${r.ecartes.length} sans affiche, ${r.erreurs.length} erreurs ===`,
    );
    for (const c of r.crees) console.log(`  OK ${c}`);
    for (const e of r.erreurs) console.log(`  ERR ${e}`);
  }
  console.log(`\nTOTAL : ${totalCrees} mobilisations Demosphère créées.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
