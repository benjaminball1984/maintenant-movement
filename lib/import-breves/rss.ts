/**
 * Analyseur RSS 2.0 / Atom léger, sans dépendance (même approche que
 * l'import de l'Agenda Militant : expressions régulières tolérantes,
 * suffisantes pour des flux de presse standards).
 *
 * Couvre : <item> (RSS) et <entry> (Atom), titres/descriptions en CDATA,
 * dates RFC 822 et ISO 8601, images via <enclosure>, <media:content>,
 * <media:thumbnail> ou première <img> du contenu.
 */

export interface ArticleFlux {
  titre: string;
  lien: string;
  /** Texte nettoyé (balises retirées), non tronqué. */
  description: string;
  /** Date de publication (epoch ms), ou null si illisible. */
  publieLe: number | null;
  /** URL d'image candidate, ou null. */
  imageUrl: string | null;
  /**
   * URL du fichier audio (`<enclosure type="audio/...">`), pour les flux
   * de podcasts. null si le flux n'est pas un podcast.
   */
  audioUrl: string | null;
  /**
   * Identifiant de vidéo YouTube (`<yt:videoId>`), pour les flux de
   * chaînes YouTube. Sert à construire l'embed. null sinon.
   */
  videoId: string | null;
}

/**
 * Entités HTML nommées rencontrées dans les flux de presse (typographie
 * et accents français inclus). Constat Ben 2026-06-12 : des brèves
 * affichaient « d&rsquo;herbicide » au lieu de « d'herbicide », parce que
 * le décodeur ne connaissait que les entités de base.
 */
const ENTITES_NOMMEES: Record<string, string> = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
  shy: '',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  bdquo: '„',
  laquo: '«',
  raquo: '»',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  eacute: 'é',
  egrave: 'è',
  ecirc: 'ê',
  euml: 'ë',
  agrave: 'à',
  aacute: 'á',
  acirc: 'â',
  auml: 'ä',
  icirc: 'î',
  iuml: 'ï',
  iacute: 'í',
  ocirc: 'ô',
  ouml: 'ö',
  oacute: 'ó',
  ugrave: 'ù',
  ucirc: 'û',
  uuml: 'ü',
  uacute: 'ú',
  ccedil: 'ç',
  ntilde: 'ñ',
  aelig: 'æ',
  oelig: 'œ',
  szlig: 'ß',
  Eacute: 'É',
  Egrave: 'È',
  Ecirc: 'Ê',
  Agrave: 'À',
  Acirc: 'Â',
  Ccedil: 'Ç',
  Ocirc: 'Ô',
  OElig: 'Œ',
  AElig: 'Æ',
  copy: '©',
  reg: '®',
  trade: '™',
  deg: '°',
  euro: '€',
  pound: '£',
  sect: '§',
  middot: '·',
  bull: '•',
  times: '×',
  divide: '÷',
  plusmn: '±',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',
  sup2: '²',
  sup3: '³',
  micro: 'µ',
};

/**
 * Décode les entités HTML/XML des flux : numériques (`&#8217;`,
 * `&#x2019;`) et nommées (table ci-dessus). DEUX passes, parce que les
 * flux de presse double-encodent parfois (`&amp;rsquo;` doit donner « ' »,
 * pas rester « &rsquo; »). Une entité inconnue est laissée telle quelle.
 */
export function decoderEntitesXml(s: string): string {
  const decoderUnePasse = (t: string) =>
    t
      .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, n: string) =>
        String.fromCodePoint(Number.parseInt(n, 16)),
      )
      .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (tout, nom: string) => ENTITES_NOMMEES[nom] ?? tout);
  const sansCdata = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  return decoderUnePasse(decoderUnePasse(sansCdata));
}

/**
 * Retire les balises HTML et normalise les espaces. Les légendes d'images
 * (`<figcaption>`, crédits photo type « © Untel/Agence ») sont retirées
 * AVEC leur contenu : insérées au milieu d'un extrait, elles donnent un
 * texte incohérent (constat Ben 2026-06-12).
 */
export function texteDepuisHtml(html: string): string {
  return decoderEntitesXml(html)
    .replace(/<(script|style|figcaption)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Invites de SITE (pas du contenu d'article) à écarter de l'étoffage :
 * newsletters, création de compte, applis, abonnement, dons, cookies.
 * Constat Ben 2026-06-12 : « Complétez votre profil en quelques secondes
 * pour recevoir nos newsletters et télécharger notre appli » (Jeune
 * Afrique) importé en tête de plusieurs brèves.
 */
export function estParagrapheParasite(texte: string): boolean {
  return /compl[ée]tez votre profil|newsletter|t[ée]l[ée]charge[rz][^.]{0,25}appli|abonnez-vous|r[ée]serv[ée]e? aux abonn[ée]|inscrivez-vous|cr[ée]e[rz] (un|votre) compte|connectez-vous|identifiez-vous|faire un don|soutenez-nous|cookies|politique de confidentialit[ée]|acc[èe]s illimit[ée]|offre d['’]abonnement|premier mois offert|sign up|subscribe|already a member|^publi[ée] le |mis(e)? [àa] jour le|modifi[ée] (le |hier|aujourd)/i.test(
    texte,
  );
}

/**
 * Texte des paragraphes `<p>` d'une page d'article : sert à ÉTOFFER une
 * brève quand la description du flux est trop courte (règle Ben
 * 2026-06-12 : aucune brève sous ~6 lignes). Les blocs hors article
 * (scripts, navigation, légendes), les miettes (boutons, mentions) et
 * les invites de site (newsletter, abonnement...) sont écartés.
 */
export function extraireParagraphes(html: string, longueurMinParagraphe = 60): string {
  const sansBlocs = html.replace(
    /<(script|style|figcaption|aside|nav|header|footer)[\s\S]*?<\/\1>/gi,
    ' ',
  );
  return [...sansBlocs.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => texteDepuisHtml(m[1] ?? ''))
    .filter((t) => t.length >= longueurMinParagraphe && !estParagrapheParasite(t))
    .join(' ');
}

function premierMatch(bloc: string, motifs: RegExp[]): string | null {
  for (const motif of motifs) {
    const m = bloc.match(motif);
    if (m?.[1] !== undefined && m[1].trim() !== '') return m[1].trim();
  }
  return null;
}

/**
 * Images « techniques » à ne JAMAIS prendre pour vignette d'article :
 * émojis WordPress (`s.w.org/images/core/emoji/`, le « doigt jaune » 👉
 * des brèves Regards, constat Ben 2026-06-12), smileys, pictos, pixels
 * de mesure, avatars.
 */
export function estImageTechnique(src: string): boolean {
  return /emoji|smilie|smiley|logo|\/icons?\/|spacer|pixel|avatar|gravatar|\.svg(\?|$)/i.test(src);
}

function extraireImage(bloc: string): string | null {
  const direct = premierMatch(bloc, [
    /<enclosure[^>]+url="([^"]+)"[^>]*type="image\/[^"]*"/i,
    /<enclosure[^>]+type="image\/[^"]*"[^>]+url="([^"]+)"/i,
    /<media:content[^>]+url="([^"]+\.(?:jpe?g|png|webp|gif)[^"]*)"/i,
    /<media:content[^>]+url="([^"]+)"[^>]+medium="image"/i,
    /<media:thumbnail[^>]+url="([^"]+)"/i,
    // itunes:image (podcasts) : niveau item de préférence.
    /<itunes:image[^>]+href="([^"]+)"/i,
  ]);
  if (direct !== null && !estImageTechnique(direct)) return decoderEntitesXml(direct);
  // Première <img> NON technique du contenu encodé (description ou
  // content:encoded) : les émojis et pictos sont sautés.
  for (const m of bloc.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    const src = m[1] ?? '';
    if (src !== '' && !estImageTechnique(src)) return decoderEntitesXml(src);
  }
  return null;
}

/** URL audio d'un podcast : `<enclosure type="audio/...">`. */
function extraireAudio(bloc: string): string | null {
  const m =
    bloc.match(/<enclosure[^>]+url="([^"]+)"[^>]*type="audio\/[^"]*"/i) ??
    bloc.match(/<enclosure[^>]+type="audio\/[^"]*"[^>]+url="([^"]+)"/i);
  return m?.[1] !== undefined ? decoderEntitesXml(m[1]) : null;
}

/** Identifiant de vidéo YouTube : `<yt:videoId>`. */
function extraireVideoId(bloc: string): string | null {
  const m = bloc.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i);
  return m?.[1] !== undefined ? m[1].trim() : null;
}

function extraireLien(bloc: string): string | null {
  // RSS : <link>https://...</link> (parfois en CDATA).
  const lienRss = bloc.match(/<link>([\s\S]*?)<\/link>/i);
  if (lienRss?.[1] !== undefined) {
    const decode = decoderEntitesXml(lienRss[1]).trim();
    if (decode.startsWith('http')) return decode;
  }
  // Atom : <link rel="alternate" href="..."/> ou premier <link href>.
  const lienAtom = premierMatch(bloc, [
    /<link[^>]+rel="alternate"[^>]+href="([^"]+)"/i,
    /<link[^>]+href="([^"]+)"[^>]+rel="alternate"/i,
    /<link[^>]+href="([^"]+)"/i,
  ]);
  return lienAtom !== null ? decoderEntitesXml(lienAtom) : null;
}

/**
 * Analyse un flux RSS/Atom et retourne ses articles, du plus récent au
 * plus ancien (selon la date de publication déclarée).
 */
export function analyserFlux(xml: string): ArticleFlux[] {
  const blocs = [
    ...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi),
    ...xml.matchAll(/<entry[\s>][\s\S]*?<\/entry>/gi),
  ].map((m) => m[0]);

  const articles: ArticleFlux[] = [];
  for (const bloc of blocs) {
    const titreBrut = premierMatch(bloc, [/<title[^>]*>([\s\S]*?)<\/title>/i]);
    const lien = extraireLien(bloc);
    if (titreBrut === null || lien === null) continue;

    const descriptionBrute =
      premierMatch(bloc, [
        /<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i,
        /<description[^>]*>([\s\S]*?)<\/description>/i,
        /<summary[^>]*>([\s\S]*?)<\/summary>/i,
        /<content[^>]*>([\s\S]*?)<\/content>/i,
        // Flux YouTube (Atom + media RSS) : le texte est dans
        // <media:description>. Sans ça les vidéos/lives n'ont aucun corps
        // (constat Ben 2026-06-13 : « il devrait y avoir du texte »).
        /<media:description[^>]*>([\s\S]*?)<\/media:description>/i,
      ]) ?? '';

    const dateBrute = premierMatch(bloc, [
      /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i,
      /<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i,
      /<published[^>]*>([\s\S]*?)<\/published>/i,
      /<updated[^>]*>([\s\S]*?)<\/updated>/i,
    ]);
    const horodatage = dateBrute !== null ? Date.parse(decoderEntitesXml(dateBrute)) : Number.NaN;

    articles.push({
      titre: texteDepuisHtml(titreBrut),
      lien,
      description: texteDepuisHtml(descriptionBrute),
      publieLe: Number.isNaN(horodatage) ? null : horodatage,
      imageUrl: extraireImage(bloc),
      audioUrl: extraireAudio(bloc),
      videoId: extraireVideoId(bloc),
    });
  }

  return articles.sort((a, b) => (b.publieLe ?? 0) - (a.publieLe ?? 0));
}

/**
 * Extrait d'une brève : les premières phrases de la description, bornées
 * pour tenir en 5 à 7 lignes d'affichage (~650 caractères), coupées sur
 * un mot avec ellipse.
 */
export function extrairePremieresLignes(description: string, longueurMax = 650): string {
  const propre = description.trim();
  if (propre.length <= longueurMax) return propre;
  const coupe = propre.slice(0, longueurMax);
  const dernierEspace = coupe.lastIndexOf(' ');
  return `${coupe.slice(0, dernierEspace > 200 ? dernierEspace : longueurMax).trimEnd()}…`;
}
