/**
 * Import initial des brèves (revue de presse, demande Ben 2026-06-12) :
 * les 3 derniers jours, au plus 24 brèves par jour calendaire (Europe/
 * Paris), sources prioritaires d'abord, complétées si besoin par les
 * sources du Portail des médias indépendants (Basta!).
 *
 * Usage :
 *   npx tsx scripts/import-breves-initial.ts --dry-run   (rapport, zéro écriture)
 *   npx tsx scripts/import-breves-initial.ts --confirm   (images bucket + insert)
 *
 * Variables : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
 * (charger par exemple avec `node --env-file=.env.local`).
 */

import { recolterBrevesInitiales, telechargerEtInsererBreve } from '../lib/import-breves/importer';

const estDryRun = process.argv.includes('--dry-run');
const estConfirme = process.argv.includes('--confirm');
if (!estDryRun && !estConfirme) {
  console.error('Préciser --dry-run ou --confirm.');
  process.exit(1);
}

async function main(): Promise<void> {
  const recolte = await recolterBrevesInitiales({
    joursFenetre: 3,
    maxParJour: 24,
  });
  // Plafond global d'amorçage : 3 jours x 24 brèves (« 1 par heure »),
  // en gardant les plus récentes.
  const selection = recolte.selection.slice(0, 72);
  const rapportSources = recolte.rapportSources;

  console.log('=== SOURCES ===');
  for (const ligne of rapportSources) console.log(`- ${ligne}`);

  console.log(`\n=== SÉLECTION : ${selection.length} brèves ===`);
  for (const b of selection) {
    const date = new Date(b.article.publieLe ?? 0).toISOString();
    console.log(
      `${date} | ${b.source.nom} (${b.source.langue}) | ${b.article.imageUrl !== null ? 'IMG' : '---'} | ${b.article.titre.slice(0, 110)}`,
    );
  }

  if (estDryRun) {
    console.log('\n[DRY-RUN] Aucune écriture. Relancer avec --confirm.');
    return;
  }

  const urlSb = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (urlSb === undefined || urlSb === '' || cle === undefined || cle === '') {
    console.error('Variables Supabase manquantes (charger --env-file=.env.local).');
    process.exit(1);
  }

  let crees = 0;
  const echecs: string[] = [];
  for (const b of selection) {
    const resultat = await telechargerEtInsererBreve(b, urlSb, cle);
    if (resultat.ok) {
      crees += 1;
      console.log(`breve OK : ${resultat.slug}`);
    } else {
      echecs.push(`${b.article.titre.slice(0, 80)} : ${resultat.message}`);
    }
  }
  console.log(`\n${crees} brèves créées, ${echecs.length} échecs.`);
  for (const e of echecs) console.log(`- ${e}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
