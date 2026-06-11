/**
 * Worker cron : appelle chaque matin l'endpoint d'import de l'Agenda
 * Militant sur le site (voir app/api/cron/import-agenda/route.ts).
 * Le secret CRON_SECRET doit être identique des deux côtés.
 */
export default {
  async scheduled(_evenement, env, ctx) {
    ctx.waitUntil(
      fetch('https://maintenant-le-mouvement.org/api/cron/import-agenda', {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      }).then(async (r) => {
        // Trace lisible dans les logs du Worker (wrangler tail).
        console.info(`import-agenda: HTTP ${r.status} ${await r.text()}`);
      }),
    );
  },
};
