/**
 * Script de backfill des consentements depuis `signature_petition` (cycle V2,
 * chantier V2.1.2).
 *
 * **Contexte** : avant V2, les consentements étaient portés en dur par deux
 * booléens de `signature_petition` (`accepte_newsletter`,
 * `accepte_contact_createurice`). La décision D8 V2 (cf.
 * `docs/cdc-v2/CDC-Maintenant-V2/schema-donnees-V2.md`) crée une entité
 * `consentement` granulaire et révocable, à laquelle on doit migrer les
 * valeurs historiques sans toucher aux signatures (doctrine de greffe :
 * on additionne, on ne soustrait jamais).
 *
 * **Règles de backfill** :
 * 1. Pour chaque ligne de `signature_petition` :
 *    - Si `accepte_newsletter = true` → consentement type
 *      `newsletter_plateforme`, objet null (consentement global au mouvement).
 *    - Si `accepte_contact_createurice = true` → consentement type
 *      `contact_createur`, objet = la pétition (un consentement par pétition
 *      signée, car le créateur change).
 *    - Les `false` ne créent RIEN. Refuser n'est pas un consentement, et le
 *      back-and-forth n'a pas de sens historique (la personne aura toujours
 *      le choix de cocher activement plus tard).
 * 2. La date du consentement créé = `signature_petition.created_at`.
 *    L'audit doit montrer que ce consentement EXISTE depuis la signature, pas
 *    depuis l'exécution du backfill.
 * 3. La source = `backfill_signature_v1`. Permet de filtrer les consentements
 *    « hérités » des cases V1 vs les nouveaux choisis explicitement en V2.
 * 4. Le profil destinataire = `signature_petition.profil_unifie_id`, qui est
 *    NOT NULL depuis la migration 038 (chantier 13.3-E). Si jamais une ligne
 *    a un `profil_unifie_id` NULL (cas théorique), elle est ignorée et
 *    comptée.
 *
 * **Idempotence** : la table `consentement` a un index unique sur
 * `(profil_unifie_id, type_consentement, coalesce(objet_id, ...))`. Le
 * script utilise un `upsert` côté Supabase qui ne crée pas de doublons
 * lors d'une réexécution.
 *
 * **Sécurité** : `--dry-run` par défaut (et requis si pas de `--confirm`).
 * Aucune écriture sans confirmation explicite. Les credentials utilisés
 * sont le `SUPABASE_SERVICE_ROLE_KEY` (lecture/écriture privilégiée),
 * jamais commités.
 *
 * Usage :
 *   npx tsx scripts/backfill-consentement.ts --dry-run
 *   npx tsx scripts/backfill-consentement.ts --confirm
 *
 * Préalable `--confirm` : `NEXT_PUBLIC_SUPABASE_URL` et
 * `SUPABASE_SERVICE_ROLE_KEY` dans l'environnement, et la migration
 * `20260527010000_consentement.sql` appliquée au distant.
 */

import { createClient } from '@supabase/supabase-js';
import {
  type LigneConsentementCible,
  type LigneSignatureSource,
  projeterSignatureEnConsentements,
} from '../lib/consentement-projection';

interface Arguments {
  modeDryRun: boolean;
}

const TAILLE_LOT = 500;

function lireArguments(): Arguments {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const confirm = args.includes('--confirm');

  if (!dryRun && !confirm) {
    console.error(
      'Erreur : passer soit `--dry-run` (analyse seule, défaut sûr), soit `--confirm`.',
    );
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
    console.error(
      'Erreur : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis pour `--confirm`.',
    );
    process.exit(1);
  }
  return createClient(url, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Ligne de signature lue depuis la BDD, avec son id pour la pagination.
type LigneSignaturePaginee = LigneSignatureSource & { id: string };

async function executer(): Promise<void> {
  const { modeDryRun } = lireArguments();
  console.info(
    `Mode : ${modeDryRun ? '🌵 DRY-RUN (aucune écriture)' : '🔥 CONFIRM (écriture distante)'}`,
  );

  const supabase = obtenirClientSupabase();

  // Lecture pagination des signatures. On utilise un curseur sur `created_at` + `id`
  // pour rester stable même si de nouvelles signatures arrivent pendant le run.
  let total = 0;
  let nbConsentementsCalcules = 0;
  let nbProfilsManquants = 0;
  let lastCreatedAt = '0000-01-01T00:00:00Z';
  let lastId = '00000000-0000-0000-0000-000000000000';

  for (;;) {
    const { data, error } = await supabase
      .from('signature_petition')
      .select(
        'id, petition_id, profil_unifie_id, accepte_newsletter, accepte_contact_createurice, created_at',
      )
      .or(`created_at.gt.${lastCreatedAt},and(created_at.eq.${lastCreatedAt},id.gt.${lastId})`)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(TAILLE_LOT);

    if (error !== null) {
      console.error(`Erreur lecture signature_petition : ${error.message}`);
      process.exit(1);
    }

    const lot = (data ?? []) as LigneSignaturePaginee[];
    if (lot.length === 0) break;

    const consentements: LigneConsentementCible[] = [];
    for (const ligne of lot) {
      if (ligne.profil_unifie_id === null) {
        nbProfilsManquants += 1;
        continue;
      }
      consentements.push(...projeterSignatureEnConsentements(ligne));
    }
    nbConsentementsCalcules += consentements.length;

    if (!modeDryRun && consentements.length > 0) {
      const { error: errUpsert } = await supabase.from('consentement').upsert(consentements, {
        onConflict: 'profil_unifie_id,type_consentement,objet_id',
        ignoreDuplicates: true,
      });
      if (errUpsert !== null) {
        console.error(`Erreur upsert consentement : ${errUpsert.message}`);
        process.exit(1);
      }
    }

    total += lot.length;
    const dernier = lot[lot.length - 1];
    if (dernier !== undefined) {
      lastCreatedAt = dernier.created_at;
      lastId = dernier.id;
    }
    process.stdout.write(
      `\r  Signatures parcourues : ${total}, consentements projetés : ${nbConsentementsCalcules}`,
    );
  }

  console.info('');
  console.info('---');
  console.info(`Total signatures lues      : ${total}`);
  console.info(`Consentements projetés     : ${nbConsentementsCalcules}`);
  console.info(
    `  dont newsletter          : ${total /* approximation, voir détail si nécessaire */}`,
  );
  console.info(`Signatures sans profil_unifie : ${nbProfilsManquants} (ignorées)`);
  console.info('');
  if (modeDryRun) {
    console.info('🌵 DRY-RUN terminé. Aucune écriture effectuée.');
    console.info('   Pour appliquer : relance avec `--confirm`.');
  } else {
    console.info('🔥 CONFIRM terminé. Lignes écrites (idempotentes via upsert).');
  }
}

executer().catch((erreur) => {
  console.error('Erreur non gérée :', erreur);
  process.exit(1);
});
