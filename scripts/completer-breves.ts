/**
 * Complète la revue de presse jusqu'à un nombre CIBLE de brèves (demande
 * Ben 2026-06-12 : « va chercher les articles nécessaires pour arriver à
 * 72 », en plus des contenus de la rédaction).
 *
 * Réutilise le pipeline complet de `lib/import-breves` : minimum ~6
 * lignes de texte (étoffage depuis la page de l'article), chasse à
 * l'image renforcée (flux sans émojis ni logos, og:image, chasseurs
 * spécialisés Libération/NYT, corps WordPress, logo en dernier recours),
 * entités HTML décodées, et règle « 1 brève par source par jour
 * calendaire » en comptant les brèves DÉJÀ en base.
 *
 * Usage :
 *   npx tsx scripts/completer-breves.ts --dry-run   (rapport, zéro écriture)
 *   npx tsx scripts/completer-breves.ts --confirm   (images bucket + insert)
 *
 * Variables : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
 * (charger par exemple avec `node --env-file=.env.local`).
 */

import {
  type BreveCandidate,
  recolterBrevesInitiales,
  telechargerEtInsererBreve,
} from '../lib/import-breves/importer';

/** Nombre total de brèves visé en base (décision Ben 2026-06-12). */
const CIBLE_BREVES = 72;
/** Fenêtre de récolte : assez large pour trouver le complément. */
const JOURS_FENETRE = 4;

const estDryRun = process.argv.includes('--dry-run');
const estConfirme = process.argv.includes('--confirm');
if (!estDryRun && !estConfirme) {
  console.error('Préciser --dry-run ou --confirm.');
  process.exit(1);
}

/** Jour calendaire Europe/Paris (clé de la règle 1 source/jour). */
function jourParis(epochMs: number): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(epochMs));
}

async function main(): Promise<void> {
  const urlSb = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (urlSb === undefined || urlSb === '' || cle === undefined || cle === '') {
    console.error('Variables Supabase manquantes (charger --env-file=.env.local).');
    process.exit(1);
  }
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };

  // 1. État existant : liens déjà importés (idempotence) + créneaux
  //    (source, jour de publication) déjà occupés (règle 1/source/jour).
  const rExistantes = await fetch(
    `${urlSb}/rest/v1/media?type=eq.breve&select=source_url,provenance_externe,publie_le&limit=3000`,
    { headers: entetes },
  );
  if (!rExistantes.ok) throw new Error(`Lecture media : ${rExistantes.status}`);
  const existantes = (await rExistantes.json()) as Array<{
    source_url: string | null;
    provenance_externe: string | null;
    publie_le: string | null;
  }>;
  const liensImportes = new Set(existantes.map((l) => l.source_url).filter((u) => u !== null));
  const creneauxOccupes = new Set(
    existantes
      .filter((l) => l.provenance_externe !== null && l.publie_le !== null)
      .map((l) => `${l.provenance_externe}|${jourParis(Date.parse(l.publie_le as string))}`),
  );

  const aCreer = CIBLE_BREVES - existantes.length;
  console.log(`${existantes.length} brèves en base, cible ${CIBLE_BREVES} : ${aCreer} à créer.`);
  if (aCreer <= 0) {
    console.log('Rien à faire.');
    return;
  }

  // 2. Récolte des candidates (1/source/jour assurée DANS la récolte),
  //    puis filtre contre l'existant.
  const recolte = await recolterBrevesInitiales({
    joursFenetre: JOURS_FENETRE,
    maxParJour: 24,
  });
  console.log('\n=== SOURCES ===');
  for (const ligne of recolte.rapportSources) console.log(`- ${ligne}`);

  const candidates: BreveCandidate[] = recolte.selection.filter((c) => {
    if (liensImportes.has(c.article.lien)) return false;
    const creneau = `${c.source.nom}|${jourParis(c.article.publieLe ?? 0)}`;
    return !creneauxOccupes.has(creneau);
  });
  console.log(`\n${candidates.length} candidates après filtre (déjà importées, créneaux pris).`);

  if (estDryRun) {
    for (const c of candidates.slice(0, aCreer + 10)) {
      const date = new Date(c.article.publieLe ?? 0).toISOString();
      console.log(`${date} | ${c.source.nom} | ${c.article.titre.slice(0, 100)}`);
    }
    console.log('\n[DRY-RUN] Aucune écriture. Relancer avec --confirm.');
    return;
  }

  // 3. Insertion (plus récentes d'abord) jusqu'au quota : les échecs
  //    (texte trop court, image introuvable...) passent à la suivante.
  let crees = 0;
  const echecs: string[] = [];
  for (const c of candidates) {
    if (crees >= aCreer) break;
    const resultat = await telechargerEtInsererBreve(c, urlSb, cle);
    if (resultat.ok) {
      crees += 1;
      console.log(`OK ${crees}/${aCreer} : [${c.source.nom}] ${resultat.slug}`);
    } else {
      echecs.push(`[${c.source.nom}] ${c.article.titre.slice(0, 70)} : ${resultat.message}`);
    }
  }

  console.log(`\n${crees} brèves créées (cible ${aCreer}), ${echecs.length} candidates écartées.`);
  for (const e of echecs) console.log(`- ${e}`);
  if (crees < aCreer) {
    console.log(
      `\nATTENTION : cible non atteinte (${existantes.length + crees}/${CIBLE_BREVES}). Élargir JOURS_FENETRE ou attendre le cron horaire.`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
