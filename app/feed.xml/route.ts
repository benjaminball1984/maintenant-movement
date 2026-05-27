import { SITE, getSiteUrl } from '@/config/site';
import { getSupabaseServer } from '@/lib/supabase';
import { tronquerMots } from '@/lib/texte-apercu';
import { NextResponse } from 'next/server';

/**
 * Flux RSS 2.0 des articles publiés (V2.4.42).
 *
 * GET `/feed.xml` — 30 derniers articles publiés (édito, tribune,
 * article, brève, dessin, podcast, vidéo, live, newsletter), triés par
 * `publie_le` desc. Format RSS 2.0 standard (Atom-compatible via
 * `<atom:link>`).
 *
 * Permet aux lecteurices d'agréger Maintenant Médias dans leur lecteur
 * RSS (Feedly, Inoreader, NetNewsWire, etc.). Pas de full content :
 * on met juste le titre + corps tronqué + lien (200 mots max). Pour
 * lire l'article complet, le lecteurice clique sur le lien.
 */

function escaperXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const base = getSiteUrl().replace(/\/$/, '');
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('media')
    .select('id, slug, titre, corps, type, publie_le, vignette_url')
    .eq('statut', 'publie')
    .not('publie_le', 'is', null)
    .order('publie_le', { ascending: false })
    .limit(30);

  if (error !== null) {
    return new NextResponse(`Erreur: ${error.message}`, { status: 500 });
  }

  const items = (data ?? [])
    .map((m) => {
      // Nom de l'auteur·ice masqué par défaut (cf. politique de visibilité
      // V1, la table `media` n'expose pas auteurice_prenom/nom).
      const auteur = 'Rédaction';
      const lien = `${base}/s-informer/media/${m.slug}`;
      const description = tronquerMots(m.corps, 50);
      const pubDate =
        m.publie_le !== null ? new Date(m.publie_le).toUTCString() : new Date().toUTCString();
      const enclosure =
        m.vignette_url !== null
          ? `      <enclosure url="${escaperXml(m.vignette_url)}" type="image/jpeg" length="0"/>`
          : '';
      return `    <item>
      <title>${escaperXml(m.titre)}</title>
      <link>${escaperXml(lien)}</link>
      <guid isPermaLink="true">${escaperXml(lien)}</guid>
      <description>${escaperXml(description)}</description>
      <author>noreply@maintenant-le-mouvement.org (${escaperXml(auteur)})</author>
      <category>${escaperXml(m.type)}</category>
      <pubDate>${pubDate}</pubDate>
${enclosure}
    </item>`;
    })
    .join('\n');

  const lastBuildDate =
    data && data.length > 0 && data[0]?.publie_le !== null && data[0]?.publie_le !== undefined
      ? new Date(data[0].publie_le).toUTCString()
      : new Date().toUTCString();

  const corps = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escaperXml(`${SITE.nom} Médias`)}</title>
    <link>${base}/s-informer/media</link>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>${escaperXml(SITE.descriptionCourte)}</description>
    <language>fr-FR</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new NextResponse(corps, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900',
    },
  });
}
