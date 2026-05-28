/**
 * Script de seeding des données de démonstration.
 *
 * Chantier V2.5.1 — Master Plan V2.6 Phase A.
 *
 * Crée 6 comptes Auth (test1@maintenant.local → test6@maintenant.local),
 * 6 lignes `personne` correspondantes, puis dans chaque espace métier un
 * volume adapté de données (pétitions, mobilisations, etc.). Chaque ligne
 * insérée est marquée dans `objet_demo` pour permettre une suppression
 * propre via `lib/demo/marqueur.ts > supprimerToutesLesDemos()`.
 *
 * Usage :
 *   npx tsx --env-file=.env.local.demo scripts/seed-demo.ts --dry-run
 *   npx tsx --env-file=.env.local.demo scripts/seed-demo.ts --confirm
 *
 * Garde-fou : refuse de tourner si `NEXT_PUBLIC_SUPABASE_URL` ne contient
 * pas `127.0.0.1` ou `localhost`. C'est la règle locale stricte du Master
 * Plan V2.6 (CLAUDE.md §11) : aucune écriture sur le distant Francfort
 * tant que la Phase M n'est pas ouverte par Lilou/Ben.
 *
 * Idempotent : par défaut, skip le seeding si des données démo existent
 * déjà (lecture de `objet_demo`). Utiliser `--reset` pour tout supprimer
 * et re-seeder.
 */

import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// === Configuration & garde-fous ===

const URL_LOCALE_AUTORISEE = /^(https?:\/\/)?(127\.0\.0\.1|localhost)/i;

interface Args {
  dryRun: boolean;
  reset: boolean;
}

function lireArgs(): Args {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const confirm = args.includes('--confirm');
  const reset = args.includes('--reset');
  if (dryRun === confirm) {
    process.stderr.write('Préciser --dry-run OU --confirm (pas les deux).\n');
    process.exit(1);
  }
  return { dryRun, reset };
}

function verifierEnv(): { url: string; serviceRoleKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    process.stderr.write(
      'NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.\n' +
        'Utiliser : npx tsx --env-file=.env.local.demo scripts/seed-demo.ts ...\n',
    );
    process.exit(1);
  }
  if (!URL_LOCALE_AUTORISEE.test(url)) {
    process.stderr.write(
      `REFUS : l'URL Supabase ne pointe pas vers le local (${url}).\nLe seeding démo est strictement local (Master Plan V2.6, règle locale stricte).\nVérifier le fichier .env passé via --env-file.\n`,
    );
    process.exit(1);
  }
  return { url, serviceRoleKey };
}

const log = (s: string): void => {
  process.stdout.write(`${s}\n`);
};
const logErr = (s: string): void => {
  process.stderr.write(`${s}\n`);
};

// === Profils démo (les 6 comptes Auth + lignes personne) ===

interface ProfilDemo {
  /** Email (sert d'identifiant unique côté Auth). */
  email: string;
  /** Mot de passe en clair (pour permettre la connexion en démo). */
  password: string;
  /** Prénom usuel. */
  prenom: string;
  /** Nom de famille. */
  nom: string;
  /** Pronom préféré (épicène, féminin, masculin). */
  pronom: string;
  /** Code postal pour rattachement à une commune. */
  codePostal: string;
  /** Bio courte affichée sur le profil public. */
  bio: string;
  /** URL Picsum stable pour l'avatar. */
  photoUrl: string;
}

/**
 * Les 6 profils de démonstration. Personnages fictifs neutres, sans
 * connotation politique ou réelle. Codes postaux variés (Île-de-France,
 * régions, DROM) pour montrer la diversité de la cartographie.
 */
const PROFILS_DEMO: ProfilDemo[] = [
  {
    email: 'test1@maintenant.local',
    password: 'demo-test1!',
    prenom: 'Camille',
    nom: 'Démo Un',
    pronom: 'iel',
    codePostal: '95100', // Argenteuil
    bio: "Profil démo n°1. Habite Argenteuil, s'intéresse à la transition écologique locale.",
    photoUrl: 'https://picsum.photos/seed/maintenant-test1/240/240',
  },
  {
    email: 'test2@maintenant.local',
    password: 'demo-test2!',
    prenom: 'Sacha',
    nom: 'Démo Deux',
    pronom: 'iel',
    codePostal: '69001', // Lyon 1
    bio: 'Profil démo n°2. Habite Lyon, intéressé·e par les questions de mobilité.',
    photoUrl: 'https://picsum.photos/seed/maintenant-test2/240/240',
  },
  {
    email: 'test3@maintenant.local',
    password: 'demo-test3!',
    prenom: 'Léa',
    nom: 'Démo Trois',
    pronom: 'elle',
    codePostal: '31000', // Toulouse
    bio: "Profil démo n°3. Habite Toulouse, militante pour l'agriculture paysanne.",
    photoUrl: 'https://picsum.photos/seed/maintenant-test3/240/240',
  },
  {
    email: 'test4@maintenant.local',
    password: 'demo-test4!',
    prenom: 'Marc',
    nom: 'Démo Quatre',
    pronom: 'il',
    codePostal: '44000', // Nantes
    bio: "Profil démo n°4. Habite Nantes, engagé dans une association d'entraide.",
    photoUrl: 'https://picsum.photos/seed/maintenant-test4/240/240',
  },
  {
    email: 'test5@maintenant.local',
    password: 'demo-test5!',
    prenom: 'Yasmine',
    nom: 'Démo Cinq',
    pronom: 'elle',
    codePostal: '13001', // Marseille 1
    bio: "Profil démo n°5. Habite Marseille, anime un groupe d'entraide local.",
    photoUrl: 'https://picsum.photos/seed/maintenant-test5/240/240',
  },
  {
    email: 'test6@maintenant.local',
    password: 'demo-test6!',
    prenom: 'Théo',
    nom: 'Démo Six',
    pronom: 'il',
    codePostal: '97400', // Saint-Denis (Réunion)
    bio: 'Profil démo n°6. Habite Saint-Denis (Réunion), implique les ultramarins.',
    photoUrl: 'https://picsum.photos/seed/maintenant-test6/240/240',
  },
];

/**
 * Crée ou réutilise le compte Auth + la ligne personne pour un profil démo.
 * Retourne l'id (= auth.users.id = personne.id).
 *
 * Idempotent : si l'email existe déjà dans auth.users, on récupère son id
 * et on s'assure que la ligne personne + marqueur démo sont en place.
 */
async function creerOuRecupererProfil(
  supabase: SupabaseClient<Database>,
  profil: ProfilDemo,
  dryRun: boolean,
): Promise<string | null> {
  // 1. Chercher si le compte existe déjà.
  const { data: listePages } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const existant = listePages?.users.find((u) => u.email === profil.email);
  let userId: string;

  if (existant) {
    userId = existant.id;
    log(`  · ${profil.email} → existant (${userId.slice(0, 8)}…)`);
  } else {
    if (dryRun) {
      log(`  · ${profil.email} → [dry-run] créerait le compte`);
      return null;
    }
    const { data: nouv, error } = await supabase.auth.admin.createUser({
      email: profil.email,
      password: profil.password,
      email_confirm: true,
      user_metadata: { prenom: profil.prenom, nom: profil.nom },
    });
    if (error || !nouv?.user) {
      logErr(`  ✗ ${profil.email} → ${error?.message ?? 'pas de user retourné'}`);
      return null;
    }
    userId = nouv.user.id;
    log(`  · ${profil.email} → créé (${userId.slice(0, 8)}…)`);
  }

  if (dryRun) return userId;

  // 2. UPSERT de la ligne personne (la migration personne crée la ligne
  //    automatiquement ? Vérifier : non, pas de trigger handle_new_user dans
  //    les migrations actuelles. Donc on crée explicitement.).
  const { error: upErr } = await supabase.from('personne').upsert(
    {
      id: userId,
      email: profil.email,
      email_verifie: true,
      prenom: profil.prenom,
      nom: profil.nom,
      pronom: profil.pronom,
      code_postal: profil.codePostal,
      bio: profil.bio,
      photo_url: profil.photoUrl,
      statut: 'actif',
    },
    { onConflict: 'id' },
  );
  if (upErr) {
    logErr(`  ✗ upsert personne ${profil.email} : ${upErr.message}`);
    return userId;
  }

  // 3. Marqueur démo sur cette personne.
  const { error: marqErr } = await supabase
    .from('objet_demo')
    .upsert({ nom_table: 'personne', id_ligne: userId }, { onConflict: 'nom_table,id_ligne' });
  if (marqErr) {
    logErr(`  ✗ marqueur démo personne ${profil.email} : ${marqErr.message}`);
  }

  return userId;
}

// === Point d'entrée ===

async function main(): Promise<void> {
  const { dryRun, reset } = lireArgs();
  const { url, serviceRoleKey } = verifierEnv();

  log('========================================');
  log('Seeding démo — Master Plan V2.6 Phase A');
  log('========================================');
  log(`Supabase URL : ${url}`);
  log(`Mode         : ${dryRun ? 'DRY-RUN (aucune écriture)' : 'CONFIRM (écritures réelles)'}`);
  log(`Reset        : ${reset ? 'OUI (suppression préalable)' : 'NON (idempotent)'}`);
  log('');

  const supabase = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // === Phase 1 : reset éventuel ===
  if (reset && !dryRun) {
    log('— Reset des données démo existantes —');
    const { supprimerToutesLesDemos } = await import('../lib/demo/marqueur');
    const recap = await supprimerToutesLesDemos();
    log(`  Total supprimé : ${recap.total} lignes + ${recap.comptesAuthSupprimes} comptes auth`);
    for (const r of recap.parTable.filter((p) => p.supprimes > 0)) {
      log(`    · ${r.table} : ${r.supprimes}`);
    }
    log('');
  }

  // === Phase 2 : profils ===
  log('— Profils démo (6 comptes test1 à test6) —');
  const profilIds: string[] = [];
  for (const p of PROFILS_DEMO) {
    const id = await creerOuRecupererProfil(supabase, p, dryRun);
    if (id) profilIds.push(id);
  }
  log(`  → ${profilIds.length}/${PROFILS_DEMO.length} profils prêts`);
  log('');

  if (dryRun) {
    log("Mode dry-run : arrêt après l'étape profils (les insertions par espace");
    log('ne sont simulées que si --confirm).');
    return;
  }

  // === Phase 3 : données par espace ===
  log('— Pétitions —');
  await seedPetitions(supabase, profilIds);
  log('');

  log('— Mobilisations —');
  await seedMobilisations(supabase, profilIds);
  log('');

  log('— Cagnottes —');
  await seedCagnottes(supabase, profilIds);
  log('');

  log('— Sondages —');
  await seedSondages(supabase, profilIds);
  log('');

  log('— Publications réseau social —');
  await seedPostsReseau(supabase, profilIds);
  log('');

  log('— Appartenances commune (rattachement des 6 profils) —');
  await seedAppartenancesCommune(supabase, profilIds);
  log('');

  log('— Blocs personnalisables sur les communes démo —');
  await seedBlocsCommune(supabase);
  log('');

  log('Seeding démo terminé.');
}

// === Helpers de seeding par espace ===

/**
 * Marque une ligne fraîchement créée dans `objet_demo` (idempotent).
 * Inlined pour éviter une dépendance circulaire avec `lib/demo/marqueur.ts`
 * (qui importe `getSupabaseAdmin`, qui lit l'env, qui pourrait diverger).
 */
async function marquerDemo(
  supabase: SupabaseClient<Database>,
  nomTable: string,
  idLigne: string,
): Promise<void> {
  const { error } = await supabase
    .from('objet_demo')
    .upsert({ nom_table: nomTable, id_ligne: idLigne }, { onConflict: 'nom_table,id_ligne' });
  if (error) {
    logErr(`    ✗ marqueur démo ${nomTable}/${idLigne.slice(0, 8)} : ${error.message}`);
  }
}

/** Slug simple en kebab-case. */
function slugifier(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const DESTINATAIRES_DEMO = [
  'Conseil municipal de la Ville',
  'Conseil régional',
  'Ministère des Transports',
  "Ministère de l'Éducation nationale",
  'Préfecture du département',
  'Assemblée nationale',
];

const SUJETS_PETITION_DEMO = [
  { titre: 'Transports publics gratuits pour les moins de 25 ans', objectif: 5000 },
  { titre: 'Une cantine bio et locale dans nos écoles', objectif: 3000 },
  { titre: 'Plus de pistes cyclables sécurisées', objectif: 4000 },
  { titre: 'Soutien aux producteurs locaux du marché', objectif: 2500 },
  { titre: "Pour un service public de l'eau", objectif: 10000 },
  { titre: 'Sauvegardons notre patrimoine local', objectif: 1500 },
];

async function seedPetitions(
  supabase: SupabaseClient<Database>,
  profilIds: string[],
): Promise<void> {
  for (const [i, sujet] of SUJETS_PETITION_DEMO.entries()) {
    const createurice = profilIds[i % profilIds.length];
    if (!createurice) continue;
    const slug = `demo-${slugifier(sujet.titre)}`;
    const { data, error } = await supabase
      .from('petition')
      .upsert(
        {
          createurice_id: createurice,
          titre: `[DÉMO] ${sujet.titre}`,
          texte: `Ceci est une pétition de démonstration créée par le seeding automatique (Master Plan V2.6 Phase A). Elle illustre la mise en page d'une vraie pétition. Le sujet est neutre et générique ; aucune position politique réelle n'est exprimée par cette donnée. La pétition sera supprimée en un clic depuis l'admin si besoin.\n\nObjectif d'illustration : montrer que la plateforme accepte des sujets variés, du local au national, et que chaque pétition a son destinataire, son objectif chiffré, et son texte de présentation.`,
          destinataire: DESTINATAIRES_DEMO[i % DESTINATAIRES_DEMO.length] ?? 'Destinataire',
          objectif: sujet.objectif,
          slug,
          statut: i === 0 ? 'en_moderation' : 'publiee', // 1 en modération pour montrer le statut
          date_lancement: i === 0 ? null : new Date().toISOString(),
          image_url: `https://picsum.photos/seed/petition-demo-${i + 1}/800/450`,
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();
    if (error || !data) {
      logErr(`  ✗ pétition ${i + 1} : ${error?.message ?? 'pas de retour'}`);
      continue;
    }
    await marquerDemo(supabase, 'petition', data.id);
    log(`  · pétition ${i + 1}/6 : ${sujet.titre.slice(0, 50)}`);
  }
}

const SUJETS_MOBILISATION_DEMO = [
  { titre: 'Marche pour le climat', lieu: 'Place de la République, Paris', dansNJours: 7 },
  { titre: 'Nettoyage citoyen du parc', lieu: 'Parc municipal, Argenteuil', dansNJours: 14 },
  { titre: 'Atelier de fabrication de produits ménagers', lieu: 'MJC, Lyon', dansNJours: 10 },
  { titre: 'Soutien aux producteurs locaux', lieu: 'Marché central, Toulouse', dansNJours: 21 },
  {
    titre: 'Distribution alimentaire solidaire',
    lieu: 'Église Saint-Joseph, Marseille',
    dansNJours: 3,
  },
  { titre: 'Réunion publique sur le logement', lieu: 'Salle polyvalente, Nantes', dansNJours: 30 },
];

async function seedMobilisations(
  supabase: SupabaseClient<Database>,
  profilIds: string[],
): Promise<void> {
  for (const [i, sujet] of SUJETS_MOBILISATION_DEMO.entries()) {
    const createurice = profilIds[i % profilIds.length];
    if (!createurice) continue;
    const slug = `demo-${slugifier(sujet.titre)}-${i + 1}`;
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() + sujet.dansNJours);
    const { data, error } = await supabase
      .from('mobilisation')
      .upsert(
        {
          createurice_id: createurice,
          titre: `[DÉMO] ${sujet.titre}`,
          description:
            'Mobilisation de démonstration créée par le seeding automatique. Ce texte décrit ce qui se passera sur place, le déroulé prévu, et comment participer. Le contenu est générique et neutre ; il sert uniquement à illustrer la mise en page.',
          lieu: sujet.lieu,
          date_debut: dateDebut.toISOString(),
          slug,
          statut: 'publiee',
          image_url: `https://picsum.photos/seed/mobilisation-demo-${i + 1}/800/450`,
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();
    if (error || !data) {
      logErr(`  ✗ mobilisation ${i + 1} : ${error?.message ?? 'pas de retour'}`);
      continue;
    }
    await marquerDemo(supabase, 'mobilisation', data.id);
    log(`  · mobilisation ${i + 1}/6 : ${sujet.titre.slice(0, 50)}`);
  }
}

const SUJETS_CAGNOTTE_DEMO = [
  { titre: 'Aider une famille à se reloger', objectif: 3000, type: 'lutte' },
  { titre: "Acheter du matériel pour le local d'entraide", objectif: 1500, type: 'ouverte' },
  { titre: "Financer un atelier d'auto-réparation vélo", objectif: 800, type: 'ouverte' },
  { titre: "Soutenir les frais juridiques d'un collectif", objectif: 5000, type: 'lutte' },
  { titre: 'Festival de musique populaire local', objectif: 2500, type: 'ouverte' },
  { titre: "Cotisation annuelle du groupe d'entraide", objectif: 600, type: 'cotisation' },
];

async function seedCagnottes(
  supabase: SupabaseClient<Database>,
  profilIds: string[],
): Promise<void> {
  for (const [i, sujet] of SUJETS_CAGNOTTE_DEMO.entries()) {
    const createurice = profilIds[i % profilIds.length];
    if (!createurice) continue;
    const slug = `demo-${slugifier(sujet.titre)}-${i + 1}`;
    const { data, error } = await supabase
      .from('cagnotte')
      .upsert(
        {
          createurice_id: createurice,
          titre: `[DÉMO] ${sujet.titre}`,
          texte: `Cagnotte de démonstration créée par le seeding automatique. Décrit l'objet précis de la collecte, à qui les fonds seront versés, et le calendrier prévu. Texte neutre, contenu générique.`,
          objectif_euros: sujet.objectif,
          type: sujet.type,
          slug,
          statut: 'publiee',
          image_url: `https://picsum.photos/seed/cagnotte-demo-${i + 1}/800/450`,
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();
    if (error || !data) {
      logErr(`  ✗ cagnotte ${i + 1} : ${error?.message ?? 'pas de retour'}`);
      continue;
    }
    await marquerDemo(supabase, 'cagnotte', data.id);
    log(`  · cagnotte ${i + 1}/6 : ${sujet.titre.slice(0, 50)}`);
  }
}

const SUJETS_SONDAGE_DEMO = [
  {
    titre: 'Que faire des terrains vagues du quartier ?',
    question: 'Comment préféreriez-vous voir aménagés les terrains vagues à proximité ?',
    options: ['Jardin partagé', 'Aire de jeux', 'Espace sportif', 'Verger collectif', 'Autre'],
  },
  {
    titre: 'Choisir le thème du prochain festival local',
    question: "Quel thème vous parle le plus pour le festival d'été ?",
    options: ['Musiques du monde', 'Cinéma en plein air', 'Marché de créateurs', 'Cuisine locale'],
  },
  {
    titre: 'Mobilité dans la commune',
    question: 'Quelle priorité pour améliorer la mobilité ?',
    options: ['Pistes cyclables', 'Transports en commun', 'Zones piétonnes', 'Covoiturage'],
  },
  {
    titre: 'Orientation budgétaire',
    question: 'Sur quel poste de dépense souhaitez-vous voir un effort municipal ?',
    options: ['Écoles', 'Espaces verts', 'Culture', 'Social', 'Sécurité'],
  },
  {
    titre: 'Horaires des marchés locaux',
    question: 'Quel créneau vous arrangerait le mieux ?',
    options: ['Matin en semaine', 'Samedi matin', 'Dimanche matin', 'Soir en semaine'],
  },
  {
    titre: 'Animer la maison de quartier',
    question: "Quels types d'ateliers souhaiteriez-vous voir proposer ?",
    options: ['Réparation', 'Couture', 'Cuisine', 'Numérique', 'Soutien scolaire'],
  },
];

async function seedSondages(
  supabase: SupabaseClient<Database>,
  profilIds: string[],
): Promise<void> {
  for (const [i, sujet] of SUJETS_SONDAGE_DEMO.entries()) {
    const createurice = profilIds[i % profilIds.length];
    if (!createurice) continue;
    const slug = `demo-${slugifier(sujet.titre)}-${i + 1}`;
    const { data, error } = await supabase
      .from('sondage')
      .upsert(
        {
          createurice_id: createurice,
          titre: `[DÉMO] ${sujet.titre}`,
          question: sujet.question,
          options: sujet.options,
          mode: 'classique',
          slug,
          statut: 'ouvert',
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();
    if (error || !data) {
      logErr(`  ✗ sondage ${i + 1} : ${error?.message ?? 'pas de retour'}`);
      continue;
    }
    await marquerDemo(supabase, 'sondage', data.id);
    log(`  · sondage ${i + 1}/6 : ${sujet.titre.slice(0, 50)}`);
  }
}

const TEXTES_POST_RESEAU_DEMO = [
  'Belle journée ensoleillée pour préparer le jardin partagé du quartier ! Si vous voulez nous rejoindre, RDV samedi 10h.',
  'Question pour la communauté : connaissez-vous une bonne adresse pour réparer un vélo électrique pas trop cher ?',
  "Petite victoire : on a obtenu la rénovation de l'aire de jeux du square. Merci à tous ceux qui ont signé la pétition.",
  "Soirée d'échange citoyen ce vendredi à la MJC. Venez nombreux discuter du budget participatif.",
  'Nouvelle commune libre rejoint le mouvement : bienvenue à la commune libre de Vesoul !',
  "Quelqu'un aurait du gros sel à prêter pour faire les conserves ? Je rends en confitures :)",
  "Compte-rendu de l'AG de notre groupe : décisions actées, prochaine réunion dans 15 jours.",
  'On cherche des bénévoles pour distribuer des paniers solidaires samedi matin. Inscriptions en MP.',
  'Bon résultat au sondage sur la mobilité : 73 % pour des pistes cyclables. On porte le sujet en conseil.',
  "Rappel : la cagnotte pour les frais juridiques du collectif est ouverte jusqu'à fin du mois.",
  "Réunion d'information sur les économies d'énergie ce mardi 19h. Lieu en MP pour les inscrit·es.",
  "On lance un groupe de travail sur l'alimentation saine et accessible. Les volontaires sont les bienvenu·es.",
  "Merci à toutes celles et ceux qui sont venu·es à la marche d'hier. On était plus de 200 !",
  'Atelier "découverte du jugement majoritaire" la semaine prochaine. Méthode démocratique passionnante.',
  'Petit rappel : la cuisine partagée du local est rangée et propre, merci à tou·tes.',
  'Recherche : qui aurait une remorque vélo à prêter pour un déménagement le week-end prochain ?',
  'Belle assemblée hier soir, on est passé à 30 adhérent·es dans la commune. Bravo à nous.',
  'Proposition pour le prochain GT : faire un état des lieux des espaces verts inutilisés.',
  "Quelqu'un pour donner un coup de main pour traduire le tract en arabe et en portugais ?",
  "Trop content du marché solidaire d'hier, beaucoup de monde et belle ambiance.",
];

async function seedPostsReseau(
  supabase: SupabaseClient<Database>,
  profilIds: string[],
): Promise<void> {
  for (const [i, texte] of TEXTES_POST_RESEAU_DEMO.entries()) {
    const auteurice = profilIds[i % profilIds.length];
    if (!auteurice) continue;
    // Pas de contrainte unique sur post_reseau, on vérifie via marqueur démo
    // l'idempotence : si on a déjà N posts démo, on stoppe.
    const { count } = await supabase
      .from('objet_demo')
      .select('*', { count: 'exact', head: true })
      .eq('nom_table', 'post_reseau');
    if ((count ?? 0) >= TEXTES_POST_RESEAU_DEMO.length) {
      log(`  · publications réseau déjà seedées (${count} existantes), skip`);
      return;
    }
    const { data, error } = await supabase
      .from('post_reseau')
      .insert({
        auteurice_id: auteurice,
        texte: `[DÉMO] ${texte}`,
        statut: 'publie',
      })
      .select('id')
      .single();
    if (error || !data) {
      logErr(`  ✗ post réseau ${i + 1} : ${error?.message ?? 'pas de retour'}`);
      continue;
    }
    await marquerDemo(supabase, 'post_reseau', data.id);
  }
  log(
    `  · ${TEXTES_POST_RESEAU_DEMO.length} publications réseau créées (réparties sur les 6 profils)`,
  );
}

/**
 * Crée 6 communes démo (une par ville réelle d'un profil) et y rattache
 * les profils correspondants. On crée les communes en `auto_creee` plutôt
 * que de chercher dans le référentiel `commune_reference` (vide en local).
 */
const COMMUNES_DEMO = [
  { nom: 'Argenteuil', codePostal: '95100', departement: '95', region: 'Île-de-France' },
  { nom: 'Lyon', codePostal: '69001', departement: '69', region: 'Auvergne-Rhône-Alpes' },
  { nom: 'Toulouse', codePostal: '31000', departement: '31', region: 'Occitanie' },
  { nom: 'Nantes', codePostal: '44000', departement: '44', region: 'Pays de la Loire' },
  {
    nom: 'Marseille',
    codePostal: '13001',
    departement: '13',
    region: "Provence-Alpes-Côte d'Azur",
  },
  { nom: 'Saint-Denis (Réunion)', codePostal: '97400', departement: '974', region: 'La Réunion' },
];

async function seedAppartenancesCommune(
  supabase: SupabaseClient<Database>,
  profilIds: string[],
): Promise<void> {
  for (const [i, personneId] of profilIds.entries()) {
    const ville = COMMUNES_DEMO[i];
    if (!ville) continue;
    const slug = `demo-${slugifier(ville.nom)}-${ville.departement}`;

    // 1. Créer (ou réutiliser) la commune démo
    const { data: commune, error: communeErr } = await supabase
      .from('commune')
      .upsert(
        {
          nom: `[DÉMO] ${ville.nom}`,
          slug,
          code_postal_principal: ville.codePostal,
          departement: ville.departement,
          region: ville.region,
          statut_creation: 'auto_creee',
          description_courte: 'Commune libre de démonstration créée par le seeding automatique.',
          createurice_id: personneId,
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();
    if (communeErr || !commune) {
      logErr(`  ✗ commune ${ville.nom} : ${communeErr?.message ?? 'pas de retour'}`);
      continue;
    }
    await marquerDemo(supabase, 'commune', commune.id);

    // 2. Créer l'appartenance. La contrainte unique de cette table est
    //    DEFERRABLE (impose une vérification d'idempotence manuelle :
    //    Postgres refuse l'ON CONFLICT sur contrainte différée).
    const { data: deja } = await supabase
      .from('appartenance_commune')
      .select('id')
      .eq('personne_id', personneId)
      .eq('commune_id', commune.id)
      .eq('est_active', true)
      .limit(1)
      .maybeSingle();
    if (!deja) {
      const { error } = await supabase
        .from('appartenance_commune')
        .insert({ personne_id: personneId, commune_id: commune.id, est_active: true });
      if (error) {
        logErr(`  ✗ appartenance ${i + 1} : ${error.message}`);
        continue;
      }
    }
    // Pas de marqueur démo sur l'appartenance : elle disparaît par cascade
    // quand le compte auth.users du profil est supprimé.
    log(`  · profil ${i + 1} → commune [DÉMO] ${ville.nom}`);
  }
}

/**
 * Pose 3 blocs personnalisables sur chaque commune démo pour illustrer
 * le système blocs façon newsletter (V2.5.5 Phase D). Idempotent : si
 * la commune a déjà au moins 1 bloc, on skip pour ne pas dupliquer.
 */
async function seedBlocsCommune(supabase: SupabaseClient<Database>): Promise<void> {
  // Récupérer les ids des 6 communes démo via le marqueur objet_demo
  const { data: marques } = await supabase
    .from('objet_demo')
    .select('id_ligne')
    .eq('nom_table', 'commune');
  const communeIds = (marques ?? []).map((m) => m.id_ligne);

  for (const [i, communeId] of communeIds.entries()) {
    // Idempotence : skip si la commune a déjà des blocs.
    const { count } = await supabase
      .from('bloc_espace')
      .select('*', { count: 'exact', head: true })
      .eq('espace_type', 'commune')
      .eq('espace_id', communeId);
    if ((count ?? 0) > 0) {
      log(`  · commune ${i + 1} : ${count} bloc(s) déjà présent(s), skip`);
      continue;
    }

    const blocs: Array<{ type: string; contenu_json: unknown; ordre: number }> = [
      {
        type: 'texte',
        contenu_json: {
          texte:
            'Bienvenue sur la page de notre commune libre ! Voici les outils que notre groupe local utilise. Ces blocs sont des exemples de démonstration : la véritable commune les éditera comme elle veut.',
        },
        ordre: 10,
      },
      {
        type: 'lien',
        contenu_json: {
          url: 'https://chat.whatsapp.com/exemple-commune',
          libelle: 'Rejoindre notre groupe WhatsApp',
          externe: true,
        },
        ordre: 20,
      },
      {
        type: 'bouton',
        contenu_json: {
          url: 'https://meet.example.com/notre-prochaine-reunion',
          libelle: 'Prochaine réunion mensuelle (lien visio)',
          variante: 'primary',
        },
        ordre: 30,
      },
    ];

    for (const bloc of blocs) {
      await supabase.from('bloc_espace').insert({
        espace_type: 'commune',
        espace_id: communeId,
        type: bloc.type,
        contenu_json: bloc.contenu_json as never,
        ordre: bloc.ordre,
      });
    }
    log(`  · commune ${i + 1} : 3 blocs démo créés`);
  }
}

main().catch((err) => {
  logErr(`ERREUR FATALE : ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
