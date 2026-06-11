import { importerAgendaMilitant } from '@/lib/import-agenda/importer-agenda-militant';
import { NextResponse } from 'next/server';

/**
 * Endpoint d'import quotidien de L'Agenda Militant Indépendant
 * (revue 2026-06-11, demande Lilou/Ben : « import quotidien c'est super top »).
 *
 * Appelé chaque matin par le petit Worker cron `maintenant-cron-agenda`
 * (voir infra/cron-agenda/). Protégé par le secret `CRON_SECRET` (secret
 * Worker) : sans le bon en-tête Authorization, 401.
 *
 * L'import est borné (8 nouveaux événements maximum par exécution) pour
 * rester sous la limite de sous-requêtes du Worker ; le surplus éventuel
 * est rattrapé aux exécutions suivantes.
 */

export const dynamic = 'force-dynamic';

export async function GET(requete: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const autorisation = requete.headers.get('authorization');
  if (secret === undefined || secret === '' || autorisation !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, message: 'Non autorisé.' }, { status: 401 });
  }

  const rapport = await importerAgendaMilitant(8);
  return NextResponse.json({
    ok: true,
    crees: rapport.crees,
    nbCrees: rapport.crees.length,
    dejaImportes: rapport.ignores,
    ecartes: rapport.ecartes,
    erreurs: rapport.erreurs,
  });
}
