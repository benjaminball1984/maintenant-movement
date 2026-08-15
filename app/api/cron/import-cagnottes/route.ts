import { importerCagnottesExternes } from '@/lib/import-cagnottes/importer';
import { NextResponse } from 'next/server';

/**
 * Endpoint d'import des collectes externes (curation de cagnottes, demande Ben
 * 2026-06-15). Récolte des candidats (API Ulule pour l'instant), les curent
 * (thèmes + types + exclusions) et les dépose en `statut='propose'` dans la
 * file de modération a priori. Ne publie JAMAIS directement : un·e admin valide.
 *
 * Appelé par le Worker cron `maintenant-cron-cagnottes` (infra/cron-cagnottes/),
 * une fois par jour. Protégé par le secret `CRON_SECRET`.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

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

  const rapport = await importerCagnottesExternes(urlSb, cle);
  return NextResponse.json({ ok: true, ...rapport });
}
