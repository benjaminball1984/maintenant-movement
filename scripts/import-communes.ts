/**
 * Script d'import CSV des communes pré-créées (chantier 5.2).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §7B` :
 *   « Cartographie pré-créée : entre 2 100 et 2 300 communes pré-créées
 *     par Lilou/Ben (CSV à fournir avant le chantier). Seule exception
 *     à la règle "pas de coquilles vides". »
 *
 * Usage :
 *   npx tsx scripts/import-communes.ts <fichier.csv>
 *
 * Format attendu du CSV (en-tête obligatoire) :
 *   slug,nom,code_insee,code_postal_principal,departement,region,latitude,longitude
 *
 * Le script :
 *   1. Lit le CSV ligne par ligne.
 *   2. Pour chaque commune, fait un upsert sur le slug (insert si nouvelle,
 *      update si existante, en gardant `statut_creation = 'pre_creee'`).
 *   3. Affiche un récap.
 *
 * Préalable : variables d'env `NEXT_PUBLIC_SUPABASE_URL` et
 * `SUPABASE_SERVICE_ROLE_KEY` chargées (bypass RLS via service_role).
 *
 * À FAIRE : Lilou/Ben fournit le CSV puis on lance le script.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

interface LigneCSV {
  slug: string;
  nom: string;
  code_insee: string | null;
  code_postal_principal: string | null;
  departement: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
}

function parserCsv(contenu: string): LigneCSV[] {
  const lignes = contenu.split('\n').filter((l) => l.trim() !== '');
  if (lignes.length === 0) return [];
  const premiereLigne = lignes[0];
  if (premiereLigne === undefined) return [];
  const entete = premiereLigne.split(',').map((c) => c.trim());
  const colonnes = [
    'slug',
    'nom',
    'code_insee',
    'code_postal_principal',
    'departement',
    'region',
    'latitude',
    'longitude',
  ];
  for (const col of colonnes) {
    if (!entete.includes(col)) {
      throw new Error(`Colonne manquante dans le CSV : ${col}`);
    }
  }
  const idx: Record<string, number> = Object.fromEntries(
    colonnes.map((c) => [c, entete.indexOf(c)]),
  );

  return lignes.slice(1).map((ligne, i) => {
    const parts = ligne.split(',');
    const get = (col: string): string | null => {
      const pos = idx[col];
      if (pos === undefined) return null;
      const v = parts[pos];
      return v === undefined || v.trim() === '' ? null : v.trim();
    };
    const lat = get('latitude');
    const lng = get('longitude');
    const slug = get('slug');
    const nom = get('nom');
    if (slug === null || nom === null) {
      throw new Error(`Ligne ${i + 2} : slug ou nom manquant.`);
    }
    return {
      slug,
      nom,
      code_insee: get('code_insee'),
      code_postal_principal: get('code_postal_principal'),
      departement: get('departement'),
      region: get('region'),
      latitude: lat === null ? null : Number.parseFloat(lat),
      longitude: lng === null ? null : Number.parseFloat(lng),
    };
  });
}

async function main(): Promise<void> {
  const arg = process.argv[2];
  if (arg === undefined || arg === '') {
    console.error('Usage : npx tsx scripts/import-communes.ts <fichier.csv>');
    process.exit(1);
  }
  const chemin = resolve(arg);
  const contenu = readFileSync(chemin, 'utf-8');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || url === '' || key === undefined || key === '') {
    console.error('Variables d’env Supabase manquantes (URL ou SERVICE_ROLE_KEY).');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const lignes = parserCsv(contenu);
  // biome-ignore lint/suspicious/noConsoleLog: trace explicite de l'import CLI.
  console.log(`${lignes.length} communes à importer.`);

  let succes = 0;
  let echecs = 0;
  for (const ligne of lignes) {
    const { error } = await supabase.from('commune').upsert(
      {
        slug: ligne.slug,
        nom: ligne.nom,
        code_insee: ligne.code_insee,
        code_postal_principal: ligne.code_postal_principal,
        departement: ligne.departement,
        region: ligne.region,
        latitude: ligne.latitude,
        longitude: ligne.longitude,
        statut_creation: 'pre_creee',
      },
      { onConflict: 'slug' },
    );
    if (error !== null) {
      console.error(`Échec ${ligne.slug}: ${error.message}`);
      echecs += 1;
    } else {
      succes += 1;
    }
  }

  // biome-ignore lint/suspicious/noConsoleLog: récap final de l'import CLI.
  console.log(`Import terminé : ${succes} succès, ${echecs} échecs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
