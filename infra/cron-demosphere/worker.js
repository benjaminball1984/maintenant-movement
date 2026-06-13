/**
 * Worker cron : import QUOTIDIEN des mobilisations Demosphère (rattrapage
 * des nouveaux événements à venir, rotation de quelques sites par jour).
 * Appelle l'endpoint protégé du site avec le secret partagé.
 *
 * Déploiement : `npx wrangler deploy` dans ce dossier, puis poser le
 * secret CRON_SECRET (même valeur que les autres Workers).
 */
export default {
  async scheduled(_evenement, env, ctx) {
    ctx.waitUntil(
      fetch('https://maintenant-le-mouvement.org/api/cron/import-demosphere', {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      }).then(async (r) => {
        console.info(`import-demosphere: HTTP ${r.status} ${await r.text()}`);
      }),
    );
  },
};
