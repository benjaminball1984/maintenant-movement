/**
 * Worker cron : import horaire des brèves (revue de presse).
 * Appelle l'endpoint protégé du site avec le secret partagé.
 * Déploiement : `npx wrangler deploy` dans ce dossier, puis poser le
 * secret CRON_SECRET (même valeur que sur le Worker du site).
 */
export default {
  async scheduled(_evenement, env, ctx) {
    ctx.waitUntil(
      fetch('https://maintenant-le-mouvement.org/api/cron/import-breves', {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      }).then(async (r) => {
        console.info(`import-breves: HTTP ${r.status} ${await r.text()}`);
      }),
    );
  },
};
