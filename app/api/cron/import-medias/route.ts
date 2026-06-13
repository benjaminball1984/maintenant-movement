import { importerFormat } from '@/lib/import-medias/importer-medias';
import type { FormatMedia } from '@/lib/import-medias/sources-medias';
import { NextResponse } from 'next/server';

/**
 * Endpoint d'import HORAIRE d'UN contenu multi-format (demande Ben
 * 2026-06-13 : « toutes les heures, soit un dessin, soit un live, soit
 * une vidéo, soit un podcast » pour un flux vivant et équilibré).
 *
 * Le format tourne avec l'heure : podcast, vidéo, live, dessin, podcast…
 * Sur 24 h, chaque format reçoit donc 6 nouveaux contenus. Une source
 * par contenu, en sautant ce qui est déjà importé et les sources déjà
 * servies dans les 24 h. La rotation des SOURCES (par jour) évite de
 * toujours puiser en tête de liste.
 *
 * Appelé chaque heure par le Worker cron `maintenant-cron-medias`
 * (infra/cron-medias/). Protégé par le secret `CRON_SECRET`.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Rotation horaire des formats : l'heure UTC modulo 4 choisit le format.
 * podcast (0,4,8…), vidéo (1,5,9…), live (2,6,10…), dessin (3,7,11…).
 */
const ROTATION_FORMATS: FormatMedia[] = ['podcast', 'video', 'live', 'dessin'];

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

  const heure = new Date().getUTCHours();
  const format = ROTATION_FORMATS[heure % ROTATION_FORMATS.length] as FormatMedia;
  // Un seul contenu de ce format cette heure-ci. La rotation des sources
  // varie d'un jour à l'autre via le quantième.
  const r = await importerFormat(format, urlSb, cle, 1, jourDeLAnnee());
  return NextResponse.json({ ok: true, format, crees: r.crees, echecs: r.echecs });
}
