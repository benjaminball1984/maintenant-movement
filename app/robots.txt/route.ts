import { getSiteUrl } from '@/config/site';
import { NextResponse } from 'next/server';

/**
 * `/robots.txt` dynamique (V2.4.40).
 *
 * Autorise tout par défaut, sauf les espaces qui n'ont rien à faire
 * dans un index public (admin, profil, API auth). Pointe vers le
 * sitemap.
 */
export function GET() {
  const base = getSiteUrl().replace(/\/$/, '');
  const corps = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /profil
Disallow: /api/
Disallow: /auth/

Sitemap: ${base}/sitemap.xml
`;
  return new NextResponse(corps, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
