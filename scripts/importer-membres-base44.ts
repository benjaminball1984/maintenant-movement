/**
 * Script d'import des membres Base44 vers Maintenant! (V2.4.96).
 *
 * Lit `data-migration/Membres.csv` exporté depuis l'admin Base44 et
 * crée les comptes correspondants dans Supabase Auth + ligne `personne`.
 *
 * Différences avec `scripts/migrer-base44.ts` (qui ne fait qu'un rapport) :
 * - Vrai import via Supabase Admin API (`auth.admin.createUser`)
 * - Ligne `personne` créée explicitement (pas de trigger auto en V1)
 * - Email pré-confirmé (les membres Base44 étaient déjà engagés)
 * - Idempotent : skip si email existe déjà dans auth.users
 *
 * Mapping CSV → Supabase :
 *   user_email      → auth.users.email
 *   first_name      → personne.prenom
 *   last_name       → personne.nom
 *   postal_code     → personne.code_postal
 *   phone           → personne.telephone
 *   status (active) → personne.statut
 *
 * Usage :
 *   npx tsx scripts/importer-membres-base44.ts --dry-run
 *   npx tsx scripts/importer-membres-base44.ts --confirm
 *
 * Affiche un progress tous les 50 membres. Continue sur erreur (ne
 * stoppe pas tout : un email mal formé ou un doublon ne bloque pas
 * les 2839 autres).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const CHEMIN_CSV = 'data-migration/Membres.csv';
const FORMAT_PROGRESS = new Intl.NumberFormat('fr-FR');

/**
 * Wrapper de log pour la sortie CLI. Évite de répéter `biome-ignore`
 * sur chacun des 22 `console.log` du script.
 */
// biome-ignore lint/suspicious/noConsoleLog: usage CLI legitime, log wrappe console.log.
const log = (s: string): void => {
  process.stdout.write(`${s}\n`);
};
const logErreur = (s: string): void => {
  process.stderr.write(`${s}\n`);
};

interface MembreBase44 {
  email: string;
  prenom: string | null;
  nom: string | null;
  codePostal: string | null;
  telephone: string | null;
  statut: string;
  membershipType: string;
  receiveNewsletter: boolean;
  /** Date d'inscription Base44 (ISO). Sert au tri chronologique et au
   * dédoublonnage (on garde la plus ancienne occurrence d'un email). */
  createdDate: string | null;
}

/**
 * Parseur CSV robuste qui gère les valeurs entre guillemets et les
 * virgules à l'intérieur (au cas où). Suffisant pour les CSV Base44
 * standards.
 */
function parserLigne(ligne: string): string[] {
  const champs: string[] = [];
  let actuel = '';
  let dansGuillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (c === '"') {
      dansGuillemets = !dansGuillemets;
    } else if (c === ',' && !dansGuillemets) {
      champs.push(actuel);
      actuel = '';
    } else {
      actuel += c;
    }
  }
  champs.push(actuel);
  return champs;
}

function normaliserChaine(s: string | undefined): string | null {
  if (s === undefined || s === null) return null;
  const t = s.trim();
  if (t === '' || t === '""') return null;
  return t.replace(/^"|"$/g, '').trim();
}

function lireCsvMembres(): MembreBase44[] {
  const csv = readFileSync(resolve(CHEMIN_CSV), 'utf-8');
  const lignes = csv.split('\n').filter((l) => l.trim() !== '');
  if (lignes.length === 0) return [];
  const header = parserLigne(lignes[0] ?? '').map((c) => c.trim());
  const idx = (col: string) => header.indexOf(col);

  const iEmail = idx('user_email');
  const iPrenom = idx('first_name');
  const iNom = idx('last_name');
  const iCP = idx('postal_code');
  const iTel = idx('phone');
  const iStatut = idx('status');
  const iMembership = idx('membership_type');
  const iNewsletter = idx('receive_newsletter');
  const iCreated = idx('created_date');

  const membres: MembreBase44[] = [];
  for (const ligne of lignes.slice(1)) {
    const parts = parserLigne(ligne);
    const email = normaliserChaine(parts[iEmail])?.toLowerCase();
    if (email === undefined || email === null || !email.includes('@')) continue;
    membres.push({
      email,
      prenom: normaliserChaine(parts[iPrenom]),
      nom: normaliserChaine(parts[iNom]),
      codePostal: normaliserChaine(parts[iCP]),
      telephone: normaliserChaine(parts[iTel]),
      statut: normaliserChaine(parts[iStatut]) ?? 'actif',
      membershipType: normaliserChaine(parts[iMembership]) ?? 'free',
      receiveNewsletter: normaliserChaine(parts[iNewsletter]) === 'true',
      createdDate: normaliserChaine(parts[iCreated]),
    });
  }
  return membres;
}

/**
 * Dédoublonne par email (lowercase). Pour chaque doublon, garde la
 * plus ancienne occurrence (premier inscrit, plus authentique).
 *
 * Retourne un tuple [uniques, nbDoublons].
 */
function dedoublonnerParEmail(membres: MembreBase44[]): {
  uniques: MembreBase44[];
  nbDoublons: number;
  exemples: Array<{ email: string; nbOccurrences: number }>;
} {
  const parEmail = new Map<string, MembreBase44[]>();
  for (const m of membres) {
    const liste = parEmail.get(m.email);
    if (liste === undefined) parEmail.set(m.email, [m]);
    else liste.push(m);
  }

  const uniques: MembreBase44[] = [];
  const exemples: Array<{ email: string; nbOccurrences: number }> = [];
  let nbDoublons = 0;

  for (const [email, liste] of parEmail.entries()) {
    if (liste.length > 1) {
      nbDoublons += liste.length - 1;
      if (exemples.length < 5) {
        exemples.push({ email, nbOccurrences: liste.length });
      }
      // Trie par createdDate ASC (le plus ancien d'abord), garde le premier
      liste.sort((a, b) => {
        if (a.createdDate === null) return 1;
        if (b.createdDate === null) return -1;
        return a.createdDate.localeCompare(b.createdDate);
      });
    }
    uniques.push(liste[0] as MembreBase44);
  }

  return { uniques, nbDoublons, exemples };
}

/**
 * Trie les membres par date d'inscription Base44 ASC (plus anciens d'abord).
 */
function trierParAnciennete(membres: MembreBase44[]): MembreBase44[] {
  return [...membres].sort((a, b) => {
    if (a.createdDate === null) return 1;
    if (b.createdDate === null) return -1;
    return a.createdDate.localeCompare(b.createdDate);
  });
}

interface Compteurs {
  total: number;
  importes: number;
  dejaExistant: number;
  erreurs: number;
  emailsInvalides: number;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const estDryRun = args.includes('--dry-run');
  const estConfirme = args.includes('--confirm');

  if (!estDryRun && !estConfirme) {
    logErreur(
      'Refus : précisez --dry-run (rapport) ou --confirm (import effectif via Supabase Admin API).',
    );
    process.exit(1);
  }
  if (estDryRun && estConfirme) {
    logErreur('--dry-run et --confirm sont mutuellement exclusifs.');
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || url === '' || key === undefined || key === '') {
    logErreur(
      "Variables d'env Supabase manquantes (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).",
    );
    process.exit(1);
  }
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  log(`[${estDryRun ? 'DRY-RUN' : 'CONFIRM'}] Lecture de ${CHEMIN_CSV}...`);
  const brut = lireCsvMembres();
  log(`${FORMAT_PROGRESS.format(brut.length)} lignes lues depuis le CSV (brut).`);

  // Dédoublonnage par email
  const { uniques: membres, nbDoublons, exemples } = dedoublonnerParEmail(brut);
  log(
    `Dédoublonnage : ${FORMAT_PROGRESS.format(nbDoublons)} doublons retirés → ${FORMAT_PROGRESS.format(membres.length)} membres uniques.`,
  );
  if (exemples.length > 0) {
    log('Exemples de doublons :');
    for (const e of exemples) {
      log(`  - ${e.email} : ${e.nbOccurrences} occurrences`);
    }
  }

  // Statistiques par statut Base44
  const parStatut = new Map<string, number>();
  for (const m of membres) {
    parStatut.set(m.statut, (parStatut.get(m.statut) ?? 0) + 1);
  }
  log('\nRépartition par statut Base44 (après dédoublonnage) :');
  for (const [statut, nb] of parStatut.entries()) {
    log(`  - ${statut} : ${FORMAT_PROGRESS.format(nb)}`);
  }

  const nbAvecNewsletter = membres.filter((m) => m.receiveNewsletter).length;
  log(`Newsletter Base44 opt-in : ${FORMAT_PROGRESS.format(nbAvecNewsletter)}`);
  log(
    `Sans téléphone : ${FORMAT_PROGRESS.format(membres.filter((m) => m.telephone === null).length)}`,
  );
  log(
    `Sans code postal : ${FORMAT_PROGRESS.format(membres.filter((m) => m.codePostal === null).length)}`,
  );

  // Tri chronologique pour afficher les premiers inscrits
  const triesParAnciennete = trierParAnciennete(membres);

  if (estDryRun) {
    log('\n[DRY-RUN] Aucune écriture en base.');
    log('\n=== 5 PREMIÈRES PERSONNES DEVENUES MEMBRES (par created_date ASC) ===');
    for (const [i, m] of triesParAnciennete.slice(0, 5).entries()) {
      const dateLisible =
        m.createdDate !== null ? new Date(m.createdDate).toLocaleString('fr-FR') : '(inconnue)';
      const nomComplet = `${m.prenom ?? ''} ${m.nom ?? ''}`.trim() || '(sans nom)';
      log(
        `  ${i + 1}. ${m.email}\n     ${nomComplet}, CP ${m.codePostal ?? '—'}\n     inscrit·e le ${dateLisible}`,
      );
    }
    log('\nPour importer effectivement, relancer avec --confirm.');
    return;
  }

  // En mode confirm, importer dans l'ordre chronologique (plus respectueux des
  // ancien·nes membres : leur compte se crée dans le même ordre qu'au temps Base44).
  const aImporter = triesParAnciennete;

  // Import effectif
  log('\n[CONFIRM] Import en cours...');
  const compteurs: Compteurs = {
    total: aImporter.length,
    importes: 0,
    dejaExistant: 0,
    erreurs: 0,
    emailsInvalides: 0,
  };

  for (let i = 0; i < aImporter.length; i++) {
    const m = aImporter[i];
    if (m === undefined) continue;

    try {
      // 1. Tente de créer l'utilisateur dans auth.users
      const { data: userData, error: erreurAuth } = await supabase.auth.admin.createUser({
        email: m.email,
        email_confirm: true, // pré-confirmé, ils étaient déjà engagés
        user_metadata: {
          prenom: m.prenom,
          nom: m.nom,
          importe_base44: true,
          importe_le: new Date().toISOString(),
        },
      });

      if (erreurAuth !== null) {
        const msg = erreurAuth.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists')) {
          compteurs.dejaExistant += 1;
          continue;
        }
        if (msg.includes('invalid') && msg.includes('email')) {
          compteurs.emailsInvalides += 1;
          continue;
        }
        logErreur(`  [${i + 1}/${aImporter.length}] ${m.email} : ${erreurAuth.message}`);
        compteurs.erreurs += 1;
        continue;
      }

      const userId = userData.user?.id;
      if (userId === undefined) {
        logErreur(`  [${i + 1}/${aImporter.length}] ${m.email} : user créé sans id`);
        compteurs.erreurs += 1;
        continue;
      }

      // 2. Insère la ligne personne correspondante
      const { error: erreurPersonne } = await supabase.from('personne').insert({
        id: userId,
        email: m.email,
        prenom: m.prenom,
        nom: m.nom,
        code_postal: m.codePostal,
        telephone: m.telephone,
        email_verifie: true,
        statut: 'actif',
      });

      if (erreurPersonne !== null) {
        logErreur(`  [${i + 1}/${aImporter.length}] ${m.email} : ${erreurPersonne.message}`);
        // On n'incrémente pas erreurs car le user auth existe.
        // C'est dégradé mais réparable par un script de fixup.
        compteurs.importes += 1;
        continue;
      }

      compteurs.importes += 1;

      // Progress
      if ((i + 1) % 50 === 0) {
        log(
          `  [${FORMAT_PROGRESS.format(i + 1)}/${FORMAT_PROGRESS.format(aImporter.length)}] importés=${FORMAT_PROGRESS.format(compteurs.importes)} déjà=${FORMAT_PROGRESS.format(compteurs.dejaExistant)} erreurs=${FORMAT_PROGRESS.format(compteurs.erreurs)}`,
        );
      }
    } catch (erreur) {
      logErreur(`  [${i + 1}/${aImporter.length}] ${m.email} : exception ${String(erreur)}`);
      compteurs.erreurs += 1;
    }
  }

  log('\n=== Import terminé ===');
  log(`Total CSV          : ${FORMAT_PROGRESS.format(compteurs.total)}`);
  log(`Importés (nouveaux) : ${FORMAT_PROGRESS.format(compteurs.importes)}`);
  log(`Déjà existants     : ${FORMAT_PROGRESS.format(compteurs.dejaExistant)}`);
  log(`Emails invalides   : ${FORMAT_PROGRESS.format(compteurs.emailsInvalides)}`);
  log(`Erreurs            : ${FORMAT_PROGRESS.format(compteurs.erreurs)}`);
}

main().catch((e) => {
  logErreur(e);
  process.exit(1);
});
