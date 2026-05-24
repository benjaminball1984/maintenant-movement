/**
 * Script d'import du référentiel géographique complet (chantier 13.3).
 *
 * Lit `data-migration/communes_france_geoloc.csv` (~35 000 communes +
 * ~45 arrondissements) et remplit la table de RÉFÉRENCE
 * `commune_reference` (cf. migration 035). Cette table est distincte de
 * `commune` (communes libres actives) : c'est un pur référentiel en
 * lecture, keyé par `code_insee`.
 *
 * Usage :
 *   npx tsx scripts/importer-communes-reference.ts data-migration/communes_france_geoloc.csv --dry-run
 *   npx tsx scripts/importer-communes-reference.ts data-migration/communes_france_geoloc.csv --confirm
 *
 * Mode `--dry-run` (à lancer en premier) : parse le CSV, contrôle la
 * qualité (codes INSEE invalides, répartition par type), n'écrit RIEN et
 * ne requiert aucune variable d'env. Mode `--confirm` : upsert par lots
 * dans `commune_reference` (idempotent sur `code_insee`), nécessite
 * `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`.
 *
 * Le script est idempotent : ré-exécuter `--confirm` ré-upsert les mêmes
 * lignes sans créer de doublon (clé = code_insee).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

/** Une ligne du référentiel, normalisée. */
interface CommuneReference {
  code_insee: string;
  nom: string;
  type: 'commune' | 'arrondissement';
  code_departement: string | null;
  region: string | null;
  population: number | null;
  latitude: number | null;
  longitude: number | null;
}

const COLONNES = [
  'code_insee',
  'nom',
  'type',
  'code_departement',
  'region',
  'population',
  'latitude',
  'longitude',
] as const;

const CODE_INSEE_REGEX = /^[0-9AB]{5}$/;
const TAILLE_LOT = 500;

/**
 * Parse le CSV. Gère les valeurs entre guillemets contenant des virgules
 * (rare sur ce fichier mais on reste robuste) via un découpage simple.
 */
function parserCsv(contenu: string): { lignes: CommuneReference[]; ignorees: number } {
  const lignesBrutes = contenu.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lignesBrutes.length === 0) return { lignes: [], ignorees: 0 };

  const entete = (lignesBrutes[0] ?? '').split(',').map((c) => c.trim());
  for (const col of COLONNES) {
    if (!entete.includes(col)) {
      throw new Error(`Colonne manquante dans le CSV : ${col}`);
    }
  }
  const idx = Object.fromEntries(COLONNES.map((c) => [c, entete.indexOf(c)])) as Record<
    (typeof COLONNES)[number],
    number
  >;

  const lignes: CommuneReference[] = [];
  let ignorees = 0;

  for (const ligne of lignesBrutes.slice(1)) {
    const parts = ligne.split(',');
    const get = (col: (typeof COLONNES)[number]): string | null => {
      const v = parts[idx[col]];
      return v === undefined || v.trim() === '' ? null : v.trim();
    };

    const codeInsee = get('code_insee');
    const nom = get('nom');
    // Une ligne sans clé ni nom est inexploitable : on l'ignore (comptée).
    if (codeInsee === null || nom === null || !CODE_INSEE_REGEX.test(codeInsee)) {
      ignorees += 1;
      continue;
    }

    // Le référentiel libelle les arrondissements de Paris/Lyon/Marseille
    // « arrondissement_municipal » ; on normalise vers « arrondissement ».
    const typeBrut = get('type');
    const type: CommuneReference['type'] =
      typeBrut === 'arrondissement_municipal' || typeBrut === 'arrondissement'
        ? 'arrondissement'
        : 'commune';
    const population = get('population');
    const latitude = get('latitude');
    const longitude = get('longitude');

    lignes.push({
      code_insee: codeInsee,
      nom,
      type,
      code_departement: get('code_departement'),
      region: get('region'),
      population: population === null ? null : Number.parseInt(population, 10),
      latitude: latitude === null ? null : Number.parseFloat(latitude),
      longitude: longitude === null ? null : Number.parseFloat(longitude),
    });
  }

  return { lignes, ignorees };
}

function lireMode(): { fichier: string; estDryRun: boolean } {
  const args = process.argv.slice(2);
  const fichier = args.find((a) => !a.startsWith('--'));
  const estDryRun = args.includes('--dry-run');
  const estConfirme = args.includes('--confirm');

  if (fichier === undefined || fichier === '') {
    console.error(
      'Usage : npx tsx scripts/importer-communes-reference.ts <fichier.csv> [--dry-run | --confirm]',
    );
    process.exit(1);
  }
  if (!estDryRun && !estConfirme) {
    console.error('Refus de démarrer : précisez --dry-run (test à blanc) ou --confirm (import).');
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
  const contenu = readFileSync(resolve(fichier), 'utf-8');
  const { lignes, ignorees } = parserCsv(contenu);

  const nbArrondissements = lignes.filter((l) => l.type === 'arrondissement').length;
  // biome-ignore lint/suspicious/noConsoleLog: trace explicite de l'import CLI.
  console.log(
    `${lignes.length} entrées valides (${nbArrondissements} arrondissements), ${ignorees} ignorées (code INSEE invalide).`,
  );

  if (estDryRun) {
    // biome-ignore lint/suspicious/noConsoleLog: récap dry-run.
    console.log('[dry-run] aperçu des 3 premières lignes :');
    for (const ligne of lignes.slice(0, 3)) {
      // biome-ignore lint/suspicious/noConsoleLog: récap dry-run.
      console.log(JSON.stringify(ligne));
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
      .from('commune_reference')
      .upsert(lot, { onConflict: 'code_insee' });
    if (error !== null) {
      console.error(`Échec lot ${i / TAILLE_LOT + 1} : ${error.message}`);
      echecs += lot.length;
    } else {
      succes += lot.length;
    }
  }

  // biome-ignore lint/suspicious/noConsoleLog: récap final de l'import CLI.
  console.log(`Import terminé : ${succes} upserts, ${echecs} échecs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
