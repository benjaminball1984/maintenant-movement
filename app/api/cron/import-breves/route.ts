import { importerBreveHoraire } from '@/lib/import-breves/importer';
import { tirerSourceHoraire } from '@/lib/import-breves/sources';
import { NextResponse } from 'next/server';

/**
 * Endpoint d'import horaire des brèves (revue de presse, demande Ben
 * 2026-06-12) : chaque heure, UNE nouvelle brève est importée d'une
 * source tirée au sort (80 % liste prioritaire, 20 % sources du Portail
 * des médias indépendants).
 *
 * Appelé par le Worker cron `maintenant-cron-breves`
 * (infra/cron-breves/). Protégé par le secret `CRON_SECRET` : sans le
 * bon en-tête Authorization, 401.
 */

export const dynamic = 'force-dynamic';

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

  const resultat = await importerBreveHoraire(urlSb, cle, tirerSourceHoraire);
  return NextResponse.json(resultat, { status: resultat.ok ? 200 : 200 });
}
