#!/usr/bin/env node
/**
 * Validateur de message de commit (hook commit-msg via Lefthook).
 *
 * Formats acceptés (cf. CLAUDE.md §7) :
 *
 *   Cycle V1 (phases numérotées 0 à 13) :
 *     phase N - chantier N.X - description courte
 *     fix - phase N - chantier N.X - description courte
 *
 *   Cycle V2 (numérotation V2.x pour ne pas collisionner avec les phases V1,
 *   cf. docs/cdc-v2/03-PLAN-IMPLEMENTATION.md) :
 *     phase V2.W - chantier V2.W.X - description courte
 *     fix - phase V2.W - chantier V2.W.X - description courte
 *
 * Avec N, W, X entiers (ex : `phase 0 - chantier 0.1`, `phase V2.0 - chantier V2.0.1`).
 *
 * Le chemin du fichier message de commit est passé en argv[2] par Lefthook.
 * Sortie 0 si conforme, 1 sinon.
 */
import { readFileSync } from 'node:fs';

const fichier = process.argv[2];
if (fichier === undefined) {
  console.error('check-commit-msg : chemin du fichier message manquant.');
  process.exit(1);
}

const contenu = readFileSync(fichier, 'utf-8');
const premiereLigne = contenu.split('\n')[0] ?? '';

const regex = /^(fix - )?phase (V2\.\d+|\d+) - chantier (V2\.\d+\.\d+|\d+\.\d+) - .+/;

if (!regex.test(premiereLigne)) {
  console.error('Message de commit non conforme.');
  console.error('Format attendu :');
  console.error('  phase N - chantier N.X - description courte');
  console.error('  fix - phase N - chantier N.X - description courte');
  console.error('  phase V2.W - chantier V2.W.X - description courte');
  console.error('  fix - phase V2.W - chantier V2.W.X - description courte');
  console.error('');
  console.error(`Reçu : ${premiereLigne}`);
  process.exit(1);
}

process.exit(0);
