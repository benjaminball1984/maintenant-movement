/**
 * Configuration Next.js du site Maintenant!
 *
 * Stratégie de déploiement (cf. CLAUDE.md §6) :
 * - En dev : `next dev` sur localhost, Supabase distant en Francfort.
 * - En prod : Cloudflare Pages via `@cloudflare/next-on-pages` (adapter à
 *   installer le jour où l'accès Cloudflare est disponible).
 *
 * Le mode `output: 'standalone'` est volontairement omis tant que la cible
 * d'hébergement définitive n'est pas branchée : on évite les contraintes
 * runtime edge prématurées.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Server Actions actives par défaut dans Next 14.2+.
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
};

export default nextConfig;
