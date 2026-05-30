/**
 * Sauvegarde des tables critiques via l'API REST (clé de service).
 *
 * Contexte : avant d'appliquer des migrations sur la base de production, on
 * veut un filet de sécurité. `supabase db dump` exige une connexion Postgres
 * directe (Docker + host direct), indisponible ici (host direct non résolu).
 * Ce script lit les tables via l'API REST (HTTPS, comme le site) et écrit
 * chaque table dans un fichier JSON hors du dépôt.
 *
 * Couvre les données irremplaçables (signatures, communes, profils) ET les
 * tables réseau que les migrations en attente touchent.
 *
 * Usage :
 *   npx tsx --env-file=.env.local --env-file=.env scripts/backup-rest.ts <dossier-sortie>
 *
 * Sécurité : LECTURE SEULE. N'écrit que des fichiers JSON locaux.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const TABLES = [
  // Données irremplaçables
  'signature_petition',
  'commune',
  'personne',
  'profil_unifie',
  // Tables réseau touchées par les migrations en attente
  'relation_reseau',
  'message_reseau',
  'post_reseau',
  'reaction_reseau',
  'commentaire_reseau',
  'abonnement_espace_reseau',
];

const TAILLE_PAGE = 1000;

async function main() {
  const dossier = process.argv[2];
  if (dossier === undefined || dossier === '') {
    console.error('Usage : npx tsx ... scripts/backup-rest.ts <dossier-sortie>');
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cleService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || url === '' || cleService === undefined || cleService === '') {
    console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis.');
    process.exit(1);
  }

  const supabase = createClient(url, cleService, { auth: { persistSession: false } });
  mkdirSync(dossier, { recursive: true });

  const resume: Record<string, number> = {};
  for (const table of TABLES) {
    const lignes: unknown[] = [];
    let debut = 0;
    // Pagination : l'API plafonne à 1000 lignes par requête.
    for (;;) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .range(debut, debut + TAILLE_PAGE - 1);
      if (error !== null) {
        console.error(`  ! ${table} : ${error.message}`);
        break;
      }
      if (data === null || data.length === 0) break;
      lignes.push(...data);
      if (data.length < TAILLE_PAGE) break;
      debut += TAILLE_PAGE;
    }
    writeFileSync(join(dossier, `${table}.json`), JSON.stringify(lignes), 'utf8');
    resume[table] = lignes.length;
    console.info(`  ✓ ${table} : ${lignes.length} lignes`);
  }

  writeFileSync(join(dossier, '_resume.json'), JSON.stringify(resume, null, 2), 'utf8');
  console.info('\nSauvegarde terminée dans', dossier);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
