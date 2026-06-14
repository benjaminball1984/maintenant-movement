import { slugifier } from '@/lib/helpers-purs';
import { chercherDescriptionArticle, chercherImageArticle } from '@/lib/import-breves/importer';
import { type ArticleFlux, analyserFlux, extrairePremieresLignes } from '@/lib/import-breves/rss';
import { assignerTags } from '@/lib/import-breves/tags';
import {
  type FormatMedia,
  SOURCES_PAR_FORMAT,
  type SourceMedia,
} from '@/lib/import-medias/sources-medias';
import { comparerTitres } from '@/lib/media/doublons';

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

/** Embed YouTube respectueux de la vie privée (pas de cookie avant lecture). */
export function urlEmbedYoutube(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/**
 * Badges de « direct » dans un titre de flux RSS/YouTube. ATTENTION : un flux
 * RSS livre ces items APRÈS la fin du direct (ce sont des REDIFFUSIONS) et
 * n'expose aucun statut « en cours ». On ne peut donc PAS en déduire un vrai
 * live (constat Ben 2026-06-14, capture de l'onglet Lives : il se remplissait
 * de rediffusions YouTube titrées « 🔴 » qui n'étaient plus en direct et ne
 * se retiraient jamais). Ces marqueurs servent donc UNIQUEMENT à NETTOYER le
 * titre affiché (un badge « 🔴 / [EN DIRECT] » sur une vidéo enregistrée
 * induit le lecteur en erreur). Le type `live` est désormais réservé aux
 * vrais directs Twitch (API Helix temps réel, retrait auto à la fin) : voir
 * `lib/import-twitch`.
 */
/**
 * Retire d'un titre les badges de direct trompeurs (🔴, [EN DIRECT], [LIVE],
 * « EN DIRECT : … » en tête) pour une rediffusion stockée en `video`.
 * Conservateur : ne touche pas au mot « direct »/« live » employé au fil d'une
 * phrase (« directive », « action directe », « alive »…), ni à un « : » de
 * titre qui n'est pas précédé du badge.
 */
export function nettoyerTitreLive(titre: string): string {
  return titre
    .replace(/🔴/g, ' ') // pastille rouge de direct
    .replace(/\[(?:en\s+)?direct\]/gi, ' ') // [DIRECT] / [EN DIRECT]
    .replace(/\[live\]/gi, ' ') // [LIVE]
    .replace(/^\s*(?:en\s+direct|live)\s*[:–—-]\s*/i, '') // « EN DIRECT : … » en tête
    .replace(/\s{2,}/g, ' ')
    .trim();
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

/** Seuils de la détection de doublon vidéo/brève (mêmes valeurs que doublons.ts). */
const DOUBLON_SEUIL = 0.75;
const DOUBLON_MIN_COMMUNS = 4;
const DOUBLON_FENETRE_MS = 4 * 24 * 3600 * 1000;

/**
 * Cherche une brève RÉCENTE de la même source portant le même sujet que la
 * vidéo/live qu'on importe (V2.6.113, demande Ben). Si trouvée, la vidéo
 * absorbe son texte et la brève est retirée après insertion (évite la double
 * carte vidéo + brève). Best-effort : erreur réseau → `null`.
 */
async function chercherBreveMemeSujet(
  titre: string,
  sourceNom: string,
  urlSb: string,
  cle: string,
): Promise<{ id: string; corps: string | null } | null> {
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  const depuis = new Date(Date.now() - DOUBLON_FENETRE_MS).toISOString();
  try {
    const r = await fetch(
      `${urlSb}/rest/v1/media?type=eq.breve&statut=eq.publie&provenance_externe=eq.${encodeURIComponent(sourceNom)}&publie_le=gte.${encodeURIComponent(depuis)}&select=id,titre,corps&limit=50`,
      { headers: entetes },
    );
    if (!r.ok) return null;
    const breves = (await r.json()) as Array<{ id: string; titre: string; corps: string | null }>;
    for (const b of breves) {
      const { score, communs } = comparerTitres(titre, b.titre);
      if (score >= DOUBLON_SEUIL && communs >= DOUBLON_MIN_COMMUNS) {
        return { id: b.id, corps: b.corps };
      }
    }
    return null;
  } catch {
    return null;
  }
}

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

  let corps = extrairePremieresLignes(article.description, 650);

  // Texte trop court (fréquent pour les dessins) : on prend la méta
  // `og:description` de la page (résumé PROPRE exposé par le site), pas les
  // paragraphes bruts qui ramassent le chrome (encarts de don, « à lire
  // aussi »). Constat Ben 2026-06-13 : « il devrait y avoir du texte ».
  if (corps.length < 200) {
    const desc = await chercherDescriptionArticle(article.lien);
    if (desc !== null && desc.length > corps.length) {
      corps = extrairePremieresLignes(desc, 650);
    }
  }

  // Doublon vidéo/brève (V2.6.113) : si une brève récente de la même source
  // porte ce sujet, la vidéo absorbe son texte (6-7 lignes sous la vidéo) et
  // la brève sera retirée après l'insertion.
  let breveAabsorber: string | null = null;
  if (format === 'video' || format === 'live') {
    const breve = await chercherBreveMemeSujet(article.titre, source.nom, urlSb, cle);
    if (breve !== null) {
      if ((breve.corps?.length ?? 0) > corps.length) corps = breve.corps ?? corps;
      breveAabsorber = breve.id;
    }
  }

  // Type RÉEL (V2.6.116) : un flux RSS/YouTube ne peut PAS attester d'un
  // direct EN COURS (il ne sert que des rediffusions, sans statut « live »).
  // On stocke donc TOUJOURS ces contenus en `video` et on nettoie le badge
  // « direct » trompeur du titre. Le type `live` est réservé aux vrais
  // directs Twitch (lib/import-twitch, temps réel + retrait à la fin).
  const estVideoOuLive = format === 'video' || format === 'live';
  const typeStocke: FormatMedia = estVideoOuLive ? 'video' : format;
  const titreFinal = estVideoOuLive ? nettoyerTitreLive(article.titre) : article.titre;

  const ligne = {
    slug,
    titre: titreFinal.slice(0, 200),
    corps,
    type: typeStocke,
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

  // Retire la brève doublon (réversible) : la vidéo porte désormais le texte.
  if (breveAabsorber !== null) {
    await fetch(`${urlSb}/rest/v1/media?id=eq.${breveAabsorber}`, {
      method: 'PATCH',
      headers: { ...entetes, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        statut: 'retire',
        retire_le: new Date().toISOString(),
        raison_retrait: `Doublon fusionné avec la vidéo « ${article.titre.slice(0, 120)} ».`,
      }),
    });
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
      // Candidats : articles non encore importés et exploitables, du plus
      // récent au plus ancien. On en essaie plusieurs (au plus 5) car le
      // plus récent peut échouer (image introuvable pour un dessin, par
      // exemple) alors que le suivant passe. Pas de filtre d'âge : les
      // contenus anciens sont gardés (décision Ben 2026-06-13), simplement
      // classés plus bas par le tri du flux (date de publication).
      const candidats = articles
        .filter((a) => !existants.has(a.lien) && articleExploitable(format, a))
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
