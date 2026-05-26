/**
 * Script de backfill `droit_admin` (V1) → `droit` (V2) (cycle V2,
 * chantier V2.1.3).
 *
 * **Contexte** : la V1 modélise les permissions admin par 6 niveaux fixes
 * (`national`, `admin`, `moderation`, `tresorerie`, `animation`, `dpd`)
 * dans `droit_admin`. La décision D10 V2 (cf. matrice-droits-V2.md MD1)
 * exige des droits **atomiques** dans une nouvelle table `droit`. Ce
 * script projette les lignes ACTIVES de `droit_admin` vers `droit`
 * selon la table de mapping `lib/droit-presets.ts`, en utilisant la
 * projection pure `lib/droit-projection.ts`.
 *
 * **Coexistence stricte** : `droit_admin` reste intacte. Les helpers
 * RLS V1 (`est_admin_general`, `est_moderateurice`, etc.) continuent de
 * lire `droit_admin` tant que la migration applicative vers `droit`
 * n'est pas faite, chantier par chantier. Personne ne perd ses droits.
 *
 * **Idempotence** : la table `droit` a un index unique partiel sur
 * `(personne_id, type_droit, COALESCE(cible_type), COALESCE(cible_id))`
 * pour les lignes actives. Le script utilise `upsert` qui ne crée pas
 * de doublons en cas de réexécution.
 *
 * **Lignes V1 retirées** : non projetées (la projection les filtre).
 * Le passé reste figé dans `droit_admin`.
 *
 * **Sécurité** : `--dry-run` requis explicitement par défaut, `--confirm`
 * exigé pour écrire. Credentials = `SUPABASE_SERVICE_ROLE_KEY`, jamais
 * commités.
 *
 * Usage :
 *   npx tsx scripts/backfill-droits.ts --dry-run
 *   npx tsx scripts/backfill-droits.ts --confirm
 *
 * Préalable `--confirm` : `NEXT_PUBLIC_SUPABASE_URL` et
 * `SUPABASE_SERVICE_ROLE_KEY` dans l'environnement, et la migration
 * `20260527020000_droit.sql` appliquée au distant.
 */

import { createClient } from '@supabase/supabase-js';
import type { PresetV1 } from '../lib/droit-presets';
import {
  type LigneDroitAdminSource,
  type LigneDroitCible,
  projeterDroitAdminEnDroits,
} from '../lib/droit-projection';

interface Arguments {
  modeDryRun: boolean;
}

const TAILLE_LOT = 500;

function lireArguments(): Arguments {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const confirm = args.includes('--confirm');
  if (!dryRun && !confirm) {
    console.error('Erreur : passer soit `--dry-run` (analyse), soit `--confirm` (écriture).');
    process.exit(1);
  }
  if (dryRun && confirm) {
    console.error('Erreur : choisir entre `--dry-run` et `--confirm`, pas les deux.');
    process.exit(1);
  }
  return { modeDryRun: dryRun };
}

function obtenirClientSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || url === '' || cle === undefined || cle === '') {
    console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.');
    process.exit(1);
  }
  return createClient(url, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type LigneDroitAdminPaginee = LigneDroitAdminSource & { id: string };

async function executer(): Promise<void> {
  const { modeDryRun } = lireArguments();
  console.info(`Mode : ${modeDryRun ? '🌵 DRY-RUN (lecture seule)' : '🔥 CONFIRM (écriture)'}`);

  const supabase = obtenirClientSupabase();

  let totalLignesV1 = 0;
  let totalLignesV1Retirees = 0;
  let totalDroitsProjetes = 0;
  const compteurParNiveau = new Map<PresetV1, number>();
  let lastAccordeLe = '0000-01-01T00:00:00Z';
  let lastId = '00000000-0000-0000-0000-000000000000';

  for (;;) {
    const { data, error } = await supabase
      .from('droit_admin')
      .select(
        'id, personne_id, niveau, scope_commune_id, perimetre_onglet, accorde_par, accorde_le, retire_le',
      )
      .or(`accorde_le.gt.${lastAccordeLe},and(accorde_le.eq.${lastAccordeLe},id.gt.${lastId})`)
      .order('accorde_le', { ascending: true })
      .order('id', { ascending: true })
      .limit(TAILLE_LOT);

    if (error !== null) {
      console.error(`Erreur lecture droit_admin : ${error.message}`);
      process.exit(1);
    }

    const lot = (data ?? []) as LigneDroitAdminPaginee[];
    if (lot.length === 0) break;

    const droitsProjetes: LigneDroitCible[] = [];
    for (const ligne of lot) {
      totalLignesV1 += 1;
      if (ligne.retire_le !== null) {
        totalLignesV1Retirees += 1;
        continue;
      }
      const projection = projeterDroitAdminEnDroits(ligne);
      droitsProjetes.push(...projection);
      compteurParNiveau.set(
        ligne.niveau,
        (compteurParNiveau.get(ligne.niveau) ?? 0) + projection.length,
      );
    }

    totalDroitsProjetes += droitsProjetes.length;

    if (!modeDryRun && droitsProjetes.length > 0) {
      const { error: errUpsert } = await supabase.from('droit').upsert(droitsProjetes, {
        onConflict: 'personne_id,type_droit,cible_type,cible_id',
        ignoreDuplicates: true,
      });
      if (errUpsert !== null) {
        console.error(`Erreur upsert droit : ${errUpsert.message}`);
        process.exit(1);
      }
    }

    const dernier = lot[lot.length - 1];
    if (dernier !== undefined) {
      lastAccordeLe = dernier.accorde_le;
      lastId = dernier.id;
    }
    process.stdout.write(
      `\r  V1 parcourues : ${totalLignesV1}, droits atomiques projetés : ${totalDroitsProjetes}`,
    );
  }

  console.info('');
  console.info('---');
  console.info(`Total lignes droit_admin lues   : ${totalLignesV1}`);
  console.info(`  dont retirées (ignorées)      : ${totalLignesV1Retirees}`);
  console.info(`Droits atomiques projetés      : ${totalDroitsProjetes}`);
  for (const [niveau, nb] of compteurParNiveau.entries()) {
    console.info(`  via preset ${niveau.padEnd(12)} : ${nb}`);
  }
  console.info('');
  if (modeDryRun) {
    console.info('🌵 DRY-RUN terminé. Aucune écriture effectuée.');
    console.info('   Pour appliquer : relance avec `--confirm`.');
  } else {
    console.info('🔥 CONFIRM terminé. Lignes upsertées (idempotentes).');
  }
}

executer().catch((erreur) => {
  console.error('Erreur non gérée :', erreur);
  process.exit(1);
});
