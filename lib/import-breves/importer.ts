import { slugifier } from '@/lib/helpers-purs';
import { type ArticleFlux, analyserFlux, extrairePremieresLignes } from '@/lib/import-breves/rss';
import {
  SOURCES_COMPLEMENTAIRES,
  SOURCES_PRIORITAIRES,
  type SourceBreve,
} from '@/lib/import-breves/sources';
import { assignerTags } from '@/lib/import-breves/tags';

/**
 * Moteur d'import des brèves (revue de presse, demande Ben 2026-06-12).
 *
 * - Import initial : 3 derniers jours, au plus 24 brèves par jour
 *   calendaire (« 1 par heure »), sources prioritaires d'abord puis
 *   complément par les sources du Portail des médias indépendants.
 * - Import horaire (cron) : UNE nouvelle brève, source tirée 80 %
 *   prioritaires / 20 % complémentaires.
 *
 * Chaque brève = un media `type='breve'` publié : titre, extrait
 * (5-7 lignes), image copiée dans le bucket (l'affichage direct depuis
 * les sites sources casse souvent : protection anti-hotlink), lien
 * source (« Lire la suite »), langue du site, tags automatiques.
 */

/** Navigateur déclaré aux sites de presse (certains refusent les UA vides). */
const USER_AGENT =
  'Mozilla/5.0 (compatible; MaintenantRevueDePresse/1.0; +https://maintenant-le-mouvement.org)';

const TAILLE_MAX_IMAGE_OCTETS = 4_000_000;

export interface BreveCandidate {
  source: SourceBreve;
  article: ArticleFlux;
}

export interface RecolteInitiale {
  selection: BreveCandidate[];
  rapportSources: string[];
}

/** Récupère et analyse un flux ; [] et rapport en cas d'échec. */
export async function lireFlux(source: SourceBreve): Promise<ArticleFlux[]> {
  const reponse = await fetch(source.flux, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
  });
  if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
  return analyserFlux(await reponse.text());
}

/** Jour calendaire Europe/Paris (clé de regroupement de la sélection). */
function jourParis(epochMs: number): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(epochMs));
}

/**
 * Sélectionne les brèves d'un jour : priorité aux sources prioritaires,
 * diversité d'abord (2 par source maximum au premier passage), puis
 * remplissage par fraîcheur, jusqu'à `maxParJour`.
 */
export function selectionnerPourUnJour(
  candidates: BreveCandidate[],
  maxParJour: number,
): BreveCandidate[] {
  const triees = [...candidates].sort(
    (a, b) => (b.article.publieLe ?? 0) - (a.article.publieLe ?? 0),
  );
  const prioritaires = triees.filter((c) => c.source.famille === 'prioritaire');
  const complementaires = triees.filter((c) => c.source.famille === 'complementaire');

  const retenues: BreveCandidate[] = [];
  const parSource = new Map<string, number>();
  const dejaRetenue = new Set<string>();

  const passe = (liste: BreveCandidate[], capParSource: number) => {
    for (const c of liste) {
      if (retenues.length >= maxParJour) return;
      if (dejaRetenue.has(c.article.lien)) continue;
      const compte = parSource.get(c.source.nom) ?? 0;
      if (compte >= capParSource) continue;
      retenues.push(c);
      dejaRetenue.add(c.article.lien);
      parSource.set(c.source.nom, compte + 1);
    }
  };

  // 1. Diversité des sources prioritaires, 2. davantage de prioritaires,
  // 3. complément par le Portail si la journée n'est pas remplie.
  passe(prioritaires, 2);
  passe(prioritaires, 6);
  passe(complementaires, 2);
  passe(complementaires, 6);

  return retenues.sort((a, b) => (b.article.publieLe ?? 0) - (a.article.publieLe ?? 0));
}

/**
 * Récolte initiale : lit toutes les sources, garde la fenêtre des
 * `joursFenetre` derniers jours, sélectionne au plus `maxParJour` brèves
 * par jour calendaire.
 */
export async function recolterBrevesInitiales(options: {
  joursFenetre: number;
  maxParJour: number;
}): Promise<RecolteInitiale> {
  const rapportSources: string[] = [];
  const candidates: BreveCandidate[] = [];
  const horizon = Date.now() - options.joursFenetre * 24 * 3600 * 1000;

  for (const source of [...SOURCES_PRIORITAIRES, ...SOURCES_COMPLEMENTAIRES]) {
    try {
      const articles = await lireFlux(source);
      const recents = articles.filter((a) => a.publieLe !== null && a.publieLe >= horizon);
      rapportSources.push(`${source.nom} : ${articles.length} articles, ${recents.length} récents`);
      for (const article of recents) candidates.push({ source, article });
    } catch (e) {
      rapportSources.push(`${source.nom} : FLUX EN ÉCHEC (${e instanceof Error ? e.message : e})`);
    }
  }

  const parJour = new Map<string, BreveCandidate[]>();
  for (const c of candidates) {
    const jour = jourParis(c.article.publieLe ?? 0);
    const liste = parJour.get(jour) ?? [];
    liste.push(c);
    parJour.set(jour, liste);
  }

  const selection: BreveCandidate[] = [];
  for (const [, duJour] of [...parJour.entries()].sort()) {
    selection.push(...selectionnerPourUnJour(duJour, options.maxParJour));
  }
  selection.sort((a, b) => (b.article.publieLe ?? 0) - (a.article.publieLe ?? 0));

  return { selection, rapportSources };
}

export type ResultatInsertionBreve = { ok: true; slug: string } | { ok: false; message: string };

/** Liens sources déjà importés (idempotence). */
export async function lienSourcesExistants(urlSb: string, cle: string): Promise<Set<string>> {
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  const r = await fetch(
    `${urlSb}/rest/v1/media?type=eq.breve&select=source_url&order=created_at.desc&limit=3000`,
    { headers: entetes },
  );
  if (!r.ok) return new Set();
  const lignes = (await r.json()) as Array<{ source_url: string | null }>;
  return new Set(lignes.map((l) => l.source_url).filter((u): u is string => u !== null));
}

/**
 * Télécharge l'image de l'article (si présente et raisonnable), la copie
 * dans le bucket, puis insère la brève publiée. Idempotent par
 * `source_url` (vérifié par l'appelant via `lienSourcesExistants`, et
 * re-vérifié ici par sécurité).
 */
export async function telechargerEtInsererBreve(
  breve: BreveCandidate,
  urlSb: string,
  cle: string,
): Promise<ResultatInsertionBreve> {
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  const { article, source } = breve;

  // Idempotence : la brève existe déjà ?
  const rExiste = await fetch(
    `${urlSb}/rest/v1/media?source_url=eq.${encodeURIComponent(article.lien)}&select=id&limit=1`,
    { headers: entetes },
  );
  if (rExiste.ok && (((await rExiste.json()) as unknown[]) ?? []).length > 0) {
    return { ok: false, message: 'déjà importée' };
  }

  const extrait = extrairePremieresLignes(article.description);
  if (extrait.length < 40) {
    return { ok: false, message: 'description trop courte pour une brève' };
  }

  const slugBase = slugifier(article.titre).slice(0, 70).replace(/-+$/, '');
  const slug = `${slugBase}-${(article.publieLe ?? Date.now()).toString(36)}`;

  // Image : copiée dans le bucket (anti-hotlink), brève sans image sinon.
  let vignetteUrl: string | null = null;
  if (article.imageUrl !== null) {
    try {
      const rImg = await fetch(article.imageUrl, { headers: { 'User-Agent': USER_AGENT } });
      const typeMime = rImg.headers.get('content-type') ?? '';
      if (rImg.ok && typeMime.startsWith('image/')) {
        const octets = new Uint8Array(await rImg.arrayBuffer());
        if (octets.length > 0 && octets.length <= TAILLE_MAX_IMAGE_OCTETS) {
          const extension = typeMime.includes('png')
            ? 'png'
            : typeMime.includes('webp')
              ? 'webp'
              : typeMime.includes('gif')
                ? 'gif'
                : 'jpg';
          const chemin = `breves/${slug}.${extension}`;
          const rUp = await fetch(`${urlSb}/storage/v1/object/media/${chemin}`, {
            method: 'POST',
            headers: { ...entetes, 'Content-Type': typeMime, 'x-upsert': 'true' },
            body: octets,
          });
          if (rUp.ok) vignetteUrl = `${urlSb}/storage/v1/object/public/media/${chemin}`;
        }
      }
    } catch {
      // Image inaccessible : la brève part sans visuel (annexe).
    }
  }

  const ligne = {
    slug,
    titre: article.titre.slice(0, 200),
    corps: extrait,
    type: 'breve',
    statut: 'publie',
    publie_le: new Date(article.publieLe ?? Date.now()).toISOString(),
    auteurice_id: null,
    provenance_externe: source.nom,
    source_url: article.lien,
    vignette_url: vignetteUrl,
    tags: assignerTags(`${article.titre} ${extrait}`),
    langue: source.langue,
    // Mosaïque (décision Ben) : une brève illustrée est « importante »
    // (5-7 lignes), une brève sans visuel est « annexe » (3-4 lignes).
    importante: vignetteUrl !== null,
  };

  const rIns = await fetch(`${urlSb}/rest/v1/media`, {
    method: 'POST',
    headers: { ...entetes, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify([ligne]),
  });
  if (!rIns.ok) {
    return { ok: false, message: `insert ${rIns.status} ${await rIns.text()}` };
  }
  return { ok: true, slug };
}

/**
 * Import horaire (cron) : tire une source (80 % prioritaires / 20 %
 * complémentaires), prend son article le plus récent non encore importé
 * et l'insère. Essaie jusqu'à `maxEssaisSources` sources si la première
 * n'a rien de neuf.
 */
export async function importerBreveHoraire(
  urlSb: string,
  cle: string,
  tirerSource: () => SourceBreve,
  maxEssaisSources = 4,
): Promise<ResultatInsertionBreve & { source?: string }> {
  const existants = await lienSourcesExistants(urlSb, cle);
  const essayees = new Set<string>();

  for (let essai = 0; essai < maxEssaisSources; essai += 1) {
    const source = tirerSource();
    if (essayees.has(source.nom)) continue;
    essayees.add(source.nom);
    try {
      const articles = await lireFlux(source);
      const nouveau = articles.find(
        (a) => !existants.has(a.lien) && a.publieLe !== null && a.description.length >= 40,
      );
      if (nouveau === undefined) continue;
      const resultat = await telechargerEtInsererBreve({ source, article: nouveau }, urlSb, cle);
      if (resultat.ok) return { ...resultat, source: source.nom };
    } catch {
      // Flux en échec : on tente une autre source.
    }
  }
  return { ok: false, message: 'aucune nouvelle brève trouvée sur les sources tirées' };
}
