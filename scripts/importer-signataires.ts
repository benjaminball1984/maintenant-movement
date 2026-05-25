/**
 * Script d'import des 5 pétitions et de leurs signatures (chantier 13.3).
 *
 * Réconciliation avec le schéma existant (décision 13.3) : les signatures
 * importées vont dans la table existante `signature_petition`, qui accepte déjà
 * les signataires SANS compte (`personne_id` nullable).
 *
 * Identité durable (chantier 13.3-E) : chaque signataire est rattaché à un
 * `profil_unifie` (numéro M+7 stable, indépendant de l'email), trouvé-ou-créé
 * par email via la fonction `trouver_ou_creer_profil_unifie`. Quand la personne
 * créera son compte avec ce même email, ses signatures remonteront dans
 * « Mes contributions » (rattachement à la vérification de l'email).
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
 * requiert aucune variable d'env. `--confirm` : attribue les 5 pétitions au
 * compte de Benjamin Ball (FK créateurice), les upsert (statut
 * `en_moderation`, contenu en placeholder), puis insère les signatures
 * manquantes par lots. Idempotent : ré-exécuter n'insère pas de doublon
 * (unicité `(petition_id, lower(email))`).
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

/**
 * Créateurice des pétitions importées. `petition.createurice_id` est une FK
 * NOT NULL vers `personne(id)`, lui-même lié à `auth.users` : il faut donc un
 * vrai compte. On attribue provisoirement les 5 pétitions au compte de
 * Benjamin Ball, qui les réattribuera ensuite via ses droits d'édition.
 */
const CREATEUR_EMAIL = 'lifebenjaminaeron.ball@gmail.com';

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

/**
 * Réessaie une opération Supabase tant qu'elle renvoie une erreur réseau
 * transitoire (« fetch failed »), avec un backoff léger. Le réseau vers
 * Supabase peut être instable depuis cet environnement d'exécution.
 */
async function avecReessais<R extends { error: unknown }>(
  // Les requêtes Supabase renvoient un `PostgrestBuilder`, qui est un thenable
  // (PromiseLike) et non une vraie `Promise` : on accepte donc PromiseLike.
  operation: () => PromiseLike<R>,
  essais = 5,
): Promise<R> {
  let resultat = await operation();
  for (let i = 1; i < essais && resultat.error !== null; i += 1) {
    await new Promise((r) => setTimeout(r, 800 * i));
    resultat = await operation();
  }
  return resultat;
}

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

  // 1. Créateurice des pétitions = compte existant de Benjamin Ball.
  const { data: createur, error: errCreateur } = await avecReessais(() =>
    supabase.from('personne').select('id').eq('email', CREATEUR_EMAIL).maybeSingle(),
  );
  if (errCreateur !== null || createur === null) {
    console.error(
      `Compte créateurice introuvable pour ${CREATEUR_EMAIL}. Vérifier que ce compte existe en base.`,
    );
    process.exit(1);
  }
  const createurId = createur.id as string;

  // 2. Les 5 pétitions (placeholders, statut en_moderation : la créateurice
  //    pourra les éditer/réattribuer via ses droits avant publication).
  const slugVersId = new Map<string, string>();
  for (const { nomCsv, slug } of PETITIONS) {
    const objectif = objectifProvisoire(rapport.parPetition[slug] ?? 0);
    const { data, error } = await avecReessais(() =>
      supabase
        .from('petition')
        .upsert(
          {
            slug,
            titre: `[TITRE À METTRE — provisoire : ${nomCsv}]`,
            texte: LOREM,
            destinataire: '[DESTINATAIRE À METTRE]',
            objectif,
            createurice_id: createurId,
            statut: 'en_moderation',
          },
          { onConflict: 'slug' },
        )
        .select('id')
        .single(),
    );
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
      const { data, error } = await avecReessais(() =>
        supabase
          .from('signature_petition')
          .select('email')
          .eq('petition_id', id)
          .range(from, from + 999),
      );
      if (error !== null || data === null || data.length === 0) break;
      for (const row of data) dejaPresent.add(`${id}::${normaliserEmail(row.email)}`);
      if (data.length < 1000) break;
      from += 1000;
    }
  }

  // 4. Signatures manquantes à insérer (les déjà présentes sont ignorées).
  const candidats = rapport.signatures
    .map((s) => {
      const petitionId = slugVersId.get(s.petitionSlug);
      if (petitionId === undefined) return null;
      if (dejaPresent.has(`${petitionId}::${s.emailLower}`)) return null;
      return { s, petitionId };
    })
    .filter((r): r is { s: SignatureImport; petitionId: string } => r !== null);

  // 5. Identité durable : un profil unifié par email (chantier 13.3-E). On ne
  //    résout que les emails réellement à insérer (efficace en ré-exécution),
  //    dédupliqués (un appel RPC par email unique, pas par signature).
  const emailsUniques = new Map<string, string>(); // emailLower -> email original
  for (const { s } of candidats) {
    if (!emailsUniques.has(s.emailLower)) emailsUniques.set(s.emailLower, s.email);
  }
  const profilParEmail = new Map<string, string>();
  for (const [emailLower, email] of emailsUniques) {
    const { data, error } = await avecReessais(() =>
      supabase.rpc('trouver_ou_creer_profil_unifie', { email_cible: email }),
    );
    if (error !== null || data === null) {
      console.error(`Profil unifié non résolu pour ${emailLower} : ${error?.message ?? 'null'}`);
      continue;
    }
    profilParEmail.set(emailLower, data as string);
  }

  const aInserer = candidats.map(({ s, petitionId }) => ({
    petition_id: petitionId,
    personne_id: null,
    profil_unifie_id: profilParEmail.get(s.emailLower) ?? null,
    nom: s.nom,
    prenom: s.prenom,
    email: s.email,
    code_postal: s.code_postal,
    telephone: s.telephone,
    accepte_newsletter: s.accepte_newsletter,
    accepte_contact_createurice: s.accepte_contact_createurice,
  }));

  let succes = 0;
  let echecs = 0;
  for (let i = 0; i < aInserer.length; i += TAILLE_LOT) {
    const lot = aInserer.slice(i, i + TAILLE_LOT);
    const { error } = await avecReessais(() => supabase.from('signature_petition').insert(lot));
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
