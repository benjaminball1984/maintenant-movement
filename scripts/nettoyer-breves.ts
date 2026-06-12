/**
 * Mise en conformité des brèves déjà importées (corrections Ben
 * 2026-06-12) :
 *   1. RÈGLE 1 source / 24 h : pour chaque source et chaque jour
 *      calendaire (Europe/Paris), on ne garde qu'UNE brève (priorité à
 *      celle qui a une image, puis la plus récente) ; les autres sont
 *      SUPPRIMÉES (imports tout frais, aucun engagement dessus).
 *   2. Une image pour CHAQUE brève : celles qui n'en ont pas reçoivent
 *      l'og:image de leur page d'article (chassée maintenant), ou à
 *      défaut le logo du média source (avec parcimonie).
 *
 * Usage :
 *   npx tsx scripts/nettoyer-breves.ts --dry-run
 *   npx tsx scripts/nettoyer-breves.ts --confirm
 */

import { chercherImageArticle, urlLogoSource } from '../lib/import-breves/importer';
import { TOUTES_LES_SOURCES } from '../lib/import-breves/sources';

const estDryRun = process.argv.includes('--dry-run');
const estConfirme = process.argv.includes('--confirm');
if (!estDryRun && !estConfirme) {
  console.error('Préciser --dry-run ou --confirm.');
  process.exit(1);
}

const USER_AGENT =
  'Mozilla/5.0 (compatible; MaintenantRevueDePresse/1.0; +https://maintenant-le-mouvement.org)';

interface LigneBreve {
  id: string;
  slug: string;
  titre: string;
  provenance_externe: string | null;
  source_url: string | null;
  vignette_url: string | null;
  publie_le: string | null;
}

function jourParis(iso: string): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

async function main(): Promise<void> {
  const urlSb = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (urlSb === undefined || urlSb === '' || cle === undefined || cle === '') {
    console.error('Variables Supabase manquantes.');
    process.exit(1);
  }
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };

  const r = await fetch(
    `${urlSb}/rest/v1/media?type=eq.breve&select=id,slug,titre,provenance_externe,source_url,vignette_url,publie_le&order=publie_le.desc&limit=1000`,
    { headers: entetes },
  );
  const breves = (await r.json()) as LigneBreve[];
  console.log(`${breves.length} brèves en base.`);

  // 1. Dédoublonnage 1 source / jour calendaire.
  const groupes = new Map<string, LigneBreve[]>();
  for (const b of breves) {
    if (b.publie_le === null || b.provenance_externe === null) continue;
    const cleGroupe = `${b.provenance_externe}|${jourParis(b.publie_le)}`;
    const liste = groupes.get(cleGroupe) ?? [];
    liste.push(b);
    groupes.set(cleGroupe, liste);
  }

  const aSupprimer: LigneBreve[] = [];
  for (const [, liste] of groupes) {
    if (liste.length <= 1) continue;
    const triees = [...liste].sort((a, b) => {
      const imgA = a.vignette_url !== null ? 1 : 0;
      const imgB = b.vignette_url !== null ? 1 : 0;
      if (imgA !== imgB) return imgB - imgA;
      return (b.publie_le ?? '').localeCompare(a.publie_le ?? '');
    });
    aSupprimer.push(...triees.slice(1));
  }
  console.log(`\n=== À SUPPRIMER (règle 1 source/24 h) : ${aSupprimer.length} ===`);
  for (const b of aSupprimer) {
    console.log(
      `- ${b.provenance_externe} | ${(b.publie_le ?? '').slice(0, 16)} | ${b.titre.slice(0, 70)}`,
    );
  }

  const supprimees = new Set(aSupprimer.map((b) => b.id));
  const conservees = breves.filter((b) => !supprimees.has(b.id));
  const sansImage = conservees.filter((b) => b.vignette_url === null);
  console.log(`\n=== SANS IMAGE après dédoublonnage : ${sansImage.length} ===`);

  if (estDryRun) {
    for (const b of sansImage) console.log(`- ${b.provenance_externe} | ${b.titre.slice(0, 70)}`);
    console.log('\n[DRY-RUN] Aucune écriture.');
    return;
  }

  // Suppressions.
  for (const b of aSupprimer) {
    const del = await fetch(`${urlSb}/rest/v1/media?id=eq.${b.id}`, {
      method: 'DELETE',
      headers: { ...entetes, Prefer: 'return=minimal' },
    });
    if (!del.ok) console.log(`SUPPRESSION EN ÉCHEC ${b.slug} : ${del.status}`);
  }
  console.log(`${aSupprimer.length} doublons supprimés.`);

  // Backfill des images.
  const copierImage = async (urlImage: string, chemin: string): Promise<string | null> => {
    try {
      const rImg = await fetch(urlImage, { headers: { 'User-Agent': USER_AGENT } });
      const typeMime = rImg.headers.get('content-type') ?? '';
      if (!rImg.ok || !typeMime.startsWith('image/')) return null;
      const octets = new Uint8Array(await rImg.arrayBuffer());
      if (octets.length === 0 || octets.length > 4_000_000) return null;
      const rUp = await fetch(`${urlSb}/storage/v1/object/media/${chemin}`, {
        method: 'POST',
        headers: { ...entetes, 'Content-Type': typeMime, 'x-upsert': 'true' },
        body: octets,
      });
      return rUp.ok ? `${urlSb}/storage/v1/object/public/media/${chemin}` : null;
    } catch {
      return null;
    }
  };

  let viaArticle = 0;
  let viaLogo = 0;
  for (const b of sansImage) {
    let vignette: string | null = null;
    let reelle = false;
    if (b.source_url !== null) {
      const og = await chercherImageArticle(b.source_url);
      if (og !== null) {
        vignette = await copierImage(og, `breves/${b.slug}.jpg`);
        reelle = vignette !== null;
      }
    }
    if (vignette === null && b.provenance_externe !== null) {
      const source = TOUTES_LES_SOURCES.find((s) => s.nom === b.provenance_externe);
      if (source !== undefined) {
        const slugSource = b.provenance_externe
          .toLowerCase()
          .normalize('NFD')
          .replace(/[^a-z0-9]+/g, '-');
        vignette = await copierImage(urlLogoSource(source), `breves/logos/${slugSource}.png`);
      }
    }
    if (vignette === null) {
      console.log(`TOUJOURS SANS IMAGE : ${b.provenance_externe} | ${b.titre.slice(0, 60)}`);
      continue;
    }
    const patch = await fetch(`${urlSb}/rest/v1/media?id=eq.${b.id}`, {
      method: 'PATCH',
      headers: { ...entetes, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ vignette_url: vignette, importante: reelle }),
    });
    if (patch.ok) {
      if (reelle) viaArticle += 1;
      else viaLogo += 1;
    }
  }
  console.log(
    `Images posées : ${viaArticle} via la page de l'article, ${viaLogo} via le logo source.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
