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
  provenance_externe: string | null;
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
    `${urlSb}/rest/v1/media?statut=eq.publie&select=id,titre,corps,type,tags,provenance_externe&limit=2000`,
    { headers: entetes },
  );
  if (!r.ok) throw new Error(`Lecture media : ${r.status}`);
  const medias = (await r.json()) as LigneMedia[];

  // --tout : recalcule les tags de TOUTE la revue de presse (contenus à
  // provenance externe), en écrasant les tags existants qui diffèrent du
  // recalcul (corrige les mauvaises catégories, ex. « Écologie » plaqué sur
  // un fait divers). Sans --tout : seulement les contenus SANS tag, sans
  // jamais toucher aux tags éditoriaux choisis par l'admin (contenus maison).
  const estTout = process.argv.includes('--tout');
  const cibles = estTout
    ? medias.filter((m) => m.provenance_externe !== null)
    : medias.filter((m) => m.tags === null || m.tags.length === 0);
  console.log(
    `${medias.length} médias publiés ; ${cibles.length} ${estTout ? 'contenu(s) revue de presse à vérifier' : 'sans tag'}.`,
  );

  let traites = 0;
  let changements = 0;
  for (const m of cibles) {
    const tags = assignerTags(`${m.titre} ${m.corps}`);
    const actuel = JSON.stringify(m.tags ?? []);
    const recalcule = JSON.stringify(tags);
    if (estTout && actuel === recalcule) continue; // déjà bon : rien à écrire
    changements += 1;
    console.log(`[${m.type}] ${m.titre.slice(0, 56)} : ${actuel} → ${recalcule}`);
    if (!estConfirme) continue;
    const rMaj = await fetch(`${urlSb}/rest/v1/media?id=eq.${m.id}`, {
      method: 'PATCH',
      headers: { ...entetes, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ tags }),
    });
    if (rMaj.ok) traites += 1;
    else console.log(`  ÉCHEC PATCH ${rMaj.status}`);
  }

  console.log(
    estConfirme
      ? `\n${traites}/${changements} médias re-tagués.`
      : `\n[DRY-RUN] ${changements} changement(s) prévu(s), aucune écriture.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
