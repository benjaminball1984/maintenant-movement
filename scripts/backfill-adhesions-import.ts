/**
 * Backfill des adhésions pour les membres importés de Base44 (revue 2026-06-11).
 *
 * Constat : l'import des membres (scripts/importer-membres-base44.ts) a bien
 * créé les comptes auth.users + lignes `personne` (470 sur le distant), mais
 * PAS les lignes `adhesion`. Or le compteur public « Membres » de la page
 * d'accueil (RPC `compter_membres_actifs`) compte les personnes ayant une
 * adhésion `active` non expirée. Résultat : « MEMBRES 1 » alors que 470
 * membres existent.
 *
 * Ce script crée, pour chaque `personne` au statut `actif` qui n'a PAS
 * d'adhésion active en cours, une adhésion :
 *   - chemin     : 'gratuit' (les membres Base44 avaient une adhésion libre)
 *   - statut     : 'active'
 *   - debute_le  : maintenant (la migration ouvre une nouvelle année
 *                  d'adhésion ; les dates Base44 d'origine auraient expiré
 *                  une partie des membres, ce qui contredirait la reprise)
 *   - expire_le  : maintenant + 365 jours (défaut de la table)
 *
 * Idempotent : relancer le script ne crée rien pour les personnes ayant déjà
 * une adhésion active. Aucune ligne existante n'est modifiée ni supprimée
 * (doctrine de greffe : on additionne, on ne soustrait jamais).
 *
 * Usage :
 *   npx tsx scripts/backfill-adhesions-import.ts --dry-run
 *   npx tsx scripts/backfill-adhesions-import.ts --confirm
 */

import { createClient } from '@supabase/supabase-js';

const log = (s: string): void => {
  process.stdout.write(`${s}\n`);
};
const logErreur = (s: string): void => {
  process.stderr.write(`${s}\n`);
};

/** Taille des lots d'insertion (REST PostgREST accepte des tableaux). */
const TAILLE_LOT = 200;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const estDryRun = args.includes('--dry-run');
  const estConfirme = args.includes('--confirm');

  if (!estDryRun && !estConfirme) {
    logErreur('Refus : précisez --dry-run (rapport) ou --confirm (écriture).');
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

  // 1. Toutes les personnes actives (pagination par lots de 1000).
  const personnes: string[] = [];
  for (let depuis = 0; ; depuis += 1000) {
    const { data, error } = await supabase
      .from('personne')
      .select('id')
      .eq('statut', 'actif')
      .range(depuis, depuis + 999);
    if (error !== null) {
      logErreur(`Lecture personne impossible : ${error.message}`);
      process.exit(1);
    }
    const ids = (data ?? []).map((p) => p.id as string);
    personnes.push(...ids);
    if (ids.length < 1000) break;
  }
  log(`Personnes actives : ${personnes.length}`);

  // 2. Personnes ayant déjà une adhésion active non expirée.
  const dejaMembres = new Set<string>();
  for (let depuis = 0; ; depuis += 1000) {
    const { data, error } = await supabase
      .from('adhesion')
      .select('personne_id')
      .eq('statut', 'active')
      .gt('expire_le', new Date().toISOString())
      .range(depuis, depuis + 999);
    if (error !== null) {
      logErreur(`Lecture adhesion impossible : ${error.message}`);
      process.exit(1);
    }
    for (const a of data ?? []) {
      dejaMembres.add(a.personne_id as string);
    }
    if ((data ?? []).length < 1000) break;
  }
  log(`Personnes déjà adhérentes (adhésion active) : ${dejaMembres.size}`);

  // 3. Diff : personnes sans adhésion active.
  const aCreer = personnes.filter((id) => !dejaMembres.has(id));
  log(`Adhésions gratuites à créer : ${aCreer.length}`);

  if (estDryRun) {
    log('\n[DRY-RUN] Aucune écriture. Relancer avec --confirm pour créer.');
    return;
  }

  // 4. Insertion par lots.
  const maintenant = new Date();
  const expire = new Date(maintenant.getTime() + 365 * 24 * 60 * 60 * 1000);
  let crees = 0;
  for (let i = 0; i < aCreer.length; i += TAILLE_LOT) {
    const lot = aCreer.slice(i, i + TAILLE_LOT).map((personneId) => ({
      personne_id: personneId,
      chemin: 'gratuit',
      statut: 'active',
      debute_le: maintenant.toISOString(),
      expire_le: expire.toISOString(),
    }));
    const { error } = await supabase.from('adhesion').insert(lot);
    if (error !== null) {
      logErreur(`Lot ${i / TAILLE_LOT + 1} en échec : ${error.message}`);
      process.exit(1);
    }
    crees += lot.length;
    log(`  ${crees}/${aCreer.length} adhésions créées...`);
  }

  // 5. Vérification finale via la RPC publique.
  const { data: compteur, error: erreurRpc } = await supabase.rpc('compter_membres_actifs');
  if (erreurRpc !== null) {
    logErreur(`RPC compter_membres_actifs en échec : ${erreurRpc.message}`);
  } else {
    log(`\nCompteur « Membres » après backfill : ${String(compteur)}`);
  }
}

main().catch((e) => {
  logErreur(String(e));
  process.exit(1);
});
