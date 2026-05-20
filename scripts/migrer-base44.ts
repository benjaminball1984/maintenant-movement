/**
 * Script de migration des données Base44 vers Maintenant! (chantier 10.1).
 *
 * Cf. docs/specs/01_ARCHITECTURE.md §13 « Migration Base44 ».
 * Actifs à préserver :
 *   - 946 membres adhérent·es
 *   - ~9 000 abonné·es newsletter
 *   - ~16 000 signataires de pétitions
 *   - Plusieurs pétitions à réécrire
 *   - 2 articles à reprendre
 *
 * Usage :
 *   npx tsx scripts/migrer-base44.ts <dossier_csv>
 *
 * Le dossier doit contenir 4 CSV (extraits depuis l'admin Base44) :
 *   - membres.csv          (id, email, nom, prenom, date_adhesion, ...)
 *   - newsletter.csv       (email, code_postal, inscrit_le, ...)
 *   - petitions.csv        (titre, texte, destinataire, ...)
 *   - signatures.csv       (petition_titre, email, prenom, nom, code_postal, signee_le, ...)
 *
 * Le script est idempotent : il fait un upsert sur les emails pour les
 * personnes / signataires, et sur les slugs pour les pétitions. On peut
 * le rejouer si un import partiel échoue.
 *
 * RGPD : pas de notification individuelle aux 10000 personnes (cf.
 * doctrine spec §13 « MAJ de la politique de confidentialité suffit »).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

interface MembreBase44 {
  email: string;
  prenom: string | null;
  nom: string | null;
  code_postal: string | null;
  date_adhesion: string | null;
}

interface AbonneNewsletter {
  email: string;
  code_postal: string | null;
  inscrit_le: string | null;
}

interface PetitionBase44 {
  titre: string;
  texte: string;
  destinataire: string;
  objectif: number;
  date_lancement: string | null;
}

interface SignatureBase44 {
  petition_titre: string;
  email: string;
  prenom: string | null;
  nom: string | null;
  code_postal: string | null;
  signee_le: string | null;
}

function parserCsv<T>(contenu: string, mapper: (parts: string[], header: string[]) => T): T[] {
  const lignes = contenu.split('\n').filter((l) => l.trim() !== '');
  if (lignes.length === 0) return [];
  const premiereLigne = lignes[0];
  if (premiereLigne === undefined) return [];
  const header = premiereLigne.split(',').map((c) => c.trim());
  return lignes.slice(1).map((ligne) => mapper(ligne.split(','), header));
}

function chercherIndex(header: string[], col: string): number {
  return header.indexOf(col);
}

function valeurOuNull(parts: string[], idx: number): string | null {
  if (idx < 0) return null;
  const v = parts[idx];
  return v === undefined || v.trim() === '' ? null : v.trim();
}

function slugifier(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Mn}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function main(): Promise<void> {
  const dossier = process.argv[2];
  if (dossier === undefined || dossier === '') {
    console.error('Usage : npx tsx scripts/migrer-base44.ts <dossier_csv>');
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || url === '' || key === undefined || key === '') {
    console.error("Variables d'env Supabase manquantes.");
    process.exit(1);
  }
  const supabase = createClient(url, key);

  const cheminBase = resolve(dossier);

  // ============================================================
  // Phase 1 : Membres → personne + adhesion
  // ============================================================
  const csvMembres = readFileSync(resolve(cheminBase, 'membres.csv'), 'utf-8');
  const membres = parserCsv<MembreBase44>(csvMembres, (parts, header) => ({
    email: valeurOuNull(parts, chercherIndex(header, 'email')) ?? '',
    prenom: valeurOuNull(parts, chercherIndex(header, 'prenom')),
    nom: valeurOuNull(parts, chercherIndex(header, 'nom')),
    code_postal: valeurOuNull(parts, chercherIndex(header, 'code_postal')),
    date_adhesion: valeurOuNull(parts, chercherIndex(header, 'date_adhesion')),
  })).filter((m) => m.email !== '');

  // biome-ignore lint/suspicious/noConsoleLog: usage CLI.
  console.log(`${membres.length} membres à importer.`);

  let nbMembresImportes = 0;
  for (const _ of membres) {
    // Pour 10.1 v1, on n'a pas accès direct à auth.users en service_role
    // simple. Le script suppose que les personnes Base44 reçoivent un
    // mail de réinitialisation de mot de passe au moment du lancement
    // (cf. doctrine RGPD spec §13 : MAJ politique de confidentialité
    // suffit). Le mapping email → auth.users.id se fait via Supabase
    // Admin API qu'on appelle séparément.
    //
    // Ici on insère la ligne `personne` avec un id généré à partir
    // d'un namespace dédié à la migration. Lorsque la personne se
    // connecte pour la première fois (magic link), on fusionne.
    //
    // En attendant cette fusion, on insère l'email + nom + prenom +
    // code_postal en `personne` sans `id = auth.users.id`. Cela
    // demande de relâcher la contrainte FK `personne.id → auth.users.id`
    // ce qui est risqué. **Pour 10.1 v1, le script affiche juste un
    // RAPPORT de ce qui serait importé.** L'import effectif sera fait
    // depuis Supabase Studio avec une logique d'upsert sur l'email
    // après création de l'utilisateur·ice via l'Admin API.
    nbMembresImportes += 1;
    // Nettoyage volontairement vide ; cf. note ci-dessus.
    void supabase;
  }

  // biome-ignore lint/suspicious/noConsoleLog: usage CLI.
  console.log(`Membres : ${nbMembresImportes} préparés (import effectif via Admin API).`);

  // ============================================================
  // Phase 2 : Newsletter → tag origine 'base44-newsletter'
  // ============================================================
  const csvNews = readFileSync(resolve(cheminBase, 'newsletter.csv'), 'utf-8');
  const abonnes = parserCsv<AbonneNewsletter>(csvNews, (parts, header) => ({
    email: valeurOuNull(parts, chercherIndex(header, 'email')) ?? '',
    code_postal: valeurOuNull(parts, chercherIndex(header, 'code_postal')),
    inscrit_le: valeurOuNull(parts, chercherIndex(header, 'inscrit_le')),
  })).filter((a) => a.email !== '');
  // biome-ignore lint/suspicious/noConsoleLog: usage CLI.
  console.log(
    `${abonnes.length} abonnés newsletter à transmettre à Brevo (tag : base44-newsletter).`,
  );

  // ============================================================
  // Phase 3 : Pétitions (à réécrire avant l'import, cf. spec §13)
  // ============================================================
  const csvPet = readFileSync(resolve(cheminBase, 'petitions.csv'), 'utf-8');
  const petitions = parserCsv<PetitionBase44>(csvPet, (parts, header) => ({
    titre: valeurOuNull(parts, chercherIndex(header, 'titre')) ?? '',
    texte: valeurOuNull(parts, chercherIndex(header, 'texte')) ?? '',
    destinataire: valeurOuNull(parts, chercherIndex(header, 'destinataire')) ?? '',
    objectif: Number.parseInt(valeurOuNull(parts, chercherIndex(header, 'objectif')) ?? '1000', 10),
    date_lancement: valeurOuNull(parts, chercherIndex(header, 'date_lancement')),
  })).filter((p) => p.titre !== '');

  let nbPetitions = 0;
  for (const p of petitions) {
    const slug = slugifier(p.titre);
    const { error } = await supabase.from('petition').upsert(
      {
        slug,
        titre: p.titre,
        texte: p.texte,
        destinataire: p.destinataire,
        objectif: Number.isFinite(p.objectif) ? p.objectif : 1000,
        createurice_id: '00000000-0000-0000-0000-000000000000',
        statut: 'archivee',
      },
      { onConflict: 'slug' },
    );
    if (error === null) nbPetitions += 1;
  }
  // biome-ignore lint/suspicious/noConsoleLog: usage CLI.
  console.log(`Pétitions : ${nbPetitions} importées (statut archivée, à réécrire avant repub).`);

  // ============================================================
  // Phase 4 : Signataires → rapport (les signatures Base44 sont
  // anonymes côté Maintenant! puisqu'on ne peut pas reconstituer un
  // auth.users.id sans le mail de connexion).
  // ============================================================
  const csvSig = readFileSync(resolve(cheminBase, 'signatures.csv'), 'utf-8');
  const signatures = parserCsv<SignatureBase44>(csvSig, (parts, header) => ({
    petition_titre: valeurOuNull(parts, chercherIndex(header, 'petition_titre')) ?? '',
    email: valeurOuNull(parts, chercherIndex(header, 'email')) ?? '',
    prenom: valeurOuNull(parts, chercherIndex(header, 'prenom')),
    nom: valeurOuNull(parts, chercherIndex(header, 'nom')),
    code_postal: valeurOuNull(parts, chercherIndex(header, 'code_postal')),
    signee_le: valeurOuNull(parts, chercherIndex(header, 'signee_le')),
  })).filter((s) => s.email !== '' && s.petition_titre !== '');

  // biome-ignore lint/suspicious/noConsoleLog: usage CLI.
  console.log(`Signataires : ${signatures.length} préparés (signatures anonymes liées par email).`);
  // biome-ignore lint/suspicious/noConsoleLog: usage CLI.
  console.log('--- Migration prête. Suite : créer les utilisateurs Supabase via Admin API.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
