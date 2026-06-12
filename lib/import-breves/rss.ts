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
}

/** Décode les entités HTML/XML courantes des flux. */
export function decoderEntitesXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n: string) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/** Retire les balises HTML et normalise les espaces. */
export function texteDepuisHtml(html: string): string {
  return decoderEntitesXml(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function premierMatch(bloc: string, motifs: RegExp[]): string | null {
  for (const motif of motifs) {
    const m = bloc.match(motif);
    if (m?.[1] !== undefined && m[1].trim() !== '') return m[1].trim();
  }
  return null;
}

function extraireImage(bloc: string): string | null {
  const direct = premierMatch(bloc, [
    /<enclosure[^>]+url="([^"]+)"[^>]*type="image\/[^"]*"/i,
    /<enclosure[^>]+type="image\/[^"]*"[^>]+url="([^"]+)"/i,
    /<media:content[^>]+url="([^"]+\.(?:jpe?g|png|webp|gif)[^"]*)"/i,
    /<media:content[^>]+url="([^"]+)"[^>]+medium="image"/i,
    /<media:thumbnail[^>]+url="([^"]+)"/i,
  ]);
  if (direct !== null) return decoderEntitesXml(direct);
  // Première <img> du contenu encodé (description ou content:encoded).
  const contenu = bloc.match(/<img[^>]+src=["']([^"']+)["']/i);
  return contenu?.[1] !== undefined ? decoderEntitesXml(contenu[1]) : null;
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
