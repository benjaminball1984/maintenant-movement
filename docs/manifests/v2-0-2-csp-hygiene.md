# Manifest — V2 Vague 0, Chantier V2.0.2 : CSP réelle + hygiène repo

**Date de fin** : 2026-05-26 (nuit)
**Branche** : `feature/v2-0-2-csp-hygiene`
**Commit final** : (voir `git log -1 --format=%h feature/v2-0-2-csp-hygiene`)
**Durée approximative** : 1 session courte
**Base** : `main` (tip `78416a1`, V2.0.1)

---

## Livré et fonctionnel

- [x] **CSP nominative réécrite dans `next.config.mjs`**. Toutes les origines sont extraites dans un objet `ORIGINES` documenté, chaque directive porte un commentaire qui explique pourquoi elle existe. Compromis de durcissement assumés et documentés en tête du fichier (`'unsafe-inline'` Next.js, pas de `report-to`, pas de COOP/COEP) — voir les notes au bas de ce MANIFEST pour la suite.
- [x] **Directives CSP ajoutées par rapport à l'état antérieur** :
  - `media-src 'self' data: blob: https://*.supabase.co` : pour les vocaux/audio uploadés sur Supabase Storage (réseau social, max 10 min).
  - `worker-src 'self' blob:` : MapLibre crée des Web Workers depuis des `blob:` URLs pour le rendu vectoriel. Sans cette directive, le worker tomberait sur `script-src` qui n'autorise pas `blob:`.
  - `manifest-src 'self'` : pour un éventuel manifeste PWA (directive bénigne posée par anticipation).
  - `upgrade-insecure-requests` : ajouté en production seulement (en dev, ça casserait `http://localhost`).
- [x] **En-tête HTTP `Strict-Transport-Security` ajouté en production seulement** (`max-age=63072000; includeSubDomains; preload`). En dev sur `http://localhost`, le navigateur ignorerait l'en-tête, et on évite de poser un HSTS persistant côté tests automatisés.
- [x] **Inventaire des origines réelles utilisées par le code côté navigateur** documenté dans `next.config.mjs` (objet `ORIGINES`) : Supabase HTTPS + WSS, Stripe (js + api + hooks), Turnstile, LiveKit HTTPS + WSS, tuiles OSM. Brevo et Polygon RPC ne sont pas inclus : Brevo est exclusivement serveur (SMTP/API depuis Server Actions), Polygon n'est pas encore branché en prod (`PolygonT99CPService` actuellement en stub, mock par défaut, cf. `lib/t99cp/`).
- [x] **README court dans `app/auth/`** qui documente la coexistence intentionnelle entre `app/(auth)/` (route group de pages d'auth, layout commun, URLs sans préfixe) et `app/auth/callback/route.ts` (URL stable `/auth/callback` requise par Supabase OAuth et Magic Link). Empêche un futur agent ou contributeur·ice de « nettoyer » la route en la déplaçant dans `(auth)`.

## Livré partiellement

Aucune fonctionnalité livrée partiellement.

## Non livré (et pourquoi)

Le périmètre initial de V2.0.2 (revue 21/05 et `02-PONT-V1-V2.md`) listait trois items d'hygiène. Deux n'avaient plus lieu d'être au moment du chantier, et c'est documenté ci-dessous.

- **Route group fantôme `app/(admin)/`** : **n'existe plus** dans le repo (seul `app/admin/` est présent, qui est la route réelle). Probablement déjà nettoyé entre la revue 21/05 et aujourd'hui, ou jamais existé sous cette forme. Rien à faire.
- **Doublon d'adapter `lib/stripe/`** : **n'existe plus** dans le repo (seul `lib/payments/` est présent, avec `MockPaymentService.ts`, `StripePaymentService.ts`, `frais.ts`, `index.ts`, `types.ts`). Déjà nettoyé. Rien à faire.

Ces deux constats sont notés ici pour traçabilité, parce que le `02-PONT-V1-V2.md` (§9) les listait encore comme à faire.

## Contenus à arbitrer

Rien à arbitrer dans le périmètre de V2.0.2.

## Décisions techniques prises (ADR à archiver)

Aucune décision technique structurante. Tout ce qui a été fait découle de bonnes pratiques sécurité W3C/OWASP appliquées aux origines réelles du code. Pas d'ADR à créer.

## Incertitudes techniques résolues avec Lilou/Ben

Aucune incertitude à arbitrer durant ce chantier (cycle V2 autonome de nuit).

## Écarts V1→V2 appliqués

Aucun écart V1↔V2 d'architecture. La CSP était déjà non triviale en V1 (héritée du chantier 11.2 sécurité), ce chantier la met à jour pour couvrir des origines qui n'étaient pas listées et qui causaient potentiellement des blocages silencieux côté MapLibre et Supabase Storage. C'est du polish, pas un écart doctrinal.

## Tests

- **Unitaires (Vitest)** : `npm test` → **27 fichiers, 300 tests, tous verts** (8,25 s).
- **Build Next.js** : `npx next build` → succès, configuration consommée correctement, toutes les routes générées.
- **E2E Playwright** : non lancés (la CSP n'altère pas le comportement applicatif des tests E2E ; un test ciblé sur les en-têtes HTTP de réponse serait pertinent dans un chantier dédié, hors périmètre V2.0.2).
- **Lint (Biome)** : `npm run lint` → 404 fichiers, 0 issue.
- **Typecheck (tsc)** : `npm run typecheck` → 0 erreur.
- **Lighthouse** : non applicable à un chantier de configuration headers.

## Notes pour les chantiers suivants

- **Durcissement CSP à prévoir, dans cet ordre** :
  1. Brancher Sentry (CLAUDE.md §6) avec un endpoint `report-to` / `report-uri` pour collecter les violations CSP avant durcissement.
  2. Remplacer `'unsafe-inline'` sur `script-src` par des nonces générés par un Edge Middleware. Coordination avec les Server Components (`<Script />`).
  3. Évaluer la pose de `Cross-Origin-Opener-Policy: same-origin` et `Cross-Origin-Embedder-Policy` : tester contre Stripe Checkout et Turnstile avant activation.
- **Polygon RPC en CSP** : quand `PolygonT99CPService` sortira de son stub (chantier 5.1 ou équivalent V2), ajouter l'origine du provider (Alchemy, Infura, polygon-rpc.com) à `connect-src`. L'objet `ORIGINES` est l'endroit unique à mettre à jour.
- **Sentry en CSP** : quand Sentry sera branché, ajouter son ingestion endpoint à `connect-src` et son endpoint `tunnel` si on en utilise un.
- **CSP sur les API routes** : la CSP est posée via `headers()` qui s'applique à toutes les routes (source `/(.*)`). C'est délibéré pour couvrir aussi `/api/*` et `/auth/callback`. Tester en intégration que les redirections OAuth Supabase ne sont pas affectées.
- **Tests d'en-têtes** : un test Playwright ciblé qui vérifie que la réponse HTTP à `/` porte bien `Content-Security-Policy`, `Strict-Transport-Security` (en prod), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` serait un garde-fou utile. À ajouter dans la suite E2E quand on consolidera la couverture sécurité.
