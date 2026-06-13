/**
 * Retire de la revue de presse les contenus multi-format (podcast, vidéo,
 * live, dessin) trop ANCIENS (demande Ben 2026-06-13 : « classer par dates
 * les plus récents d'abord » ; le flux contenait des contenus publiés il y
 * a des mois, voire un an, importés parce que c'était le dernier épisode
 * de sources peu actives).
 *
 * Seuil = AGE_MAX_JOURS (le même que le filtre d'import, cohérence). Les
 * BRÈVES ne sont pas touchées (actualité, déjà récentes). Les contenus
 * MAISON (provenance_externe nul) ne sont jamais touchés. C'est une
 * suppression de contenu de REVUE DE PRESSE (réimportable), pas de données
 * propres au mouvement.
 *
 * Usage :
 *   npx tsx scripts/nettoyer-medias-vieux.ts --dry-run
 *   npx tsx scripts/nettoyer-medias-vieux.ts --confirm
 */

import { AGE_MAX_JOURS } from '../lib/import-medias/importer-medias';

const estDryRun = process.argv.includes('--dry-run');
const estConfirme = process.argv.includes('--confirm');
if (!estDryRun && !estConfirme) {
  console.error('Préciser --dry-run ou --confirm.');
  process.exit(1);
}

interface LigneMedia {
  id: string;
  titre: string;
  type: string;
  provenance_externe: string | null;
  publie_le: string | null;
}

async function main(): Promise<void> {
  const urlSb = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (urlSb === undefined || urlSb === '' || cle === undefined || cle === '') {
    console.error('Variables Supabase manquantes (charger --env-file=.env.local).');
    process.exit(1);
  }
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  const seuilIso = new Date(Date.now() - AGE_MAX_JOURS * 24 * 3600 * 1000).toISOString();

  // Contenus multi-format externes publiés AVANT le seuil.
  const r = await fetch(
    `${urlSb}/rest/v1/media?type=in.(podcast,video,live,dessin)&provenance_externe=not.is.null&publie_le=lt.${encodeURIComponent(seuilIso)}&select=id,titre,type,provenance_externe,publie_le&order=publie_le.asc`,
    { headers: entetes },
  );
  if (!r.ok) throw new Error(`Lecture media : ${r.status} ${await r.text()}`);
  const vieux = (await r.json()) as LigneMedia[];

  console.log(
    `${vieux.length} contenu(s) multi-format publié(s) il y a plus de ${AGE_MAX_JOURS} jours :`,
  );
  for (const m of vieux) {
    console.log(
      `  [${m.type}] ${m.provenance_externe} | ${m.publie_le?.slice(0, 10)} | ${m.titre.slice(0, 50)}`,
    );
  }

  if (!estConfirme) {
    console.log('\n[DRY-RUN] Aucune suppression. Relancer avec --confirm.');
    return;
  }

  let supprimes = 0;
  for (const m of vieux) {
    const rDel = await fetch(`${urlSb}/rest/v1/media?id=eq.${m.id}`, {
      method: 'DELETE',
      headers: entetes,
    });
    if (rDel.ok) supprimes += 1;
    else console.log(`  ÉCHEC DELETE ${m.id} : ${rDel.status}`);
  }
  console.log(`\n${supprimes} contenu(s) retiré(s) de la revue de presse.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
