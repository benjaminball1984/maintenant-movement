import { importerFormat } from '@/lib/import-medias/importer-medias';
import type { FormatMedia } from '@/lib/import-medias/sources-medias';
import { NextResponse } from 'next/server';

/**
 * Endpoint d'import QUOTIDIEN de la revue de presse multi-format (demande
 * Ben 2026-06-13) : chaque jour, 9 nouveaux contenus par format
 * (podcasts, vidéos, lives, dessins), une source par contenu, en sautant
 * ce qui est déjà importé et les sources déjà servies dans les 24 h.
 *
 * Appelé par le Worker cron `maintenant-cron-medias` (infra/cron-medias/).
 * Protégé par le secret `CRON_SECRET` : sans le bon en-tête Authorization,
 * 401.
 *
 * Une rotation déterministe (jour de l'année) varie les sources servies
 * d'un jour à l'autre, pour ne pas toujours puiser dans les mêmes têtes
 * de liste.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Nombre de nouveaux contenus visés par format et par jour (Ben). */
const CIBLE_PAR_FORMAT = 9;
const FORMATS: FormatMedia[] = ['podcast', 'video', 'live', 'dessin'];

/** Quantième du jour (1-366), pour faire tourner l'ordre des sources. */
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

  const offset = jourDeLAnnee();
  const rapports: Record<string, { crees: number; echecs: number }> = {};
  for (const format of FORMATS) {
    const r = await importerFormat(format, urlSb, cle, CIBLE_PAR_FORMAT, offset);
    rapports[format] = { crees: r.crees.length, echecs: r.echecs.length };
  }

  return NextResponse.json({ ok: true, rapports });
}
