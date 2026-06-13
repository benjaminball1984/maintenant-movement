import { importerBreveHoraire } from '@/lib/import-breves/importer';
import { tirerSourceHoraire } from '@/lib/import-breves/sources';
import { NextResponse } from 'next/server';

/**
 * Endpoint d'import horaire des brèves (revue de presse). Chaque heure,
 * DEUX nouvelles brèves sont importées de deux sources tirées au sort
 * (80 % liste prioritaire, 20 % sources du Portail des médias
 * indépendants). Le passage de 1 à 2 brèves/heure (demande Ben
 * 2026-06-13) accompagne l'ajout d'un contenu multi-format par heure
 * (podcast/vidéo/live/dessin, voir `import-medias`) pour un flux vivant
 * et équilibré dans la mosaïque.
 *
 * Appelé par le Worker cron `maintenant-cron-breves`
 * (infra/cron-breves/). Protégé par le secret `CRON_SECRET` : sans le
 * bon en-tête Authorization, 401.
 */

export const dynamic = 'force-dynamic';

/** Nombre de brèves importées à chaque exécution horaire (Ben 2026-06-13). */
const BREVES_PAR_HEURE = 2;

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

  // Deux brèves : la règle « 1 source / 24 h » garantit deux sources
  // distinctes (la première publiée devient récente, donc exclue du
  // second tirage).
  const resultats = [];
  for (let i = 0; i < BREVES_PAR_HEURE; i += 1) {
    resultats.push(await importerBreveHoraire(urlSb, cle, tirerSourceHoraire));
  }
  return NextResponse.json({ ok: true, resultats });
}
