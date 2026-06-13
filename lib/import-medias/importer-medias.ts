import { slugifier } from '@/lib/helpers-purs';
import { chercherImageArticle } from '@/lib/import-breves/importer';
import { type ArticleFlux, analyserFlux, extrairePremieresLignes } from '@/lib/import-breves/rss';
import { assignerTags } from '@/lib/import-breves/tags';
import {
  type FormatMedia,
  SOURCES_PAR_FORMAT,
  type SourceMedia,
} from '@/lib/import-medias/sources-medias';

/**
 * Moteur d'import multi-format de la revue de presse (demande Ben
 * 2026-06-13) : podcasts, vidéos, lives, dessins de presse. Réutilise
 * l'analyseur de flux et les tags des brèves (`lib/import-breves`).
 *
 * - Peuplement initial : le contenu le plus récent de chaque source
 *   (27 par format).
 * - Import quotidien (cron) : N nouveaux contenus par format (9 par
 *   défaut), une source par contenu, en sautant ce qui est déjà importé.
 *
 * Chaque contenu = un `media` publié dont le `type` est le format :
 *   - podcast : `media_url` = fichier audio (lecteur HTML5), vignette =
 *     pochette du podcast.
 *   - video / live : `media_url` = embed YouTube sans cookie, vignette =
 *     miniature de la vidéo.
 *   - dessin : vignette = le dessin lui-même (l'image EST le contenu).
 * Toujours : titre, tags, nom du média source, lien source (« ... sur le
 * site source » ↗), langue.
 */

const USER_AGENT =
  'Mozilla/5.0 (compatible; MaintenantRevueDePresse/1.0; +https://maintenant-le-mouvement.org)';
const TAILLE_MAX_IMAGE_OCTETS = 6_000_000;

/**
 * Âge maximal d'un contenu importable (revue 2026-06-13, Ben : « classer
 * par dates les plus récents d'abord » ; on n'importe plus de vieux
 * contenus qui polluaient le flux, ex. un dessin d'il y a 1 an). 45 jours
 * couvre les sources peu actives (dessinateurices, podcasts mensuels)
 * sans laisser entrer du contenu périmé.
 */
export const AGE_MAX_JOURS = 45;
const AGE_MAX_MS = AGE_MAX_JOURS * 24 * 3600 * 1000;

/** Le contenu est-il assez récent pour la revue de presse (actu) ? */
export function estAssezRecent(publieLe: number | null, maintenantMs: number): boolean {
  return publieLe !== null && maintenantMs - publieLe <= AGE_MAX_MS;
}

/** Embed YouTube respectueux de la vie privée (pas de cookie avant lecture). */
export function urlEmbedYoutube(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/** Récupère et analyse le flux d'une source ; lève si le flux est en échec. */
export async function lireFluxMedia(source: SourceMedia): Promise<ArticleFlux[]> {
  const reponse = await fetch(source.flux, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    },
  });
  if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
  return analyserFlux(await reponse.text());
}

/**
 * Un article du flux est-il exploitable pour ce format ? (la ressource
 * indispensable doit être présente : audio pour un podcast, identifiant
 * vidéo pour une vidéo/live, image pour un dessin).
 */
export function articleExploitable(format: FormatMedia, article: ArticleFlux): boolean {
  if (article.publieLe === null) return false;
  switch (format) {
    case 'podcast':
      return article.audioUrl !== null;
    case 'video':
    case 'live':
      return article.videoId !== null;
    case 'dessin':
      // L'image peut être dans le flux OU récupérée en og:image de la
      // page (repli) : on n'exige qu'un lien ici, l'image est vérifiée
      // à l'insertion.
      return article.lien !== '';
  }
}

export type ResultatInsertionMedia = { ok: true; slug: string } | { ok: false; message: string };

/** Liens source déjà importés pour un format (idempotence). */
export async function liensExistantsFormat(
  format: FormatMedia,
  urlSb: string,
  cle: string,
): Promise<Set<string>> {
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  const r = await fetch(
    `${urlSb}/rest/v1/media?type=eq.${format}&select=source_url&order=created_at.desc&limit=2000`,
    { headers: entetes },
  );
  if (!r.ok) return new Set();
  const lignes = (await r.json()) as Array<{ source_url: string | null }>;
  return new Set(lignes.map((l) => l.source_url).filter((u): u is string => u !== null));
}

/** Sources de ce format déjà publiées dans les dernières 24 h. */
async function sourcesRecentes(
  format: FormatMedia,
  urlSb: string,
  cle: string,
): Promise<Set<string>> {
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  const depuis = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const r = await fetch(
    `${urlSb}/rest/v1/media?type=eq.${format}&publie_le=gte.${encodeURIComponent(depuis)}&select=provenance_externe`,
    { headers: entetes },
  );
  if (!r.ok) return new Set();
  const lignes = (await r.json()) as Array<{ provenance_externe: string | null }>;
  return new Set(lignes.map((l) => l.provenance_externe).filter((s): s is string => s !== null));
}

/** Télécharge une image et la copie dans le bucket public `media`. */
async function copierImage(
  urlImage: string,
  cheminBucket: string,
  urlSb: string,
  cle: string,
): Promise<string | null> {
  try {
    const rImg = await fetch(urlImage, { headers: { 'User-Agent': USER_AGENT } });
    const typeMime = rImg.headers.get('content-type') ?? '';
    if (!rImg.ok || !typeMime.startsWith('image/')) return null;
    const octets = new Uint8Array(await rImg.arrayBuffer());
    if (octets.length === 0 || octets.length > TAILLE_MAX_IMAGE_OCTETS) return null;
    const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
    const rUp = await fetch(`${urlSb}/storage/v1/object/media/${cheminBucket}`, {
      method: 'POST',
      headers: { ...entetes, 'Content-Type': typeMime, 'x-upsert': 'true' },
      body: octets,
    });
    return rUp.ok ? `${urlSb}/storage/v1/object/public/media/${cheminBucket}` : null;
  } catch {
    return null;
  }
}

/**
 * Insère un contenu (podcast/vidéo/live/dessin) dans la table `media`.
 * Idempotent par `source_url`. L'image est copiée dans le bucket
 * (anti-hotlink). Pour les vidéos/lives, `media_url` est l'embed YouTube.
 */
export async function telechargerEtInsererMedia(
  source: SourceMedia,
  article: ArticleFlux,
  urlSb: string,
  cle: string,
): Promise<ResultatInsertionMedia> {
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  const format = source.format;

  if (!articleExploitable(format, article)) {
    return { ok: false, message: `ressource ${format} manquante (audio/vidéo/image)` };
  }

  // Idempotence : ce contenu existe déjà ?
  const rExiste = await fetch(
    `${urlSb}/rest/v1/media?source_url=eq.${encodeURIComponent(article.lien)}&select=id&limit=1`,
    { headers: entetes },
  );
  if (rExiste.ok && (((await rExiste.json()) as unknown[]) ?? []).length > 0) {
    return { ok: false, message: 'déjà importé' };
  }

  const slugBase = slugifier(article.titre).slice(0, 70).replace(/-+$/, '');
  const slug = `${slugBase}-${(article.publieLe ?? Date.now()).toString(36)}`;

  // Vignette : miniature YouTube, pochette podcast, ou le dessin lui-même.
  // L'image du flux est copiée dans le bucket (anti-hotlink).
  let vignetteUrl: string | null = null;
  if (article.imageUrl !== null) {
    vignetteUrl = await copierImage(article.imageUrl, `medias/${format}/${slug}.jpg`, urlSb, cle);
  }
  // Repli YouTube : miniature déductible de l'identifiant vidéo.
  if (vignetteUrl === null && article.videoId !== null) {
    vignetteUrl = await copierImage(
      `https://i.ytimg.com/vi/${article.videoId}/hqdefault.jpg`,
      `medias/${format}/${slug}.jpg`,
      urlSb,
      cle,
    );
  }
  // Repli dessin : beaucoup de sources (Substack, SPIP, Mastodon sans
  // média, presse) ne mettent pas l'image dans le flux mais l'exposent
  // en og:image de la page. L'image EST le contenu d'un dessin : on va
  // donc la chercher sur la page avant de renoncer.
  if (vignetteUrl === null && format === 'dessin') {
    const ogImage = await chercherImageArticle(article.lien);
    if (ogImage !== null) {
      vignetteUrl = await copierImage(ogImage, `medias/${format}/${slug}.jpg`, urlSb, cle);
    }
  }
  // Un dessin SANS image n'a pas de raison d'être (l'image est le contenu).
  if (format === 'dessin' && vignetteUrl === null) {
    return { ok: false, message: 'dessin sans image exploitable' };
  }

  // media_url : audio (podcast) ou embed vidéo (video/live). Les dessins
  // n'en ont pas (l'image suffit).
  let mediaUrl: string | null = null;
  if (format === 'podcast') mediaUrl = article.audioUrl;
  else if (format === 'video' || format === 'live')
    mediaUrl = article.videoId !== null ? urlEmbedYoutube(article.videoId) : null;

  const corps = extrairePremieresLignes(article.description, 650);

  const ligne = {
    slug,
    titre: article.titre.slice(0, 200),
    corps,
    type: format,
    statut: 'publie',
    publie_le: new Date(article.publieLe ?? Date.now()).toISOString(),
    auteurice_id: null,
    provenance_externe: source.nom,
    source_url: article.lien,
    vignette_url: vignetteUrl,
    media_url: mediaUrl,
    tags: assignerTags(`${article.titre} ${corps}`),
    langue: source.langue,
    // Un contenu avec une vraie vignette s'affiche en grand (« important »).
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

export interface RapportImportFormat {
  format: FormatMedia;
  crees: string[];
  echecs: string[];
}

/**
 * Importe jusqu'à `cible` nouveaux contenus d'un format. Parcourt les
 * sources (mélangées par un offset déterministe selon le jour pour varier
 * d'un jour à l'autre), prend l'article le plus récent non importé de
 * chaque source, en sautant les sources déjà publiées dans les 24 h.
 */
export async function importerFormat(
  format: FormatMedia,
  urlSb: string,
  cle: string,
  cible: number,
  rotationOffset = 0,
): Promise<RapportImportFormat> {
  const crees: string[] = [];
  const echecs: string[] = [];
  const existants = await liensExistantsFormat(format, urlSb, cle);
  const recentes = await sourcesRecentes(format, urlSb, cle);

  const toutes = SOURCES_PAR_FORMAT[format];
  // Rotation : on commence à un offset différent chaque jour pour ne pas
  // toujours servir les mêmes sources en tête de liste.
  const ordre =
    toutes.length > 0
      ? toutes.map((_, i) => toutes[(i + rotationOffset) % toutes.length] as SourceMedia)
      : [];

  for (const source of ordre) {
    if (crees.length >= cible) break;
    if (recentes.has(source.nom)) continue;
    try {
      const articles = await lireFluxMedia(source);
      // Candidats : articles non encore importés, assez RÉCENTS (Ben
      // 2026-06-13 : pas de vieux contenu dans le flux) et exploitables,
      // du plus récent au plus ancien. On en essaie plusieurs (au plus 5)
      // car le plus récent peut échouer (image introuvable pour un dessin,
      // par exemple) alors que le suivant passe.
      const maintenantMs = Date.now();
      const candidats = articles
        .filter(
          (a) =>
            !existants.has(a.lien) &&
            estAssezRecent(a.publieLe, maintenantMs) &&
            articleExploitable(format, a),
        )
        .slice(0, 5);
      if (candidats.length === 0) {
        echecs.push(`[${source.nom}] rien de neuf à importer`);
        continue;
      }
      for (const article of candidats) {
        const resultat = await telechargerEtInsererMedia(source, article, urlSb, cle);
        existants.add(article.lien);
        if (resultat.ok) {
          crees.push(`[${source.nom}] ${resultat.slug}`);
          break;
        }
        echecs.push(`[${source.nom}] ${resultat.message}`);
      }
    } catch (e) {
      echecs.push(`[${source.nom}] FLUX EN ÉCHEC (${e instanceof Error ? e.message : e})`);
    }
  }

  return { format, crees, echecs };
}
