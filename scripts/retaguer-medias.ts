/**
 * Re-tague les contenus de la revue de presse (toutes types) qui n'ont
 * aucun tag (demande Ben 2026-06-13 : « au moins 1 tag »). Réutilise
 * `assignerTags` (banque de mots-clés + repli parapluie « Politique »),
 * donc on obtient de vrais tags quand le texte le permet, sinon le repli.
 *
 * Usage :
 *   npx tsx scripts/retaguer-medias.ts --dry-run
 *   npx tsx scripts/retaguer-medias.ts --confirm
 *
 * Variables : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.
 */

import { assignerTags } from '../lib/import-breves/tags';

const estDryRun = process.argv.includes('--dry-run');
const estConfirme = process.argv.includes('--confirm');
if (!estDryRun && !estConfirme) {
  console.error('Préciser --dry-run ou --confirm.');
  process.exit(1);
}

interface LigneMedia {
  id: string;
  titre: string;
  corps: string;
  type: string;
  tags: string[] | null;
}

async function main(): Promise<void> {
  const urlSb = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (urlSb === undefined || urlSb === '' || cle === undefined || cle === '') {
    console.error('Variables Supabase manquantes (charger --env-file=.env.local).');
    process.exit(1);
  }
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };

  const r = await fetch(
    `${urlSb}/rest/v1/media?statut=eq.publie&select=id,titre,corps,type,tags&limit=2000`,
    { headers: entetes },
  );
  if (!r.ok) throw new Error(`Lecture media : ${r.status}`);
  const medias = (await r.json()) as LigneMedia[];
  const sansTag = medias.filter((m) => m.tags === null || m.tags.length === 0);
  console.log(`${medias.length} médias publiés, ${sansTag.length} sans tag.`);

  let traites = 0;
  for (const m of sansTag) {
    const tags = assignerTags(`${m.titre} ${m.corps}`);
    console.log(`[${m.type}] ${m.titre.slice(0, 60)} → ${JSON.stringify(tags)}`);
    if (!estConfirme) continue;
    const rMaj = await fetch(`${urlSb}/rest/v1/media?id=eq.${m.id}`, {
      method: 'PATCH',
      headers: { ...entetes, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ tags }),
    });
    if (rMaj.ok) traites += 1;
    else console.log(`  ÉCHEC PATCH ${rMaj.status}`);
  }

  console.log(estConfirme ? `\n${traites} médias re-tagués.` : '\n[DRY-RUN] Aucune écriture.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
