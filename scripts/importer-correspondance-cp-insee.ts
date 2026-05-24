/**
 * Script d'import de la correspondance code_postal ↔ code_insee (chantier 13.3).
 *
 * Source : base officielle des codes postaux de La Poste (hexasmal),
 * téléchargée depuis data.gouv.fr. Format : séparateur « ; », encodage
 * latin-1, en-tête commentée par « # ». Colonnes utiles :
 *   Code_commune_INSEE ; Nom_de_la_commune ; Code_postal ; Libelle_d_acheminement ; Ligne_5
 *
 * Remplit la table `correspondance_cp_insee` (cf. migration 036). La
 * relation est many-to-many : on conserve toutes les paires (CP, INSEE),
 * dédoublonnées (plusieurs lignes « Ligne_5 » produisent la même paire).
 *
 * Usage :
 *   npx tsx scripts/importer-correspondance-cp-insee.ts data-migration/laposte_codes_postaux.csv --dry-run
 *   npx tsx scripts/importer-correspondance-cp-insee.ts data-migration/laposte_codes_postaux.csv --confirm
 *
 * `--dry-run` : parse + contrôle qualité, aucune écriture, aucune env
 * requise. `--confirm` : upsert par lots (idempotent sur (code_postal,
 * code_insee)), nécessite NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

interface Correspondance {
  code_postal: string;
  code_insee: string;
  nom_commune: string | null;
}

const CP_REGEX = /^\d{5}$/;
const INSEE_REGEX = /^[0-9AB]{5}$/;
const TAILLE_LOT = 1000;

function parser(contenu: string): {
  lignes: Correspondance[];
  ignorees: number;
  cpDistincts: number;
} {
  const brutes = contenu.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (brutes.length === 0) return { lignes: [], ignorees: 0, cpDistincts: 0 };

  // En-tête commencée par « # » : on repère les colonnes utiles par nom.
  const entete = (brutes[0] ?? '')
    .replace(/^#/, '')
    .split(';')
    .map((c) => c.trim().toLowerCase());
  const idxInsee = entete.indexOf('code_commune_insee');
  const idxNom = entete.indexOf('nom_de_la_commune');
  const idxCp = entete.indexOf('code_postal');
  if (idxInsee < 0 || idxCp < 0) {
    throw new Error('Colonnes Code_commune_INSEE / Code_postal introuvables dans le CSV La Poste.');
  }

  const vues = new Set<string>();
  const cpVus = new Set<string>();
  const lignes: Correspondance[] = [];
  let ignorees = 0;

  for (const ligne of brutes.slice(1)) {
    const parts = ligne.split(';');
    const codeInsee = (parts[idxInsee] ?? '').trim();
    const codePostal = (parts[idxCp] ?? '').trim();
    const nom = idxNom >= 0 ? (parts[idxNom] ?? '').trim() : '';

    if (!CP_REGEX.test(codePostal) || !INSEE_REGEX.test(codeInsee)) {
      ignorees += 1;
      continue;
    }
    const cle = `${codePostal}::${codeInsee}`;
    if (vues.has(cle)) continue;
    vues.add(cle);
    cpVus.add(codePostal);

    lignes.push({
      code_postal: codePostal,
      code_insee: codeInsee,
      nom_commune: nom === '' ? null : nom,
    });
  }

  return { lignes, ignorees, cpDistincts: cpVus.size };
}

function lireMode(): { fichier: string; estDryRun: boolean } {
  const args = process.argv.slice(2);
  const fichier = args.find((a) => !a.startsWith('--'));
  const estDryRun = args.includes('--dry-run');
  const estConfirme = args.includes('--confirm');
  if (fichier === undefined || fichier === '') {
    console.error(
      'Usage : npx tsx scripts/importer-correspondance-cp-insee.ts <fichier.csv> [--dry-run | --confirm]',
    );
    process.exit(1);
  }
  if (!estDryRun && !estConfirme) {
    console.error('Refus de démarrer : précisez --dry-run ou --confirm.');
    process.exit(1);
  }
  if (estDryRun && estConfirme) {
    console.error('--dry-run et --confirm sont mutuellement exclusifs.');
    process.exit(1);
  }
  return { fichier, estDryRun };
}

async function main(): Promise<void> {
  const { fichier, estDryRun } = lireMode();
  // La Poste publie en latin-1 : on décode explicitement pour les accents.
  const contenu = readFileSync(resolve(fichier), 'latin1');
  const { lignes, ignorees, cpDistincts } = parser(contenu);

  // biome-ignore lint/suspicious/noConsoleLog: trace CLI.
  console.log(
    `${lignes.length} correspondances uniques (${cpDistincts} codes postaux distincts), ${ignorees} lignes ignorées.`,
  );

  if (estDryRun) {
    // biome-ignore lint/suspicious/noConsoleLog: récap dry-run.
    console.log('[dry-run] aperçu des 3 premières :');
    for (const l of lignes.slice(0, 3)) {
      // biome-ignore lint/suspicious/noConsoleLog: récap dry-run.
      console.log(JSON.stringify(l));
    }
    // biome-ignore lint/suspicious/noConsoleLog: récap dry-run.
    console.log('[dry-run] aucune écriture. Relancer avec --confirm pour appliquer.');
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || url === '' || key === undefined || key === '') {
    console.error('Variables d’env Supabase manquantes (URL ou SERVICE_ROLE_KEY).');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  let succes = 0;
  let echecs = 0;
  for (let i = 0; i < lignes.length; i += TAILLE_LOT) {
    const lot = lignes.slice(i, i + TAILLE_LOT);
    const { error } = await supabase
      .from('correspondance_cp_insee')
      .upsert(lot, { onConflict: 'code_postal,code_insee' });
    if (error !== null) {
      console.error(`Échec lot ${i / TAILLE_LOT + 1} : ${error.message}`);
      echecs += lot.length;
    } else {
      succes += lot.length;
    }
  }

  // biome-ignore lint/suspicious/noConsoleLog: récap final CLI.
  console.log(`Import terminé : ${succes} upserts, ${echecs} échecs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
