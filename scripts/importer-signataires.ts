/**
 * Script d'import des 5 pétitions et de leurs signatures (chantier 13.3).
 *
 * Réconciliation avec le schéma existant (décision 13.3) : on N'AJOUTE PAS
 * de tables `personnes`/`actions` parallèles. Les signatures importées vont
 * dans la table existante `signature_petition`, qui accepte déjà les
 * signataires SANS compte (`personne_id` nullable). Le « profil qui
 * s'enrichit » repose sur l'email : quand une personne créera un compte,
 * l'app reliera ses signatures par email.
 *
 * Sources (dossier data-migration/) :
 *   - profils_unifies.csv   : email → prenom, nom, telephone, code_postal,
 *                             accepte_newsletter (niveau personne).
 *   - signatures_detail.csv : 1 ligne par (email, pétition) avec le
 *                             consentement `autorise_recontact_createur`
 *                             (niveau signature, propre à chaque pétition).
 *
 * Usage :
 *   npx tsx scripts/importer-signataires.ts data-migration --dry-run
 *   npx tsx scripts/importer-signataires.ts data-migration --confirm
 *
 * `--dry-run` : parse, joint, contrôle la qualité, n'écrit RIEN et ne
 * requiert aucune variable d'env. `--confirm` : crée la personne système,
 * upsert les 5 pétitions (statut `archivee`, contenu en placeholder), puis
 * insère les signatures manquantes par lots. Idempotent : ré-exécuter
 * n'insère pas de doublon (unicité `(petition_id, lower(email))`).
 *
 * Préalable `--confirm` : `NEXT_PUBLIC_SUPABASE_URL` et
 * `SUPABASE_SERVICE_ROLE_KEY` dans l'environnement.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// Constantes métier
// ============================================================

/** Personne « système » porteuse des pétitions importées (pas de compte auth). */
const SYSTEME_ID = '00000000-0000-0000-0000-000000000001';

/** Correspondance nom de pétition (CSV) → slug cible. */
const PETITIONS: ReadonlyArray<{ nomCsv: string; slug: string }> = [
  { nomCsv: 'Epstein', slug: 'epstein' },
  { nomCsv: 'Baranoux', slug: 'baranoux' },
  { nomCsv: 'Antifasciste', slug: 'antifasciste' },
  { nomCsv: 'Cuba', slug: 'cuba' },
  { nomCsv: 'Ritchy', slug: 'ritchy' },
];

const EMAIL_REGEX = /^[^@]+@[^@]+\.[^@]+$/;
const CP_REGEX = /^\d{5}$/;
const TAILLE_LOT = 500;

// ============================================================
// Types
// ============================================================

interface Profil {
  prenom: string;
  nom: string;
  telephone: string | null;
  accepteNewsletter: boolean;
}

interface SignatureImport {
  petitionSlug: string;
  email: string;
  emailLower: string;
  prenom: string;
  nom: string;
  telephone: string | null;
  code_postal: string;
  accepte_newsletter: boolean;
  accepte_contact_createurice: boolean;
}

// ============================================================
// Parsing CSV (fichiers non quotés, séparateur virgule)
// ============================================================

function lireColonnes(ligne: string): string[] {
  return ligne.split(',').map((c) => c.trim());
}

function indexer(entete: string[], colonnes: string[]): Record<string, number> {
  const idx: Record<string, number> = {};
  for (const col of colonnes) {
    const pos = entete.indexOf(col);
    if (pos < 0) throw new Error(`Colonne manquante : ${col}`);
    idx[col] = pos;
  }
  return idx;
}

/** Valeur trimée d'une colonne pour une ligne donnée (chaîne vide si absente). */
function champ(parts: string[], idx: Record<string, number>, col: string): string {
  const pos = idx[col];
  if (pos === undefined) return '';
  const v = parts[pos];
  return v === undefined ? '' : v.trim();
}

function normaliserEmail(brut: string): string {
  return brut.trim().toLowerCase();
}

/** Construit la table email → profil depuis profils_unifies.csv. */
function chargerProfils(chemin: string): Map<string, Profil> {
  const lignes = readFileSync(chemin, 'utf-8')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '');
  const entete = lireColonnes(lignes[0] ?? '');
  const idx = indexer(entete, ['email', 'prenom', 'nom', 'telephone', 'accepte_newsletter']);

  const map = new Map<string, Profil>();
  for (const ligne of lignes.slice(1)) {
    const parts = lireColonnes(ligne);
    const email = champ(parts, idx, 'email');
    if (email === '') continue;
    const telephone = champ(parts, idx, 'telephone');
    map.set(normaliserEmail(email), {
      prenom: champ(parts, idx, 'prenom'),
      nom: champ(parts, idx, 'nom'),
      telephone: telephone === '' ? null : telephone,
      accepteNewsletter: champ(parts, idx, 'accepte_newsletter').toLowerCase() === 'oui',
    });
  }
  return map;
}

interface RapportParsing {
  signatures: SignatureImport[];
  parPetition: Record<string, number>;
  ignorees: { emailInvalide: number; cpInvalide: number; petitionInconnue: number };
  sansProfil: number;
  doublons: number;
}

/** Parse signatures_detail.csv et joint les profils. */
function chargerSignatures(chemin: string, profils: Map<string, Profil>): RapportParsing {
  const lignes = readFileSync(chemin, 'utf-8')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '');
  const entete = lireColonnes(lignes[0] ?? '');
  const idx = indexer(entete, ['email', 'petition', 'code_postal', 'autorise_recontact_createur']);

  const slugParNom = new Map(PETITIONS.map((p) => [p.nomCsv.toLowerCase(), p.slug]));
  const signatures: SignatureImport[] = [];
  const parPetition: Record<string, number> = {};
  const ignorees = { emailInvalide: 0, cpInvalide: 0, petitionInconnue: 0 };
  const vues = new Set<string>();
  let sansProfil = 0;
  let doublons = 0;

  for (const ligne of lignes.slice(1)) {
    const parts = lireColonnes(ligne);
    const email = champ(parts, idx, 'email');
    const emailLower = normaliserEmail(email);
    const slug = slugParNom.get(champ(parts, idx, 'petition').toLowerCase());
    const code_postal = champ(parts, idx, 'code_postal');
    const recontact = champ(parts, idx, 'autorise_recontact_createur').toLowerCase() === 'oui';

    if (slug === undefined) {
      ignorees.petitionInconnue += 1;
      continue;
    }
    if (!EMAIL_REGEX.test(email)) {
      ignorees.emailInvalide += 1;
      continue;
    }
    if (!CP_REGEX.test(code_postal)) {
      ignorees.cpInvalide += 1;
      continue;
    }

    // Anti-doublon en mémoire : une signature par (pétition, email).
    const cle = `${slug}::${emailLower}`;
    if (vues.has(cle)) {
      doublons += 1;
      continue;
    }
    vues.add(cle);

    const profil = profils.get(emailLower);
    if (profil === undefined) sansProfil += 1;

    signatures.push({
      petitionSlug: slug,
      email,
      emailLower,
      prenom: profil?.prenom ?? '',
      nom: profil?.nom ?? '',
      telephone: profil?.telephone ?? null,
      code_postal,
      accepte_newsletter: profil?.accepteNewsletter ?? false,
      accepte_contact_createurice: recontact,
    });
    parPetition[slug] = (parPetition[slug] ?? 0) + 1;
  }

  return { signatures, parPetition, ignorees, sansProfil, doublons };
}

// ============================================================
// Helpers d'écriture
// ============================================================

/** Objectif provisoire : arrondi au millier supérieur, minimum 1000. */
function objectifProvisoire(nbSignatures: number): number {
  return Math.max(1000, Math.ceil(nbSignatures / 1000) * 1000);
}

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. [TEXTE À FAIRE : reprendre ou réécrire le texte réel de la pétition avant publication.]';

function lireMode(): { dossier: string; estDryRun: boolean } {
  const args = process.argv.slice(2);
  const dossier = args.find((a) => !a.startsWith('--'));
  const estDryRun = args.includes('--dry-run');
  const estConfirme = args.includes('--confirm');
  if (dossier === undefined || dossier === '') {
    console.error(
      'Usage : npx tsx scripts/importer-signataires.ts <dossier> [--dry-run | --confirm]',
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
  return { dossier, estDryRun };
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  const { dossier, estDryRun } = lireMode();
  const base = resolve(dossier);

  const profils = chargerProfils(resolve(base, 'profils_unifies.csv'));
  const rapport = chargerSignatures(resolve(base, 'signatures_detail.csv'), profils);

  // biome-ignore lint/suspicious/noConsoleLog: trace CLI.
  console.log(`Profils chargés : ${profils.size}`);
  // biome-ignore lint/suspicious/noConsoleLog: trace CLI.
  console.log(`Signatures retenues : ${rapport.signatures.length}`);
  for (const { slug } of PETITIONS) {
    // biome-ignore lint/suspicious/noConsoleLog: trace CLI.
    console.log(`  - ${slug} : ${rapport.parPetition[slug] ?? 0}`);
  }
  // biome-ignore lint/suspicious/noConsoleLog: trace CLI.
  console.log(
    `Ignorées : email invalide ${rapport.ignorees.emailInvalide}, CP invalide ${rapport.ignorees.cpInvalide}, pétition inconnue ${rapport.ignorees.petitionInconnue} ; doublons ${rapport.doublons} ; signatures sans profil joint ${rapport.sansProfil}.`,
  );

  if (estDryRun) {
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

  // 1. Personne système (porteuse des pétitions importées).
  const { error: errSysteme } = await supabase
    .from('personne')
    .upsert(
      { id: SYSTEME_ID, prenom: 'Système', nom: 'Import', statut: 'actif' },
      { onConflict: 'id' },
    );
  if (errSysteme !== null) {
    console.error(`Personne système : ${errSysteme.message}`);
    process.exit(1);
  }

  // 2. Les 5 pétitions (placeholders, statut archivee tant que non réécrites).
  const slugVersId = new Map<string, string>();
  for (const { nomCsv, slug } of PETITIONS) {
    const objectif = objectifProvisoire(rapport.parPetition[slug] ?? 0);
    const { data, error } = await supabase
      .from('petition')
      .upsert(
        {
          slug,
          titre: `[TITRE À METTRE — provisoire : ${nomCsv}]`,
          texte: LOREM,
          destinataire: '[DESTINATAIRE À METTRE]',
          objectif,
          createurice_id: SYSTEME_ID,
          statut: 'archivee',
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();
    if (error !== null || data === null) {
      console.error(`Pétition ${slug} : ${error?.message ?? 'erreur'}`);
      process.exit(1);
    }
    slugVersId.set(slug, data.id);
  }

  // 3. Signatures existantes (idempotence) : on ne réinsère pas.
  const dejaPresent = new Set<string>();
  for (const id of slugVersId.values()) {
    let from = 0;
    for (;;) {
      const { data, error } = await supabase
        .from('signature_petition')
        .select('email')
        .eq('petition_id', id)
        .range(from, from + 999);
      if (error !== null || data === null || data.length === 0) break;
      for (const row of data) dejaPresent.add(`${id}::${normaliserEmail(row.email)}`);
      if (data.length < 1000) break;
      from += 1000;
    }
  }

  // 4. Insertion par lots des signatures manquantes.
  const aInserer = rapport.signatures
    .map((s) => {
      const petitionId = slugVersId.get(s.petitionSlug);
      if (petitionId === undefined) return null;
      if (dejaPresent.has(`${petitionId}::${s.emailLower}`)) return null;
      return {
        petition_id: petitionId,
        personne_id: null,
        nom: s.nom,
        prenom: s.prenom,
        email: s.email,
        code_postal: s.code_postal,
        telephone: s.telephone,
        accepte_newsletter: s.accepte_newsletter,
        accepte_contact_createurice: s.accepte_contact_createurice,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  let succes = 0;
  let echecs = 0;
  for (let i = 0; i < aInserer.length; i += TAILLE_LOT) {
    const lot = aInserer.slice(i, i + TAILLE_LOT);
    const { error } = await supabase.from('signature_petition').insert(lot);
    if (error !== null) {
      console.error(`Échec lot ${i / TAILLE_LOT + 1} : ${error.message}`);
      echecs += lot.length;
    } else {
      succes += lot.length;
    }
  }

  // biome-ignore lint/suspicious/noConsoleLog: récap final CLI.
  console.log(
    `Import terminé : ${succes} signatures insérées, ${echecs} échecs, ${rapport.signatures.length - aInserer.length} déjà présentes.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
