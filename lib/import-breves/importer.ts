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

/**
 * Chasse à l'image (décision Ben 2026-06-12 : « il faut absolument des
 * images pour chaque article, il faut vraiment chercher les images ») :
 * quand le flux n'en fournit pas, on va lire la PAGE de l'article et on
 * prend son `og:image` (ou `twitter:image`).
 */
export async function chercherImageArticle(lien: string): Promise<string | null> {
  try {
    const r = await fetch(lien, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
    });
    if (!r.ok) return null;
    const html = (await r.text()).slice(0, 200_000);
    const m =
      html.match(
        /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
      ) ??
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
      ) ??
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    const url = m?.[1] ?? null;
    return url?.startsWith('http') === true ? url : null;
  } catch {
    return null;
  }
}

/**
 * Logo du média source, en DERNIER recours (« mets le logo du média
 * source mais n'en abuse pas ») : favicon haute taille via le service
 * public de Google, copié dans le bucket une fois par source.
 */
export function urlLogoSource(source: SourceBreve): string {
  const domaine = new URL(source.flux).hostname.replace(/^(www|api|feeds|rss)\./, '');
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domaine)}&sz=256`;
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
 * Sélectionne les brèves d'un jour. RÈGLE DURE (Ben, 2026-06-12) :
 * jamais deux brèves de la même source par tranche de 24 heures (seule la
 * rédaction de Maintenant! échappe à la règle, et elle ne passe pas par
 * cet importeur). Priorité aux sources prioritaires, complément par le
 * Portail, dans la limite de `maxParJour`.
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
  const sourcesUtilisees = new Set<string>();
  const dejaRetenue = new Set<string>();

  const passe = (liste: BreveCandidate[]) => {
    for (const c of liste) {
      if (retenues.length >= maxParJour) return;
      if (dejaRetenue.has(c.article.lien)) continue;
      if (sourcesUtilisees.has(c.source.nom)) continue; // 1 par source par 24 h.
      retenues.push(c);
      dejaRetenue.add(c.article.lien);
      sourcesUtilisees.add(c.source.nom);
    }
  };

  passe(prioritaires);
  passe(complementaires);

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

  // Chasse à l'image, dans l'ordre (décision Ben : une image pour CHAQUE
  // brève, le logo du média seulement en dernier recours) :
  //   1. image du flux RSS ; 2. og:image de la page de l'article ;
  //   3. logo du média source. L'image est copiée dans le bucket
  //   (anti-hotlink). Seules les vraies images d'article rendent la
  //   brève « importante » (le logo reste un format annexe).
  let vignetteUrl: string | null = null;
  let imageReelle = false;
  const copierImage = async (urlImage: string, cheminBucket: string): Promise<string | null> => {
    try {
      const rImg = await fetch(urlImage, { headers: { 'User-Agent': USER_AGENT } });
      const typeMime = rImg.headers.get('content-type') ?? '';
      if (!rImg.ok || !typeMime.startsWith('image/')) return null;
      const octets = new Uint8Array(await rImg.arrayBuffer());
      if (octets.length === 0 || octets.length > TAILLE_MAX_IMAGE_OCTETS) return null;
      const rUp = await fetch(`${urlSb}/storage/v1/object/media/${cheminBucket}`, {
        method: 'POST',
        headers: { ...entetes, 'Content-Type': typeMime, 'x-upsert': 'true' },
        body: octets,
      });
      return rUp.ok ? `${urlSb}/storage/v1/object/public/media/${cheminBucket}` : null;
    } catch {
      return null;
    }
  };

  if (article.imageUrl !== null) {
    vignetteUrl = await copierImage(article.imageUrl, `breves/${slug}.jpg`);
    imageReelle = vignetteUrl !== null;
  }
  if (vignetteUrl === null) {
    const ogImage = await chercherImageArticle(article.lien);
    if (ogImage !== null) {
      vignetteUrl = await copierImage(ogImage, `breves/${slug}.jpg`);
      imageReelle = vignetteUrl !== null;
    }
  }
  if (vignetteUrl === null) {
    const slugSource = slugifier(source.nom).slice(0, 40);
    vignetteUrl = await copierImage(urlLogoSource(source), `breves/logos/${slugSource}.png`);
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
    // Mosaïque (décision Ben) : une brève avec une VRAIE image d'article
    // est « importante » (5-7 lignes) ; logo de secours = format annexe.
    importante: imageReelle,
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
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  const existants = await lienSourcesExistants(urlSb, cle);

  // RÈGLE 1 source / 24 h (Ben, 2026-06-12) : les sources déjà publiées
  // dans les dernières 24 heures sont exclues du tirage de cette heure.
  const depuis = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const rRecentes = await fetch(
    `${urlSb}/rest/v1/media?type=eq.breve&publie_le=gte.${encodeURIComponent(depuis)}&select=provenance_externe`,
    { headers: entetes },
  );
  const sourcesRecentes = new Set<string>(
    rRecentes.ok
      ? ((await rRecentes.json()) as Array<{ provenance_externe: string | null }>)
          .map((l) => l.provenance_externe)
          .filter((s): s is string => s !== null)
      : [],
  );

  const essayees = new Set<string>();
  for (let essai = 0; essai < maxEssaisSources * 3; essai += 1) {
    const source = tirerSource();
    if (essayees.has(source.nom)) continue;
    if (sourcesRecentes.has(source.nom)) continue;
    if (essayees.size >= maxEssaisSources) break;
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
