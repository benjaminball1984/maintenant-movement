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
 * Sécurité (cf. `docs/securite.md` §2) : headers globaux dont une
 * Content-Security-Policy nominative (chantier V2.0.2). La CSP couvre les
 * origines réelles tirées du code, pas de wildcards permissifs. Chaque
 * directive est commentée pour qu'un·e contributeur·ice sache pourquoi
 * elle existe et puisse la durcir au fil des chantiers.
 *
 * Compromis assumés à la date du chantier V2.0.2 (à durcir ultérieurement) :
 *
 * 1. `'unsafe-inline'` reste autorisé sur `script-src` et `style-src`.
 *    - Next.js 14 App Router émet des scripts inline pour le streaming SSR
 *      et l'hydratation. Le passage à des nonces côté serveur est possible
 *      mais demande une intégration spécifique (header `x-nonce`, lecture
 *      dans `<Script />`, Edge Middleware). À traiter dans un chantier
 *      dédié quand Sentry / un reporter CSP sera branché pour valider.
 *    - Tailwind injecte aussi des styles inline (variables CSS critiques).
 *
 * 2. Pas de `report-to` / `report-uri` configuré.
 *    - Tant qu'aucun receiver n'est branché (Sentry est dans la stack
 *      cible, cf. CLAUDE.md §6, mais pas encore configuré), on n'aurait
 *      personne pour lire les rapports de violation. À brancher quand
 *      Sentry sera là.
 *
 * 3. Pas de `Cross-Origin-Opener-Policy` ni `Cross-Origin-Embedder-Policy`.
 *    - Risquerait de casser l'iframe Stripe Checkout et Turnstile sans
 *      gain immédiat (pas d'usage de `SharedArrayBuffer` ni équivalent).
 */

/**
 * En développement, Next.js utilise `eval()` pour le hot-reload
 * (react-refresh-utils) et Webpack HMR. On relâche donc `script-src`
 * avec `'unsafe-eval'` UNIQUEMENT en dev. En production, cette directive
 * reste interdite.
 *
 * `upgrade-insecure-requests` est ajouté en production seulement : en
 * dev, on tape `http://localhost`, et la directive forcerait une bascule
 * HTTPS qui casserait le `next dev`.
 */
const enDeveloppement = process.env.NODE_ENV !== 'production';

/**
 * Origines réellement utilisées côté navigateur (inventoriées au chantier
 * V2.0.2 à partir du code). À garder synchronisé avec les services
 * externes effectivement branchés.
 */
const ORIGINES = {
  supabaseHttps: 'https://*.supabase.co',
  supabaseWss: 'wss://*.supabase.co',
  stripeJs: 'https://js.stripe.com',
  stripeApi: 'https://api.stripe.com',
  stripeHooks: 'https://hooks.stripe.com',
  turnstileChallenges: 'https://challenges.cloudflare.com',
  liveKitHttps: 'https://*.livekit.cloud',
  liveKitWss: 'wss://*.livekit.cloud',
  tilesOsm: 'https://*.tile.openstreetmap.org',
  // La carte unifiée (CarteUnifiee) charge ses tuiles sur le domaine NU
  // tile.openstreetmap.org (forme recommandée par OSM depuis la dépréciation
  // des sous-domaines a/b/c). Le joker `*.tile.openstreetmap.org` exige au
  // moins un sous-domaine et ne couvre PAS le domaine nu : sans cette entrée,
  // le fond de carte reste blanc en prod (vu le 2026-06-12).
  tilesOsmNu: 'https://tile.openstreetmap.org',
  // Fonds de carte raster CARTO (CarteCommunesReference) : MapLibre les
  // télécharge via fetch(), donc connect-src ET img-src (defense in depth).
  tilesCarto: 'https://*.basemaps.cartocdn.com',
  // Glyphs de police MapLibre (étiquettes des clusters de communes),
  // récupérés en fetch() également.
  glyphsMaplibre: 'https://demotiles.maplibre.org',
  // Lecteur YouTube sans cookie pour la revue de presse vidéo/lives
  // (embeds intégrés dans Maintenant Médias, demande Ben 2026-06-13).
  youtubeNoCookie: 'https://www.youtube-nocookie.com',
  // Miniatures des vidéos YouTube (servies en repli si la copie bucket
  // échoue) et pochettes de podcasts hébergées chez les diffuseurs.
  youtubeImg: 'https://i.ytimg.com',
};

/**
 * Construction de la directive `script-src`.
 *
 * - `'self'` : nos propres scripts hébergés sur le domaine du site.
 * - `'unsafe-inline'` : nécessaire pour Next.js (streaming SSR, hydratation
 *   React) et l'injection de variables CSS Tailwind. À remplacer par des
 *   nonces dans un chantier ultérieur.
 * - `'unsafe-eval'` : autorisé UNIQUEMENT en dev pour Webpack HMR + React
 *   Refresh.
 * - `challenges.cloudflare.com` : SDK Turnstile (anti-bot, tous formulaires
 *   publics).
 * - `js.stripe.com` : Stripe.js (Checkout et Elements).
 */
const scriptSrc = enDeveloppement
  ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${ORIGINES.turnstileChallenges} ${ORIGINES.stripeJs}`
  : `script-src 'self' 'unsafe-inline' ${ORIGINES.turnstileChallenges} ${ORIGINES.stripeJs}`;

/**
 * Liste des directives CSP, dans un ordre stable pour les diffs.
 *
 * Note : `frame-ancestors 'none'` rend `X-Frame-Options: DENY` redondant
 * pour les navigateurs modernes. On garde les deux pour les anciens
 * navigateurs (defense in depth).
 */
const directivesCsp = [
  // Fallback : refuse tout ce qui n'est pas explicitement autorisé ailleurs.
  "default-src 'self'",

  scriptSrc,

  // Tailwind et React injectent des styles inline. Externalisation impossible
  // sans réécrire la chaîne CSS. Acceptable car pas de surface XSS via styles
  // dans notre architecture.
  "style-src 'self' 'unsafe-inline'",

  // Images : assets locaux, data URLs (inline base64 utilisés par MapLibre,
  // certains avatars), blob URLs (upload preview), tuiles OSM, médias hébergés
  // sur Supabase Storage.
  `img-src 'self' data: blob: ${ORIGINES.tilesOsm} ${ORIGINES.tilesOsmNu} ${ORIGINES.tilesCarto} ${ORIGINES.supabaseHttps} ${ORIGINES.youtubeImg}`,

  // Vocaux et fichiers audio du réseau social (~10 min max, hébergés sur
  // Supabase Storage). Vidéo non hébergée (voir reseau-social-V2.md §3).
  `media-src 'self' data: blob: ${ORIGINES.supabaseHttps}`,

  // MapLibre crée des Web Workers à partir d'URL blob: pour le rendu vectoriel
  // côté client. Sans `worker-src`, MapLibre tomberait sur `script-src` qui
  // n'autorise pas `blob:`.
  "worker-src 'self' blob:",

  // Manifest PWA (icônes, scope). Pas encore exploité mais directive bénigne.
  "manifest-src 'self'",

  // Connexions XHR / fetch / WebSocket / EventSource :
  // - Supabase pour la BDD (REST + Realtime WSS) et le Storage.
  // - Stripe pour la création de PaymentIntents et la confirmation.
  // - Turnstile pour la vérification de challenge.
  // - LiveKit pour le signaling visio (HTTPS) + WebRTC (WSS).
  // - Tuiles de carte (OSM + CARTO) et glyphs MapLibre : MapLibre GL les
  //   télécharge en fetch() (AJAX), pas en <img>, d'où leur présence ici.
  //   Sans ça, toutes les cartes du site restent blanches (vu en prod le
  //   2026-06-11 : violations connect-src sur cartocdn et demotiles).
  `connect-src 'self' ${ORIGINES.supabaseHttps} ${ORIGINES.supabaseWss} ${ORIGINES.liveKitHttps} ${ORIGINES.liveKitWss} ${ORIGINES.stripeApi} ${ORIGINES.turnstileChallenges} ${ORIGINES.tilesOsm} ${ORIGINES.tilesOsmNu} ${ORIGINES.tilesCarto} ${ORIGINES.glyphsMaplibre}`,

  // Iframes que nous chargeons :
  // - Turnstile (widget de challenge).
  // - Stripe (Checkout, Elements, 3DS hosted fields).
  // - YouTube sans cookie (embeds vidéo/lives de la revue de presse).
  `frame-src ${ORIGINES.turnstileChallenges} ${ORIGINES.stripeJs} ${ORIGINES.stripeHooks} ${ORIGINES.youtubeNoCookie}`,

  // Fonts : auto-hébergées ; data: pour fonts inline éventuelles.
  "font-src 'self' data:",

  // Pas de plugin Flash / Java / etc. Sécurité défensive.
  "object-src 'none'",

  // Empêche l'injection d'un `<base href>` qui détournerait les chemins relatifs.
  "base-uri 'self'",

  // Tous les formulaires (Server Actions, login Supabase) restent sur le même
  // domaine.
  "form-action 'self'",

  // Personne ne peut intégrer notre site en iframe. Garde-fou contre le
  // clickjacking.
  "frame-ancestors 'none'",

  // Force HTTPS en prod pour toutes les sous-ressources (images, scripts…).
  // Désactivé en dev (`http://localhost`).
  ...(enDeveloppement ? [] : ['upgrade-insecure-requests']),
].join('; ');

/**
 * En-têtes de sécurité supplémentaires.
 *
 * `Strict-Transport-Security` n'est posé qu'en production : en dev local sur
 * `http://localhost`, le navigateur ignore l'en-tête, mais on évite de
 * fixer un HSTS pour `localhost` côté tests automatisés. `max-age` de
 * 2 ans (63072000s) + `includeSubDomains` + `preload` = bonne pratique pour
 * une mise en liste preload une fois la prod stable.
 */
const headersSecuriteAdditionnels = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=(self), payment=(self)',
  },
  ...(enDeveloppement
    ? []
    : [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]),
];

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
          ...headersSecuriteAdditionnels,
        ],
      },
    ];
  },
};

export default nextConfig;
