/**
 * Script de backfill des entrées de caisse depuis l'historique V1
 * (cycle V2 V2.3.28, complète V2.3.27).
 *
 * **Contexte** : V2.3.27 a branché les NOUVELLES confirmations de
 * paiement aux caisses (`transaction_entrante`). Les dons et adhésions
 * confirmés AVANT ce branchement ne sont pas dans la trésorerie V2 ;
 * l'historique reste dans les tables `don` et `adhesion`. Ce script
 * rejoue l'historique pour peupler les caisses.
 *
 * **Règles de backfill** :
 * 1. Parcourir `don` où `statut = 'confirme'` et `cagnotte_id IS NOT NULL`.
 * 2. Pour chaque don, obtenir/créer la caisse de la cagnotte, poser
 *    l'entrée. Canal `euro` si `monnaie = 'EUR'`, `99_coin` si `T99CP`.
 * 3. Parcourir `adhesion` où `statut = 'active'` ou `montant_*_centimes/unites > 0`.
 *    Pour chaque adhésion payante, obtenir/créer la caisse globale
 *    `adhesion`, poser l'entrée.
 *
 * **Idempotence** : l'index unique partiel sur
 * `transaction_entrante (source_type, source_id) WHERE statut IN ('initiee','confirmee')`
 * (V2.3.26) garantit qu'un même don ou adhésion ne crée qu'une entrée.
 * Le helper `poserEntreeCaisse` (V2.3.27) attrape les violations 23505
 * et les compte comme succès idempotent.
 *
 * **Sécurité** : `--dry-run` par défaut (requis sinon). Lit le service
 * role key dans l'environnement. Affiche le détail des actions, ne pose
 * rien sans `--confirm` explicite.
 *
 * Usage :
 *   npx tsx scripts/backfill-caisses.ts --dry-run
 *   npx tsx scripts/backfill-caisses.ts --confirm
 *
 * Préalable `--confirm` :
 * - `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` dans l'env.
 * - Migrations `20260527050000_caisse.sql` (V2.2.3) et
 *   `20260527110000_transaction_entrante.sql` (V2.3.26) appliquées
 *   distant.
 */

import { createClient } from '@supabase/supabase-js';

interface Arguments {
  modeDryRun: boolean;
  modeConfirm: boolean;
}

function parserArguments(argv: string[]): Arguments {
  const modeDryRun = argv.includes('--dry-run');
  const modeConfirm = argv.includes('--confirm');
  if (!modeDryRun && !modeConfirm) {
    console.error('Usage : npx tsx scripts/backfill-caisses.ts --dry-run | --confirm');
    process.exit(1);
  }
  if (modeDryRun && modeConfirm) {
    console.error('Choisis --dry-run OU --confirm, pas les deux.');
    process.exit(1);
  }
  return { modeDryRun, modeConfirm };
}

async function main() {
  const { modeDryRun } = parserArguments(process.argv);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cleService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || url === '' || cleService === undefined || cleService === '') {
    console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis.');
    process.exit(1);
  }

  const supabase = createClient(url, cleService, {
    auth: { persistSession: false },
  });

  console.info(`\n=== Backfill caisses (${modeDryRun ? 'DRY-RUN' : 'CONFIRM'}) ===\n`);

  let donsAPoser = 0;
  let donsDejaPoses = 0;
  let donsCagnottesInconnues = 0;
  let donsErreurs = 0;
  let adhesionsAPoser = 0;
  let adhesionsDejaPosees = 0;
  let adhesionsErreurs = 0;

  // ============================================================
  // 1. Dons confirmés
  // ============================================================
  console.info('--- Dons confirmés ---');
  const { data: dons, error: erreurDons } = await supabase
    .from('don')
    .select('id, cagnotte_id, monnaie, montant_centimes, personne_id')
    .eq('statut', 'confirme');

  if (erreurDons !== null) {
    console.error('Lecture dons impossible :', erreurDons.message);
    process.exit(1);
  }

  console.info(`${dons?.length ?? 0} dons confirmés trouvés.`);

  for (const don of dons ?? []) {
    if (don.cagnotte_id === null) {
      donsCagnottesInconnues += 1;
      continue;
    }

    const { data: cagnotte } = await supabase
      .from('cagnotte')
      .select('id, titre')
      .eq('id', don.cagnotte_id)
      .maybeSingle();
    if (cagnotte === null) {
      donsCagnottesInconnues += 1;
      continue;
    }

    if (modeDryRun) {
      const montantAffiche =
        don.monnaie === 'T99CP'
          ? `${don.montant_centimes} 99c`
          : `${(don.montant_centimes / 100).toFixed(2)} €`;
      console.info(
        `[DRY] don ${don.id.slice(0, 8)} → caisse cagnotte « ${cagnotte.titre.slice(0, 60)} » : ${montantAffiche}`,
      );
      donsAPoser += 1;
      continue;
    }

    // Obtient/crée la caisse cagnotte.
    const { data: caisseExistante } = await supabase
      .from('caisse')
      .select('id')
      .eq('type_caisse', 'cagnotte')
      .eq('objet_type', 'cagnotte')
      .eq('objet_id', cagnotte.id)
      .eq('statut', 'ouverte')
      .maybeSingle();

    let caisseId = caisseExistante?.id ?? null;
    if (caisseId === null) {
      const { data: nouvelleCaisse, error: erreurCaisse } = await supabase
        .from('caisse')
        .insert({
          type_caisse: 'cagnotte',
          libelle: `Cagnotte : ${cagnotte.titre.slice(0, 180)}`,
          objet_type: 'cagnotte',
          objet_id: cagnotte.id,
        })
        .select('id')
        .single();
      if (erreurCaisse !== null || nouvelleCaisse === null) {
        console.error(`Échec création caisse cagnotte ${cagnotte.id} :`, erreurCaisse?.message);
        donsErreurs += 1;
        continue;
      }
      caisseId = nouvelleCaisse.id;
    }

    const canal = don.monnaie === 'T99CP' ? '99_coin' : 'euro';
    const montant = don.monnaie === 'T99CP' ? don.montant_centimes : don.montant_centimes / 100;

    const { error: erreurInsert } = await supabase.from('transaction_entrante').insert({
      caisse_id: caisseId,
      source_type: 'don',
      source_id: don.id,
      montant,
      canal,
      statut: 'confirmee',
      motif: `Backfill don sur cagnotte « ${cagnotte.titre.slice(0, 100)} »`,
      payeur_personne_id: don.personne_id ?? null,
      metadata: { backfill: true, monnaie: don.monnaie },
    });

    if (erreurInsert !== null) {
      if (erreurInsert.code === '23505') {
        donsDejaPoses += 1;
      } else {
        console.error(`Échec insert entrée don ${don.id.slice(0, 8)} :`, erreurInsert.message);
        donsErreurs += 1;
      }
    } else {
      donsAPoser += 1;
    }
  }

  // ============================================================
  // 2. Adhésions payantes
  // ============================================================
  console.info('\n--- Adhésions payantes ---');
  const { data: adhesions, error: erreurAdh } = await supabase
    .from('adhesion')
    .select(
      'id, personne_id, chemin, montant_euros_centimes, montant_t99cp_unites, stripe_session_id, tx_hash',
    );

  if (erreurAdh !== null) {
    console.error('Lecture adhésions impossible :', erreurAdh.message);
    process.exit(1);
  }

  const adhesionsPayantes = (adhesions ?? []).filter(
    (a) => a.chemin === 'euros' || a.chemin === 't99cp',
  );
  console.info(
    `${adhesionsPayantes.length} adhésions payantes trouvées (sur ${adhesions?.length ?? 0}).`,
  );

  // Obtient ou crée la caisse globale adhésion une seule fois.
  let caisseAdhesionId: string | null = null;
  if (!modeDryRun && adhesionsPayantes.length > 0) {
    const { data: caisseExistante } = await supabase
      .from('caisse')
      .select('id')
      .eq('type_caisse', 'adhesion')
      .is('objet_id', null)
      .eq('statut', 'ouverte')
      .maybeSingle();
    if (caisseExistante !== null) {
      caisseAdhesionId = caisseExistante.id;
    } else {
      const { data: nouvelle } = await supabase
        .from('caisse')
        .insert({
          type_caisse: 'adhesion',
          libelle: 'Adhésions du mouvement',
          objet_type: null,
          objet_id: null,
        })
        .select('id')
        .single();
      caisseAdhesionId = nouvelle?.id ?? null;
    }
  }

  for (const adh of adhesionsPayantes) {
    const canal = adh.chemin === 'euros' ? 'euro' : '99_coin';
    const montant =
      adh.chemin === 'euros'
        ? (adh.montant_euros_centimes ?? 0) / 100
        : Number(adh.montant_t99cp_unites ?? 0);

    if (montant <= 0) {
      // Adhésion payante sans montant : skip (donnée corrompue).
      continue;
    }

    if (modeDryRun) {
      const montantAffiche = canal === 'euro' ? `${montant.toFixed(2)} €` : `${montant} 99c`;
      console.info(
        `[DRY] adhésion ${adh.id.slice(0, 8)} → caisse globale adhésion : ${montantAffiche}`,
      );
      adhesionsAPoser += 1;
      continue;
    }

    if (caisseAdhesionId === null) {
      console.error('Pas de caisse adhésion disponible.');
      adhesionsErreurs += 1;
      continue;
    }

    const { error: erreurInsert } = await supabase.from('transaction_entrante').insert({
      caisse_id: caisseAdhesionId,
      source_type: 'adhesion',
      source_id: adh.id,
      montant,
      canal,
      statut: 'confirmee',
      motif: `Backfill adhésion (chemin ${adh.chemin})`,
      payeur_personne_id: adh.personne_id,
      metadata: {
        backfill: true,
        stripe_session_id: adh.stripe_session_id ?? null,
        tx_hash: adh.tx_hash ?? null,
      },
    });

    if (erreurInsert !== null) {
      if (erreurInsert.code === '23505') {
        adhesionsDejaPosees += 1;
      } else {
        console.error(`Échec insert entrée adhésion ${adh.id.slice(0, 8)} :`, erreurInsert.message);
        adhesionsErreurs += 1;
      }
    } else {
      adhesionsAPoser += 1;
    }
  }

  console.info('\n=== Récapitulatif ===');
  console.info(`Dons posés : ${donsAPoser}`);
  console.info(`Dons déjà posés (idempotence) : ${donsDejaPoses}`);
  console.info(`Dons sans cagnotte trouvable : ${donsCagnottesInconnues}`);
  console.info(`Dons en erreur : ${donsErreurs}`);
  console.info(`Adhésions posées : ${adhesionsAPoser}`);
  console.info(`Adhésions déjà posées (idempotence) : ${adhesionsDejaPosees}`);
  console.info(`Adhésions en erreur : ${adhesionsErreurs}`);
  console.info(
    `\nMode : ${modeDryRun ? 'DRY-RUN (aucune écriture)' : 'CONFIRM (écritures effectuées)'}`,
  );
}

main().catch((erreur) => {
  console.error('\nErreur fatale :', erreur);
  process.exit(1);
});
