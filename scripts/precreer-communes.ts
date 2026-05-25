/**
 * Pré-crée une « coquille » de commune libre (table `commune`) pour CHAQUE
 * commune et arrondissement du référentiel (`commune_reference`, ~35 000 +
 * arrondissements). Décision Lilou/Ben (2026-05-25) : on veut des coquilles
 * vides pour toutes les communes et arrondissements, afin que chacune soit
 * consultable et « rejoignable » immédiatement (révise la doctrine §7B « pas
 * de coquilles vides »). La création libre d'une commune (quartier, etc.)
 * reste possible par ailleurs, sans doublon de nom exact.
 *
 * Idempotent : le slug est déterministe (`slug(nom)-codeinsee`, unique par
 * INSEE), et l'upsert se fait sur `slug`. Ré-exécuter ne crée pas de doublon
 * et met simplement à jour les coquilles existantes. Les communes déjà créées
 * par la communauté (`auto_creee`) ne sont pas touchées (slugs différents).
 *
 * Les homonymes (ex. « Sainte-Colombe », 12 communes) coexistent : ils sont
 * distingués par leur code INSEE dans le slug. Ils ne violent pas la règle
 * « pas de doublon par nom exact », qui s'applique aux créations libres.
 *
 * Usage :
 *   npx tsx --env-file=.env.local scripts/precreer-communes.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/precreer-communes.ts --confirm
 *
 * Préalable `--confirm` : `NEXT_PUBLIC_SUPABASE_URL` et
 * `SUPABASE_SERVICE_ROLE_KEY` dans l'environnement (le service_role contourne
 * la RLS pour écrire ces coquilles).
 */

import { createClient } from '@supabase/supabase-js';

const TAILLE_LOT = 500;

/** Slugifie un nom en respectant la contrainte `^[a-z0-9]+(-[a-z0-9]+)*$`. */
function slugifier(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Slug déterministe et unique d'une coquille : `nom-codeinsee`. */
function slugCommune(nom: string, codeInsee: string): string {
  const base = slugifier(nom) || 'commune';
  return `${base}-${codeInsee.toLowerCase()}`;
}

interface LigneReference {
  code_insee: string;
  nom: string;
  type: string;
  code_departement: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
}

async function avecReessais<R extends { error: unknown }>(
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

function estDryRun(): boolean {
  const args = process.argv.slice(2);
  if (args.includes('--confirm')) return false;
  if (args.includes('--dry-run')) return true;
  console.error('Préciser --dry-run ou --confirm.');
  process.exit(1);
}

async function main(): Promise<void> {
  const dryRun = estDryRun();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || url === '' || key === undefined || key === '') {
    console.error('Variables d’env Supabase manquantes (URL ou SERVICE_ROLE_KEY).');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  // 1. Lecture paginée du référentiel.
  const references: LigneReference[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await avecReessais(() =>
      supabase
        .from('commune_reference')
        .select('code_insee, nom, type, code_departement, region, latitude, longitude')
        .order('code_insee', { ascending: true })
        .range(from, from + 999),
    );
    if (error !== null) {
      console.error(`Lecture commune_reference : ${error.message}`);
      process.exit(1);
    }
    if (data === null || data.length === 0) break;
    references.push(...(data as LigneReference[]));
    if (data.length < 1000) break;
  }

  // 2. Construction des coquilles + contrôle d'unicité des slugs.
  const slugs = new Set<string>();
  let collisions = 0;
  const coquilles = references.map((r) => {
    const slug = slugCommune(r.nom, r.code_insee);
    if (slugs.has(slug)) collisions += 1;
    slugs.add(slug);
    return {
      slug,
      nom: r.nom,
      code_insee: r.code_insee,
      departement: r.code_departement,
      region: r.region,
      latitude: r.latitude,
      longitude: r.longitude,
      statut_creation: 'pre_creee' as const,
    };
  });

  // biome-ignore lint/suspicious/noConsoleLog: récap CLI.
  console.log(
    `Référentiel : ${references.length} communes/arrondissements. Slugs uniques : ${slugs.size}. Collisions de slug : ${collisions}.`,
  );

  if (dryRun) {
    // biome-ignore lint/suspicious/noConsoleLog: récap dry-run.
    console.log('[dry-run] aucune écriture. Relancer avec --confirm pour appliquer.');
    return;
  }

  if (collisions > 0) {
    console.error(
      `Abandon : ${collisions} collisions de slug détectées (à corriger avant écriture).`,
    );
    process.exit(1);
  }

  // 3. Upsert par lots (idempotent sur slug).
  let traitees = 0;
  for (let i = 0; i < coquilles.length; i += TAILLE_LOT) {
    const lot = coquilles.slice(i, i + TAILLE_LOT);
    const { error } = await avecReessais(() =>
      supabase.from('commune').upsert(lot, { onConflict: 'slug' }),
    );
    if (error !== null) {
      console.error(`Échec lot ${i / TAILLE_LOT + 1} : ${error.message}`);
      process.exit(1);
    }
    traitees += lot.length;
  }

  // biome-ignore lint/suspicious/noConsoleLog: récap final CLI.
  console.log(`Pré-création terminée : ${traitees} coquilles upsertées (statut pre_creee).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
