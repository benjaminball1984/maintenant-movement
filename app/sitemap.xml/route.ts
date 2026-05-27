import { getSiteUrl } from '@/config/site';
import { getSupabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Sitemap dynamique (V2.4.40).
 *
 * GET `/sitemap.xml` — généré à chaque requête (pas de cache CDN
 * pour rester à jour à la minute). Liste :
 * - les pages statiques racines
 * - les pétitions publiées
 * - les mobilisations publiées
 * - les cagnottes publiées
 * - les communes (publiques)
 * - les fédérations (publiques)
 * - les médias publiés
 * - les sondages ouverts
 * - les salles Décider (visibilité public)
 * - les éditions journal publiées
 *
 * Toutes les URLs sont absolues (préfixe `getSiteUrl()`). Le format
 * suit le standard sitemaps.org.
 */

const PAGES_STATIQUES: Array<{ path: string; priority: number }> = [
  { path: '/', priority: 1.0 },
  { path: '/s-informer', priority: 0.9 },
  { path: '/mobiliser', priority: 0.9 },
  { path: '/agir', priority: 0.9 },
  { path: '/s-entraider', priority: 0.9 },
  { path: '/co-construire', priority: 0.9 },
  { path: '/comprendre', priority: 0.8 },
  { path: '/comprendre/doctrine', priority: 0.8 },
  { path: '/comprendre/commune-libre', priority: 0.8 },
  { path: '/comprendre/assemblee-confederale', priority: 0.8 },
  { path: '/comprendre/faq', priority: 0.7 },
  { path: '/comprendre/monnaie', priority: 0.7 },
  { path: '/comprendre/ressources', priority: 0.7 },
  { path: '/a-propos', priority: 0.6 },
  { path: '/contact', priority: 0.5 },
  { path: '/mentions-legales', priority: 0.3 },
  { path: '/confidentialite', priority: 0.3 },
  { path: '/recherche', priority: 0.5 },
  { path: '/agenda', priority: 0.7 },
  { path: '/cartes', priority: 0.7 },
  { path: '/communes', priority: 0.7 },
  { path: '/s-informer/decider', priority: 0.7 },
  { path: '/s-informer/journal', priority: 0.7 },
  { path: '/s-informer/media', priority: 0.7 },
  { path: '/s-informer/sondages', priority: 0.7 },
  { path: '/mobiliser/petitions', priority: 0.7 },
  { path: '/mobiliser/mobilisations', priority: 0.7 },
  { path: '/mobiliser/cagnottes', priority: 0.7 },
  { path: '/mobiliser/campagnes', priority: 0.7 },
  { path: '/agir/communes', priority: 0.7 },
  { path: '/agir/federations', priority: 0.7 },
  { path: '/agir/moments-solidaires', priority: 0.7 },
  { path: '/s-entraider/marche', priority: 0.7 },
  { path: '/s-entraider/sel', priority: 0.7 },
  { path: '/s-entraider/groupes-locaux', priority: 0.7 },
];

function escaperXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface EntreeSitemap {
  loc: string;
  lastmod?: string;
  priority?: number;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

function composerSitemap(entrees: EntreeSitemap[]): string {
  const items = entrees
    .map((e) => {
      const parts = [`    <loc>${escaperXml(e.loc)}</loc>`];
      if (e.lastmod !== undefined) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
      if (e.changefreq !== undefined) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
      if (e.priority !== undefined) parts.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

export async function GET() {
  const base = getSiteUrl().replace(/\/$/, '');
  const supabase = await getSupabaseServer();

  // Toutes les requêtes en parallèle, lecture publique uniquement.
  const [
    petitionsR,
    mobilisationsR,
    cagnottesR,
    communesR,
    federationsR,
    mediasR,
    sondagesR,
    sallesR,
    editionsR,
    campagnesR,
    groupesR,
  ] = await Promise.all([
    supabase.from('petition').select('slug, updated_at').eq('statut', 'publiee').limit(5000),
    supabase.from('mobilisation').select('slug, updated_at').eq('statut', 'publiee').limit(5000),
    supabase.from('cagnotte').select('slug, updated_at').eq('statut', 'publiee').limit(5000),
    supabase.from('commune').select('slug, updated_at').limit(50000),
    supabase.from('federation').select('slug, updated_at').limit(1000),
    supabase.from('media').select('slug, updated_at').eq('statut', 'publie').limit(5000),
    supabase.from('sondage').select('slug, updated_at').eq('statut', 'ouvert').limit(1000),
    supabase
      .from('salle_decider')
      .select('slug, updated_at')
      .eq('type_visibilite', 'public')
      .limit(1000),
    supabase.from('journal_affiche').select('slug, updated_at').eq('statut', 'publie').limit(1000),
    supabase.from('campagne').select('slug, updated_at').eq('statut', 'publiee').limit(1000),
    supabase
      .from('groupe_entraide_local')
      .select('slug, updated_at')
      .eq('statut', 'publie')
      .limit(5000),
  ]);

  const entrees: EntreeSitemap[] = PAGES_STATIQUES.map((p) => ({
    loc: `${base}${p.path}`,
    priority: p.priority,
    changefreq: 'weekly',
  }));

  const ajouter = (
    rows: Array<{ slug: string; updated_at: string }> | null,
    prefixe: string,
    priority = 0.5,
  ) => {
    for (const r of rows ?? []) {
      entrees.push({
        loc: `${base}${prefixe}/${r.slug}`,
        lastmod: r.updated_at.slice(0, 10),
        priority,
        changefreq: 'weekly',
      });
    }
  };

  ajouter(petitionsR.data, '/mobiliser/petitions', 0.7);
  ajouter(mobilisationsR.data, '/mobiliser/mobilisations', 0.7);
  ajouter(cagnottesR.data, '/mobiliser/cagnottes', 0.7);
  ajouter(campagnesR.data, '/mobiliser/campagnes', 0.7);
  ajouter(communesR.data, '/agir/communes', 0.5);
  ajouter(federationsR.data, '/agir/federations', 0.6);
  ajouter(mediasR.data, '/s-informer/media', 0.6);
  ajouter(sondagesR.data, '/s-informer/sondages', 0.6);
  ajouter(sallesR.data, '/s-informer/decider', 0.5);
  ajouter(editionsR.data, '/s-informer/journal', 0.6);
  ajouter(groupesR.data, '/s-entraider/groupes-locaux', 0.5);

  return new NextResponse(composerSitemap(entrees), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Cache 1h côté CDN (assez frais sans surcharger Supabase).
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
