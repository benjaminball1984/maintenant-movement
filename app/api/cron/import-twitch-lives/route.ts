import { importerTwitchLives } from '@/lib/import-twitch/importer-twitch-lives';
import { NextResponse } from 'next/server';

/**
 * Endpoint d'import des directs Twitch (rubrique « Lives », demande Ben
 * 2026-06-14). Interroge l'API Twitch pour savoir qui est EN DIRECT parmi nos
 * chaînes engagées, crée/met à jour les `media type='live'` correspondants et
 * retire ceux dont le live est terminé.
 *
 * Appelé par le Worker cron `maintenant-cron-twitch` (infra/cron-twitch/),
 * toutes les 15 minutes. Protégé par le secret `CRON_SECRET`. Nécessite aussi
 * `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` côté Worker (sinon mock → vide).
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

  const rapport = await importerTwitchLives(urlSb, cle);
  return NextResponse.json({
    ok: true,
    nbEnDirect: rapport.enDirect.length,
    enDirect: rapport.enDirect,
    retires: rapport.retires,
  });
}
