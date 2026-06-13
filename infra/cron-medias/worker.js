/**
 * Worker cron : import HORAIRE d'un contenu multi-format de la revue de
 * presse (podcast, vidéo, live ou dessin, en rotation selon l'heure).
 * Appelle l'endpoint protégé du site avec le secret partagé.
 *
 * Déploiement : `npx wrangler deploy` dans ce dossier, puis poser le
 * secret CRON_SECRET (même valeur que sur le Worker du site et le Worker
 * des brèves).
 */
export default {
  async scheduled(_evenement, env, ctx) {
    ctx.waitUntil(
      fetch('https://maintenant-le-mouvement.org/api/cron/import-medias', {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      }).then(async (r) => {
        console.info(`import-medias: HTTP ${r.status} ${await r.text()}`);
      }),
    );
  },
};
