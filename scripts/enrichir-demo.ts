/**
 * Enrichissement visuel et social des données de DÉMONSTRATION (chantier
 * V2.6.28, Master Plan V2.6 Phase A).
 *
 * Ce que fait ce script, STRICTEMENT sur les lignes de démo (repérées via la
 * table `objet_demo`) et UNIQUEMENT contre le Supabase LOCAL :
 *   1. Pose une image locale (public/images/demo/*.jpg) propre et variée sur
 *      chaque objet de démo : pétitions, mobilisations, cagnottes, sondages,
 *      communes, et publications réseau.
 *   2. Pose un avatar illustré local (public/images/demo/avatars/*.png) sur
 *      chaque profil de démo (les 6 comptes test*@maintenant.local).
 *   3. Ajoute des commentaires de démonstration vivants (avec emojis) sous
 *      chaque publication réseau et sous chaque objet commentable, signés par
 *      les profils de démo. Chaque commentaire créé est marqué dans
 *      `objet_demo` pour rester supprimable en un clic.
 *
 * Garde-fous (cf. CLAUDE.md §0.3 doctrine de greffe + règle locale stricte) :
 *   - REFUSE de tourner si l'URL Supabase n'est pas locale.
 *   - Ne touche QUE les lignes présentes dans `objet_demo`. Jamais les
 *     17 746 signatures, 35 011 communes ou 15 737 profils réels.
 *   - Idempotent : relançable sans créer de doublons (images réécrites à
 *     l'identique, commentaires insérés seulement si la cible n'en a pas).
 *
 * Usage :
 *   npx tsx --env-file=.env.local.demo scripts/enrichir-demo.ts --dry-run
 *   npx tsx --env-file=.env.local.demo scripts/enrichir-demo.ts --confirm
 */
import { type SupabaseClient, createClient } from '@supabase/supabase-js';

// Client volontairement NON typé (pas de générique Database) : ce script de
// maintenance boucle sur des noms de tables dynamiques (TABLES_IMAGE), ce que
// le client typé ne sait pas résoudre (il rendrait les requêtes `never`). Les
// noms de colonnes utilisés (id, created_at, image_url, photo_url, etc.) ont
// été vérifiés à la main contre le schéma.
type Db = SupabaseClient;

const CONFIRM = process.argv.includes('--confirm');

/** Tables d'objets de démo qui reçoivent une image locale, et leur préfixe de fichier. */
const TABLES_IMAGE: Record<string, string> = {
  petition: 'petition',
  mobilisation: 'mobilisation',
  cagnotte: 'cagnotte',
  sondage: 'sondage',
  commune: 'commune',
  post_reseau: 'post',
};

/** Nombre de fichiers disponibles par préfixe (pour boucler si besoin). */
const NB_FICHIERS: Record<string, number> = {
  petition: 6,
  mobilisation: 6,
  cagnotte: 6,
  sondage: 6,
  commune: 6,
  post: 20,
};

/** Objets commentables via commentaire_objet (objet_type aligné sur la table). */
const TABLES_COMMENTABLES = ['petition', 'mobilisation', 'cagnotte', 'sondage'];

/** Pool de commentaires de démo : réactions sociales génériques + emojis. */
const COMMENTAIRES_DEMO = [
  'Bravo pour cette initiative 👏',
  'Je partage tout de suite 🔥',
  'On est ensemble ✊',
  'Merci pour ce que vous faites 🙏',
  'Présent·e ! 🙌',
  "Ça donne de l'espoir 🌱",
  'Hâte d’y être 🎉',
  'Je signe et je diffuse ✍️',
  'Quel bel élan de solidarité 💛',
  'Compte sur moi 💪',
  'Trop bien, continuez ! 😍',
  'J’en parle autour de moi 📣',
  'Solidarité totale 🤝',
  'Vivement la suite 👀',
];

function log(msg: string): void {
  // biome-ignore lint/suspicious/noConsoleLog: sortie CLI volontaire.
  console.log(msg);
}

function creerClient(): Db {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url.includes('127.0.0.1') && !url.includes('localhost')) {
    throw new Error(
      `REFUS : l'URL Supabase n'est pas locale (${url}).\nCe script est strictement local. Lancer avec --env-file=.env.local.demo.\n`,
    );
  }
  if (key === '') throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant.');
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Liste les id_ligne marqués démo pour une table donnée. */
async function idsDemo(db: Db, table: string): Promise<string[]> {
  const { data } = await db.from('objet_demo').select('id_ligne').eq('nom_table', table);
  return (data ?? []).map((r) => r.id_ligne);
}

/** Marque une ligne dans objet_demo (idempotent via upsert sur la PK composite). */
async function marquerDemo(db: Db, table: string, id: string): Promise<void> {
  await db
    .from('objet_demo')
    .upsert({ nom_table: table, id_ligne: id }, { onConflict: 'nom_table,id_ligne' });
}

/** Étape 1 : images locales sur les objets de démo. */
async function poserImagesObjets(db: Db): Promise<void> {
  log('\n— Images sur les objets de démo —');
  for (const [table, prefixe] of Object.entries(TABLES_IMAGE)) {
    const ids = await idsDemo(db, table);
    if (ids.length === 0) {
      log(`  ${table} : aucun objet démo`);
      continue;
    }
    const { data } = await db
      .from(table)
      .select('id, created_at')
      .in('id', ids)
      .order('created_at');
    const lignes = data ?? [];
    const nbDispo = NB_FICHIERS[prefixe] ?? 1;
    let n = 0;
    for (let i = 0; i < lignes.length; i++) {
      const ligne = lignes[i];
      if (ligne === undefined) continue;
      const num = (i % nbDispo) + 1;
      const chemin = `/images/demo/${prefixe}-${num}.jpg`;
      if (CONFIRM) {
        await db.from(table).update({ image_url: chemin }).eq('id', ligne.id);
      }
      n += 1;
    }
    log(
      `  ${table} : ${n} image(s) ${CONFIRM ? 'posée(s)' : 'à poser'} (${prefixe}-1..${prefixe}-${Math.min(lignes.length, nbDispo)}.jpg)`,
    );
  }
}

/** Étape 2 : avatars locaux sur les profils de démo. */
async function poserAvatars(db: Db): Promise<void> {
  log('\n— Avatars sur les profils de démo —');
  const ids = await idsDemo(db, 'personne');
  if (ids.length === 0) {
    log('  aucun profil démo');
    return;
  }
  const { data } = await db.from('personne').select('id, email').in('id', ids);
  let n = 0;
  for (const p of data ?? []) {
    // Dérive le numéro depuis test<N>@maintenant.local ; sinon ordre d'arrivée.
    const m = (p.email ?? '').match(/test(\d)@/);
    const num = m ? Number(m[1]) : (n % 6) + 1;
    const chemin = `/images/demo/avatars/profil-${num}.png`;
    if (CONFIRM) await db.from('personne').update({ photo_url: chemin }).eq('id', p.id);
    n += 1;
  }
  log(`  ${n} avatar(s) ${CONFIRM ? 'posé(s)' : 'à poser'}`);
}

/** Renvoie les ids des profils de démo (auteurs des commentaires). */
async function profilsDemo(db: Db): Promise<string[]> {
  return idsDemo(db, 'personne');
}

/** Étape 3a : commentaires emoji sous les publications réseau. */
async function commenterPosts(db: Db, profils: string[]): Promise<number> {
  const ids = await idsDemo(db, 'post_reseau');
  if (ids.length === 0 || profils.length === 0) return 0;
  const { data } = await db
    .from('post_reseau')
    .select('id, auteurice_id, created_at')
    .in('id', ids)
    .order('created_at');
  let crees = 0;
  let postIdx = 0;
  for (const post of data ?? []) {
    // Idempotence : ne rien ajouter si ce post a déjà des commentaires.
    const { count } = await db
      .from('commentaire_reseau')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    if ((count ?? 0) > 0) {
      postIdx += 1;
      continue;
    }
    const nbComs = 2 + (postIdx % 2); // 2 ou 3 commentaires
    for (let k = 0; k < nbComs; k++) {
      const auteur = profils[(postIdx + k + 1) % profils.length];
      const texte = COMMENTAIRES_DEMO[(postIdx * 3 + k) % COMMENTAIRES_DEMO.length];
      if (auteur === undefined || texte === undefined) continue;
      if (auteur === post.auteurice_id) continue; // pas d'auto-commentaire
      if (CONFIRM) {
        const { data: ins } = await db
          .from('commentaire_reseau')
          .insert({ post_id: post.id, auteurice_id: auteur, texte, statut: 'publie' })
          .select('id')
          .single();
        if (ins) await marquerDemo(db, 'commentaire_reseau', ins.id);
      }
      crees += 1;
    }
    postIdx += 1;
  }
  return crees;
}

/** Étape 3b : commentaires emoji sous les objets commentables. */
async function commenterObjets(db: Db, profils: string[]): Promise<number> {
  if (profils.length === 0) return 0;
  let crees = 0;
  let objIdx = 0;
  for (const table of TABLES_COMMENTABLES) {
    const ids = await idsDemo(db, table);
    for (const objetId of ids) {
      const { count } = await db
        .from('commentaire_objet')
        .select('*', { count: 'exact', head: true })
        .eq('objet_type', table)
        .eq('objet_id', objetId);
      if ((count ?? 0) > 0) {
        objIdx += 1;
        continue;
      }
      const nbComs = 1 + (objIdx % 2); // 1 ou 2
      for (let k = 0; k < nbComs; k++) {
        const auteur = profils[(objIdx + k) % profils.length];
        const texte = COMMENTAIRES_DEMO[(objIdx * 2 + k + 5) % COMMENTAIRES_DEMO.length];
        if (auteur === undefined || texte === undefined) continue;
        if (CONFIRM) {
          const { data: ins } = await db
            .from('commentaire_objet')
            .insert({
              objet_type: table,
              objet_id: objetId,
              auteurice_id: auteur,
              texte,
              statut: 'publie',
            })
            .select('id')
            .single();
          if (ins) await marquerDemo(db, 'commentaire_objet', ins.id);
        }
        crees += 1;
      }
      objIdx += 1;
    }
  }
  return crees;
}

async function main(): Promise<void> {
  const db = creerClient();
  log(
    CONFIRM ? '=== MODE CONFIRM (écriture locale) ===' : '=== MODE DRY-RUN (aucune écriture) ===',
  );

  await poserImagesObjets(db);
  await poserAvatars(db);

  log('\n— Commentaires de démo (avec emojis) —');
  const profils = await profilsDemo(db);
  const cPosts = await commenterPosts(db, profils);
  const cObjets = await commenterObjets(db, profils);
  log(`  publications : ${cPosts} commentaire(s) ${CONFIRM ? 'créé(s)' : 'à créer'}`);
  log(`  objets       : ${cObjets} commentaire(s) ${CONFIRM ? 'créé(s)' : 'à créer'}`);

  log(
    `\n${CONFIRM ? 'Enrichissement appliqué.' : 'Dry-run terminé. Relancer avec --confirm pour écrire.'}`,
  );
}

void main();
