/**
 * Worker cron : import des directs Twitch (rubrique « Lives »).
 * Appelle l'endpoint protégé du site avec le secret partagé, toutes les
 * 15 minutes (les directs sont éphémères).
 * Déploiement : `npx wrangler deploy --config infra/cron-twitch/wrangler.jsonc`,
 * puis poser le secret CRON_SECRET (même valeur que sur le Worker du site).
 */
export default {
  async scheduled(_evenement, env, ctx) {
    ctx.waitUntil(
      fetch('https://maintenant-le-mouvement.org/api/cron/import-twitch-lives', {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      }).then(async (r) => {
        console.info(`import-twitch-lives: HTTP ${r.status} ${await r.text()}`);
      }),
    );
  },
};
