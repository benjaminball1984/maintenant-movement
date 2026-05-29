/**
 * Script utilitaire : convertit en masse les valeur_md → valeur_html pour
 * toutes les clés `contenu_editorial` qui n'ont pas encore de version riche
 * (V2.5.41 sous-chantier V2.5.40.b).
 *
 * Utile quand Lilou/Ben veut basculer en masse le site sur le mode riche
 * (toutes les pages éditoriales d'un coup, plutôt que clé par clé via la
 * console CMS).
 *
 * Usage :
 *   npx tsx scripts/convertir-tout-en-riche.ts --dry-run
 *   npx tsx scripts/convertir-tout-en-riche.ts --confirm
 *
 * Idempotent : si une clé a déjà `valeur_html` non vide, on ne la touche
 * pas. Le sanitize est appliqué pour cohérence avec la Server Action.
 */

import { markdownLegerEnHtml } from '@/lib/rich-text/markdown-vers-html';
import { sanitizeRichHtml } from '@/lib/rich-text/sanitize';
import { createClient } from '@supabase/supabase-js';

interface ContenuRow {
  cle: string;
  valeur_md: string;
  valeur_html: string | null;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const confirm = args.includes('--confirm');

  if (!dryRun && !confirm) {
    console.error('Usage : npx tsx scripts/convertir-tout-en-riche.ts (--dry-run | --confirm)');
    process.exit(1);
  }
  if (dryRun && confirm) {
    console.error('Choisir --dry-run OU --confirm, pas les deux.');
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || key === undefined) {
    console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('contenu_editorial')
    .select('cle, valeur_md, valeur_html');
  if (error !== null) {
    console.error(`Lecture impossible : ${error.message}`);
    process.exit(1);
  }
  if (data === null) {
    console.log('Aucune ligne en base, rien à faire.');
    return;
  }

  const candidats = (data as ContenuRow[]).filter((r) => {
    if (r.valeur_html !== null && r.valeur_html.trim() !== '') return false;
    if (r.valeur_md.trim() === '') return false;
    return true;
  });

  console.log(`Total contenus : ${data.length}`);
  console.log(`Déjà en rich text : ${data.length - candidats.length}`);
  console.log(`À convertir : ${candidats.length}`);

  if (candidats.length === 0) {
    console.log('Rien à faire.');
    return;
  }

  let convertis = 0;
  let echecs = 0;

  for (const row of candidats) {
    const htmlBrut = markdownLegerEnHtml(row.valeur_md);
    const htmlPropre = sanitizeRichHtml(htmlBrut);

    if (dryRun) {
      console.log(`[dry-run] ${row.cle}  (${row.valeur_md.length} → ${htmlPropre.length} car.)`);
      convertis += 1;
      continue;
    }

    const { error: errUpdate } = await supabase
      .from('contenu_editorial')
      .update({ valeur_html: htmlPropre })
      .eq('cle', row.cle);
    if (errUpdate !== null) {
      console.error(`Échec sur ${row.cle} : ${errUpdate.message}`);
      echecs += 1;
      continue;
    }
    convertis += 1;
    if (convertis % 25 === 0) {
      console.log(`  ${convertis}/${candidats.length} convertis…`);
    }
  }

  console.log('');
  console.log(`Convertis : ${convertis}`);
  if (echecs > 0) console.log(`Échecs : ${echecs}`);
  if (dryRun) {
    console.log('--- Aucune écriture effectuée (mode dry-run). Relancer avec --confirm.');
  } else {
    console.log('--- Conversion appliquée en base.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
