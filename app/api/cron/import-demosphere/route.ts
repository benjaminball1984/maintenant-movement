import {
  importerSiteDemosphere,
  liensDemosphereExistants,
} from '@/lib/import-demosphere/importer-demosphere';
import { SITES_DEMOSPHERE } from '@/lib/import-demosphere/sources-demosphere';
import { NextResponse } from 'next/server';

/**
 * Endpoint d'import QUOTIDIEN des mobilisations Demosphère (demande Ben
 * 2026-06-13). Le peuplement initial exhaustif se fait par script ; ce
 * cron ne rattrape que les NOUVEAUX événements à venir.
 *
 * Pour rester sous la limite de sous-requêtes du Worker (plan Free), on
 * ne traite que quelques sites par exécution (rotation par quantième du
 * jour) avec un petit plafond par site. Sur quelques jours, tous les
 * sites sont couverts ; les événements déjà importés sont ignorés.
 *
 * Appelé par le Worker cron `maintenant-cron-demosphere`. Protégé par
 * `CRON_SECRET`.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Sites traités par exécution et plafond de nouvelles mobilisations / site. */
const SITES_PAR_JOUR = 4;
const MAX_PAR_SITE = 3;

function jourDeLAnnee(): number {
  const maintenant = new Date();
  const debut = Date.UTC(maintenant.getUTCFullYear(), 0, 0);
  return Math.floor((maintenant.getTime() - debut) / 86_400_000);
}

export async function GET(requete: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const autorisation = requete.headers.get('authorization');
  if (secret === undefined || secret === '' || autorisation !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, message: 'Non autorisé.' }, { status: 401 });
  }

  const urlSb = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (urlSb === undefined || urlSb === '' || cle === undefined || cle === '') {
    return NextResponse.json(
      { ok: false, message: 'Variables Supabase manquantes.' },
      { status: 500 },
    );
  }

  // Fenêtre glissante de sites : SITES_PAR_JOUR sites par jour, qui tournent
  // selon le quantième pour couvrir tout le réseau sur ~6 jours.
  const total = SITES_DEMOSPHERE.length;
  const debut = (jourDeLAnnee() * SITES_PAR_JOUR) % total;
  const sites = Array.from(
    { length: SITES_PAR_JOUR },
    (_, i) => SITES_DEMOSPHERE[(debut + i) % total],
  ).filter((s) => s !== undefined);

  const liens = await liensDemosphereExistants(urlSb, cle);
  const rapports: Record<string, { crees: number; ecartes: number; erreurs: number }> = {};
  for (const site of sites) {
    if (site === undefined) continue;
    const r = await importerSiteDemosphere(site, urlSb, cle, liens, MAX_PAR_SITE);
    rapports[site.cle] = {
      crees: r.crees.length,
      ecartes: r.ecartes.length,
      erreurs: r.erreurs.length,
    };
  }
  return NextResponse.json({ ok: true, rapports });
}
