import { importerFormat } from '@/lib/import-medias/importer-medias';
import type { FormatMedia } from '@/lib/import-medias/sources-medias';
import { NextResponse } from 'next/server';

/**
 * Endpoint d'import HORAIRE de la revue de presse multi-format (demande
 * Ben 2026-06-13 : « 4 brèves, un podcast, une vidéo, un live et un
 * dessin par heure »). Chaque heure, on importe UN contenu de CHAQUE
 * format (les brèves sont gérées par `import-breves`). Une source par
 * contenu, en sautant ce qui est déjà importé et les sources déjà
 * servies dans les 24 h. La rotation des SOURCES (par jour) évite de
 * toujours puiser en tête de liste.
 *
 * Appelé chaque heure par le Worker cron `maintenant-cron-medias`
 * (infra/cron-medias/). Protégé par le secret `CRON_SECRET`.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Un contenu de chacun de ces formats est importé à chaque heure. */
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

  // Un contenu de chaque format cette heure-ci. Un format temporairement
  // épuisé (ex. lives : 9 sources, parfois toutes servies dans les 24 h)
  // renvoie simplement 0 ; les autres passent quand même.
  const offset = jourDeLAnnee();
  const rapports: Record<string, { crees: number; echecs: number }> = {};
  for (const format of FORMATS) {
    // Quota d'objectif relevé (Ben 2026-06-14) : jusqu'à 2 contenus par
    // format/heure (atteint seulement s'il y a assez de contenus < 2 h).
    const r = await importerFormat(format, urlSb, cle, 2, offset);
    rapports[format] = { crees: r.crees.length, echecs: r.echecs.length };
  }
  return NextResponse.json({ ok: true, rapports });
}
