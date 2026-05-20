# Manifest : Phase 0, Chantier 0.1 — Initialisation du dépôt

**Date de fin** : 2026-05-20
**Branche** : `feature/phase-0-chantier-0.1-initialisation-depot`
**Commit final** : `5bef22c`
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

- [x] **Bootstrap Next.js 14 (App Router) + TypeScript strict** : `package.json`, `tsconfig.json` en mode strict total (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noUncheckedIndexedAccess`, `forceConsistentCasingInFileNames`), `next.config.mjs`, `.gitignore` complet.
- [x] **Tailwind CSS 3.4** : `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css` avec directives Tailwind et focus-visible. Tokens réels au chantier 0.2.
- [x] **Biome** comme lint+format unique : `biome.json` strict (interdiction `any`, `noConsoleLog: warn`, `noNonNullAssertion: error`, `useImportType: error`, `useNodejsImportProtocol: error`, organize imports). Scripts npm : `lint`, `lint:fix`, `format`, `typecheck`.
- [x] **Structure de dossiers complète** conforme `02_STACK.md §4` : `app/{(public),(auth),(membre),(admin),api,design-system}`, `components/{ui,layout,carte,agenda,decider,formulaires,modales,notifications}`, `lib/{supabase,stripe,brevo,livekit,t99cp,turnstile,email,permissions,i18n,utils,vocabulaire}`, `config/`, `types/`, `styles/`, `public/{logo,images,fonts}`, `messages/{fr,en}`, `supabase/migrations/`, `tests/{unit,e2e}/`, `docs/manifests/`. README court ou `.gitkeep` dans chaque dossier.
- [x] **Pattern adapter avec mock par défaut** pour 5 services externes : `lib/email/` (Mock + Brevo stub), `lib/stripe/` (Mock + Stripe stub), `lib/t99cp/` (Mock + Polygon stub), `lib/livekit/` (Mock + Real stub), `lib/turnstile/` (Mock + Cloudflare stub). Switch via variables d'env. Instanciation paresseuse, singleton par process. Tests vérifient que la factory choisit la bonne implémentation.
- [x] **Mock Email** persistant : trace console + écrit chaque envoi en JSON sous `var/emails/` (gitignored). Utile pour tests E2E ultérieurs.
- [x] **Configuration centrale** : `config/site.ts` (métadonnées site), `config/limites.ts` (uploads, pagination, rate-limits, communes, Décider), `config/espaces.ts` (5 espaces avec sous-espaces, data pure depuis `01_ARCHITECTURE.md §2`).
- [x] **Lexique** : `lib/vocabulaire.ts` exporte les termes fixés (Maintenant!, Cosec gé, 99-coin, Décider, Empouvoirement, etc.) depuis `03_VOCABULAIRE.md`. Toute UI affichant ces libellés doit les importer d'ici.
- [x] **`.env.example`** : toutes les variables de `02_STACK.md §3` + les `*_PROVIDER` du pattern adapter, commentées en français, valeurs par défaut `mock`.
- [x] **Vitest** : 7 tests unitaires verts sur les 5 factories (mock par défaut, erreur sur provider invalide, singleton).
- [x] **Playwright** : 3 tests E2E verts (home charge en 200 + titre/sous-titre visibles, navigation vers `/design-system` et retour, aucun lien interne mort).
- [x] **CI GitHub Actions** : `.github/workflows/ci.yml` avec 3 jobs (lint+typecheck, tests unitaires, tests E2E avec build Next + Playwright). Pas de déploiement (cf. « Non livré »).
- [x] **Hook pre-commit Lefthook** : Biome check sur fichiers stagés + tsc en parallèle. Hook commit-msg : validation du format conventionnel `phase N - chantier N.X - description`. Installation automatique via le script `prepare` de `package.json`.
- [x] **Page d'accueil temporaire** (`app/(public)/page.tsx`) : surtitre / titre / sous-titre exacts depuis `01_ARCHITECTURE.md §3`, bandeau « en construction », lien vers `/design-system`. Aucun lien mort.
- [x] **Page placeholder système de design** (`app/design-system/page.tsx`) : annonce le chantier 0.2, lien de retour vers `/`.
- [x] **Métadonnées globales** (`app/layout.tsx`) : titre + template, description, OG, locale `fr_FR`, `lang="fr"` sur `<html>`.
- [x] **Build production** vert (`next build`) : 5 routes statiques pré-rendues, 87 kB de shared JS.
- [x] **`docs/ARCHITECTURE-decisions.md`** créé avec ADR-001 (Next 14.x conservé) et ADR-002 (Biome plutôt qu'ESLint+Prettier).

## Livré partiellement

- (rien)

## Non livré (et pourquoi)

- [ ] **Déploiement Cloudflare Pages** : Lilou/Ben n'a pas encore accès à Cloudflare. La config `next.config.mjs` reste neutre, l'adapter `@cloudflare/next-on-pages` n'est volontairement pas installé pour ne pas verrouiller le runtime trop tôt. Le job CI ne déploie pas. **Action attendue** : ouvrir le compte Cloudflare, créer le projet Pages, fournir les secrets à Claude Code pour brancher le déploiement.
- [ ] **Remote git GitHub** : aucun remote configuré. Le workflow CI est posé en local et s'activera dès le premier push. **Action attendue** : créer le repo GitHub (privé ou public, au choix), `git remote add origin ...`, `git push -u origin master` (et envisager un rename `master` → `main`).
- [ ] **Renommage `master` → `main`** : la branche par défaut s'appelle `master` (init git par défaut sous certaines configs Windows). Les specs et CLAUDE.md visent `main`. **Action recommandée** : `git branch -m master main` avant le premier push GitHub, puis configurer `main` comme branche par défaut côté GitHub.
- [ ] **Connexion Supabase réelle** : aucun client Supabase n'est instancié dans 0.1 (cohérent avec le plan : Supabase arrive au chantier 1.1). Les variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` sont vides dans `.env.example`. **Action attendue avant chantier 1.1** : créer le projet Supabase (région Francfort), récupérer les clés.
- [ ] **Clés Brevo, Stripe, LiveKit, Turnstile, T99CP** : non requises, le pattern adapter route vers les mocks par défaut. **Action attendue** au chantier qui branche chaque service réel.
- [ ] **CSP stricte, headers de sécurité** : prévus au chantier 11.2 (sécurité). Pas dans 0.1.
- [ ] **Sentry** : à brancher plus tard (CLAUDE.md §2 et §6).

## Contenus à arbitrer

- (aucun pour ce chantier : aucun texte éditorial nouveau n'a été inventé. Tous les libellés affichés viennent directement de `01_ARCHITECTURE.md §3` ou sont du microcopy utilitaire autorisé par CLAUDE.md §3.)

## Décisions techniques prises (ADR à archiver)

- **ADR-001** : conservation de la ligne Next.js 14.x malgré des avis `npm audit`. Voir `docs/ARCHITECTURE-decisions.md`.
- **ADR-002** : Biome retenu plutôt qu'ESLint + Prettier. Voir `docs/ARCHITECTURE-decisions.md`.

## Incertitudes techniques résolues avec Lilou/Ben

- **Q1 (remote git)** : pas de remote configuré, on prépare le workflow CI localement. Lilou/Ben branchera au moment voulu.
- **Q2 (Cloudflare Pages)** : préparation côté `next.config.mjs` sans installer l'adapter. Déploiement déclaré « non livré ».
- **Q3 (Supabase)** : variables d'env vides dans `.env.example`. Le chantier 0.1 n'instancie aucun client.
- **Q4 (toolchain)** : Node 20 LTS minimum (l'environnement local tourne Node 25, compatible Next 14).

## Tests

- **Unitaires (Vitest)** : 1 fichier (`tests/unit/services/factories.test.ts`), 7 tests verts. Couvre les 5 factories : mock par défaut quand `*_PROVIDER` est absent, erreur explicite sur provider inconnu, respect du singleton.
- **E2E (Playwright, chromium)** : 2 fichiers, 3 tests verts. `home.spec.ts` (charge home + titre/sous-titre, navigation vers design-system et retour). `crawl.spec.ts` (aucun lien interne mort depuis `/`). Durée totale : 33 s.
- **Lint (Biome)** : 0 erreur sur 46 fichiers.
- **Typecheck (tsc)** : 0 erreur.
- **Build (`next build`)** : OK, 5 routes statiques.
- **Lighthouse** : non mesuré au chantier 0.1 (page d'accueil temporaire minimale). Sera mesuré dès le chantier 2.1 (home définitive).

## Notes pour les chantiers suivants

- **Chantier 0.2** : poser les tokens CSS depuis `04_DESIGN-TOKENS.md` dans `styles/tokens.css` + `app/globals.css`, charger les polices Fraunces / Atkinson Hyperlegible / JetBrains Mono via `next/font/local` dans `public/fonts/`, ajouter les premiers composants UI bas niveau dans `components/ui/` (shadcn/ui), enrichir `tailwind.config.ts` avec `theme.extend.colors/fontFamily/spacing` connectés aux tokens. Compléter la page `/design-system` pour qu'elle expose un échantillon vivant des tokens et composants.
- **Convention `process.env.X` plutôt que `process.env['X']`** : conséquence de la règle Biome `useLiteralKeys`. Cohérent avec `noUncheckedIndexedAccess` (le typage reste `string | undefined` dans les deux cas).
- **Pattern adapter** : chaque service externe ajouté plus tard doit suivre exactement le même squelette (`types.ts` / `MockXxxService.ts` / `XxxRealService.ts` / `index.ts` avec factory `instancierXxxService` + singleton + `resetXxxService` réservé aux tests). C'est ce qui garantit que `npm run dev` tourne en local sans clé d'API.
- **Dette Next.js (ADR-001)** : prévoir un point d'évaluation upgrade Next 15/16 avant le chantier 11.3.
- **`master` vs `main`** : à rebaptiser avant publication sur GitHub. Toutes les branches feature suivantes partiront de `main`.
- **Lefthook** : si un commit doit contourner un hook (situation exceptionnelle, jamais par défaut), c'est `git commit --no-verify`. Le faire impose de signaler explicitement dans le MANIFEST du chantier concerné.
