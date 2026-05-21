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
 *
 * Sécurité : headers globaux dont une Content-Security-Policy de base
 * (cf. `docs/securite.md`). La CSP est volontairement permissive sur
 * `'unsafe-inline'` pour les styles (Tailwind injecte des styles
 * critiques inline) ; côté scripts on autorise Cloudflare Turnstile et
 * Stripe.js qui sont chargés depuis leurs origines officielles.
 */

const directivesCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' challenges.cloudflare.com js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.livekit.cloud wss://*.livekit.cloud https://api.stripe.com https://challenges.cloudflare.com",
  'frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com',
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: directivesCsp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=(self), payment=(self)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
