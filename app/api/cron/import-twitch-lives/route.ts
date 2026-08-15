import { NextResponse } from 'next/server';

/**
 * Endpoint d'import des directs Twitch — DÉSACTIVÉ (décision Ben 2026-06-15 :
 * suppression de la rubrique « Lives » et arrêt de tout import de direct).
 *
 * On garde la route en no-op (au lieu de la supprimer) pour que le Worker cron
 * `maintenant-cron-twitch`, s'il existe encore, ne reçoive pas de 404 : il
 * obtient une réponse claire « lives désactivés ». Le Worker peut être
 * supprimé côté Cloudflare (cf. infra/cron-twitch). Le code Twitch
 * (`lib/twitch`, `lib/import-twitch`) est conservé dormant, non appelé.
 */

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    desactive: true,
    message: 'Import des lives désactivé (rubrique « Lives » supprimée le 2026-06-15).',
  });
}
