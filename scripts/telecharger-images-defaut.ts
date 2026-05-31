/**
 * Téléchargement des images par défaut par type d'objet (chantier V2.6.27).
 *
 * Remplit `public/defaults/*.jpg` avec de vraies photos curées, une par type
 * d'objet, qui servent d'image par défaut tant qu'une personne n'a pas
 * téléversé la sienne (cf. `lib/images-defaut.ts` et l'exigence transversale
 * ET1 : « tout objet partageable a TOUJOURS une image »).
 *
 * Source : Unsplash (https://unsplash.com). Toutes les photos sont sous
 * **licence Unsplash** (usage gratuit, commercial et non commercial, sans
 * obligation d'attribution : https://unsplash.com/license). Les fichiers sont
 * téléchargés depuis le CDN Unsplash, recadrés en 16/9 (1200x675), qualité 80.
 *
 * Pourquoi un script et pas un simple téléchargement manuel : pour garder une
 * **trace de provenance** (quelle photo pour quel type) et pour que Lilou/Ben
 * puisse remplacer une image en changeant un identifiant ici puis en relançant
 * `npx tsx scripts/telecharger-images-defaut.ts`. Aucune clé API n'est requise.
 *
 * Note : ce script fait des appels réseau. Il est lancé à la main, jamais en
 * CI ni dans les tests.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Carte « nom de fichier dans public/defaults » → identifiant de photo Unsplash.
 * L'identifiant est la partie `photo-<timestamp>-<hash>` de l'URL du CDN.
 * Le sujet de chaque photo est indiqué en commentaire pour faciliter le tri.
 */
const IMAGES: Record<string, string> = {
  'petition.jpg': 'photo-1603796846097-bee99e4a601f', // mains qui signent un document
  'mobilisation.jpg': 'photo-1511898634545-c01af8a54dd5', // grande manifestation de rue
  'campagne.jpg': 'photo-1560220604-1985ebfe28b1', // bénévoles d'un collectif
  'cagnotte.jpg': 'photo-1582213782179-e0d53f98f2ca', // mains solidaires empilées
  'moment-solidaire.jpg': 'photo-1593113616828-6f22bca04804', // bénévoles préparant des repas
  'offre-marche.jpg': 'photo-1557844352-761f2565b576', // étal de légumes au marché
  'commune.jpg': 'photo-1690899374803-d71bc70d272d', // toits de tuiles d'un village
  'gt-thematique.jpg': 'photo-1517048676732-d65bc937f952', // réunion de travail autour d'une table
  'article.jpg': 'photo-1495020689067-958852a7765e', // personne qui lit le journal
  'sondage.jpg': 'photo-1551288049-bebda4e38f71', // graphiques et données
  'service-sel.jpg': 'photo-1695049761557-cb56d348c297', // deux mains qui se tendent (échange)
  'offre-entraide.jpg': 'photo-1461532257246-777de18cd58b', // une main qui en soutient une autre
  'organisation.jpg': 'photo-1681949103006-70066fb25dfe', // équipe au travail devant un tableau
};

/** Paramètres de recadrage appliqués à chaque image (16/9, qualité 80). */
const PARAMS = 'w=1200&h=675&fit=crop&q=80';

const DOSSIER = join(process.cwd(), 'public', 'defaults');

async function main(): Promise<void> {
  await mkdir(DOSSIER, { recursive: true });
  let ok = 0;
  let echecs = 0;

  for (const [fichier, idPhoto] of Object.entries(IMAGES)) {
    const url = `https://images.unsplash.com/${idPhoto}?${PARAMS}`;
    try {
      const reponse = await fetch(url);
      if (!reponse.ok) {
        console.error(`✗ ${fichier} : HTTP ${reponse.status}`);
        echecs += 1;
        continue;
      }
      const buffer = Buffer.from(await reponse.arrayBuffer());
      await writeFile(join(DOSSIER, fichier), buffer);
      // biome-ignore lint/suspicious/noConsoleLog: sortie CLI volontaire.
      console.log(`✓ ${fichier} (${Math.round(buffer.length / 1024)} Ko)`);
      ok += 1;
    } catch (erreur) {
      console.error(`✗ ${fichier} : ${(erreur as Error).message}`);
      echecs += 1;
    }
  }

  // biome-ignore lint/suspicious/noConsoleLog: sortie CLI volontaire.
  console.log(`\nTerminé : ${ok} image(s) téléchargée(s), ${echecs} échec(s).`);
  if (echecs > 0) process.exitCode = 1;
}

void main();
