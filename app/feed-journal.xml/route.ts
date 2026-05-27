import { SITE, getSiteUrl } from '@/config/site';
import { getSupabaseServer } from '@/lib/supabase';
import { tronquerMots } from '@/lib/texte-apercu';
import { NextResponse } from 'next/server';

/**
 * Flux RSS 2.0 du journal-affiche (V2.4.52).
 *
 * GET `/feed-journal.xml` — 30 dernières éditions publiées de Maintenant
 * Médias (journal-affiche), triées par publie_le desc.
 *
 * Distinct du flux principal `/feed.xml` (articles de la rédaction) :
 * permet aux lecteurices intéressé·es spécifiquement par les éditions
 * imprimables A3/A4 de s'abonner sans recevoir les brèves quotidiennes.
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
    .from('journal_affiche')
    .select(
      'id, slug, titre, sous_titre, numero, format, contenu_md, publie_le, image_couverture_url',
    )
    .eq('statut', 'publie')
    .not('publie_le', 'is', null)
    .order('publie_le', { ascending: false })
    .limit(30);

  if (error !== null) {
    return new NextResponse(`Erreur: ${error.message}`, { status: 500 });
  }

  const items = (data ?? [])
    .map((e) => {
      const lien = `${base}/s-informer/journal/${e.slug}`;
      const titreComplet = `${e.titre} (n°${e.numero}, ${e.format})`;
      const description = tronquerMots(e.sous_titre ?? e.contenu_md ?? '', 50);
      const pubDate =
        e.publie_le !== null ? new Date(e.publie_le).toUTCString() : new Date().toUTCString();
      const enclosure =
        e.image_couverture_url !== null
          ? `      <enclosure url="${escaperXml(e.image_couverture_url)}" type="image/jpeg" length="0"/>`
          : '';
      return `    <item>
      <title>${escaperXml(titreComplet)}</title>
      <link>${escaperXml(lien)}</link>
      <guid isPermaLink="true">${escaperXml(lien)}</guid>
      <description>${escaperXml(description)}</description>
      <category>journal-affiche</category>
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
    <title>${escaperXml(`${SITE.nom} Médias — Journal-affiche`)}</title>
    <link>${base}/s-informer/journal</link>
    <atom:link href="${base}/feed-journal.xml" rel="self" type="application/rss+xml"/>
    <description>Le journal-affiche du mouvement Maintenant!, imprimable A3/A4.</description>
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
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
