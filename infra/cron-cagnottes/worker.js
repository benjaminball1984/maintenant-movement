/**
 * Worker cron : import quotidien des collectes externes (curation de
 * cagnottes). Appelle l'endpoint protégé du site avec le secret partagé.
 * Déploiement : `npx wrangler deploy` dans ce dossier, puis poser le
 * secret CRON_SECRET (même valeur que sur le Worker du site).
 */
export default {
  async scheduled(_evenement, env, ctx) {
    ctx.waitUntil(
      fetch('https://maintenant-le-mouvement.org/api/cron/import-cagnottes', {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      }).then(async (r) => {
        console.info(`import-cagnottes: HTTP ${r.status} ${await r.text()}`);
      }),
    );
  },
};
