// Configuration de l'adaptateur OpenNext pour Cloudflare.
//
// Config minimale pour le premier déploiement : aucun cache incrémental (ISR)
// persistant n'est branché pour l'instant. La route /api/communes/geojson utilise
// `revalidate = 86_400` ; sans cache R2, le rendu sera recalculé au besoin par le
// worker (acceptable au démarrage). On pourra brancher un cache R2 plus tard via
// `incrementalCache: r2IncrementalCache` quand un bucket R2 sera créé.
import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({});
