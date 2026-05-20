# Manifest : Phase 1, Chantier 1.2 — Auth 4 portes

**Date de fin** : 2026-05-20
**Branche** : `feature/phase-1-chantier-1.2-auth-4-portes`
**Commit final** : à renseigner après commit
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

- [x] **Packages installés** : `zod@4`, `react-hook-form@7`, `@hookform/resolvers@5`.
- [x] **Schémas Zod** (`lib/validations/auth.ts`) : `inscriptionSchema`, `connexionMdpSchema`, `magicLinkSchema` + helpers (`codePostalFrancaisSchema`, `motDePasseSchema` 12+ chars avec complexité minimale, `dateNaissanceSchema` ≥ 15 ans, `tokenTurnstileSchema`). Messages d'erreur en français, orientés solution.
- [x] **Pronom obligatoire** à l'inscription (signal politique, cf. spec §9). Champ libre.
- [x] **CGU obligatoire** (case à cocher) liée à la politique de confidentialité.
- [x] **Implémentation réelle `CloudflareTurnstileService.verifier()`** : POST `siteverify` avec FormData + secret. Mock reste par défaut (le site tourne en local sans clé Cloudflare).
- [x] **Implémentation réelle `BrevoEmailService`** : `envoyerTransactionnel`, `inscrireNewsletter`, `desinscrireNewsletter` via API v3 Brevo. Mock reste par défaut.
- [x] **Composant `<CaptchaTurnstile>`** (`components/formulaires/CaptchaTurnstile.tsx`) : Client Component qui charge le script Cloudflare en mode `cloudflare`, retourne un token mock immédiat en mode `mock`. Lit `NEXT_PUBLIC_TURNSTILE_PROVIDER`.
- [x] **Server Actions** (`app/(auth)/actions.ts`) :
  - `inscrire(donneesBrutes)` : Zod + Turnstile + `supabase.auth.signUp` + insertion `personne` (cf. ADR-005 du 1.1).
  - `connecterAvecMotDePasse(donneesBrutes)` : Zod + Turnstile + `signInWithPassword` + revalidatePath.
  - `envoyerMagicLink(donneesBrutes)` : Zod + Turnstile + `signInWithOtp`.
  - `ouvrirOAuth(provider)` : `signInWithOAuth` pour GAFAM ; refus explicite pour OAuth éthique (à brancher au chantier dédié).
  - `seDeconnecter()` : `signOut` + revalidatePath + redirect.
  - Toutes retournent `ResultatAction = { ok: true, redirectVers? } | { ok: false, message }`.
  - Helper `traduireErreurAuth()` qui transforme les erreurs Supabase brutes en messages utilisateur·ice clairs (« Email ou mot de passe incorrect », « Un compte existe déjà avec cet email », « Trop de tentatives »).
- [x] **Middleware Next** (`middleware.ts` à la racine) : refresh de session Supabase via `@supabase/ssr` à chaque request hors assets. Bypass complet si `NEXT_PUBLIC_SUPABASE_URL` absent (permet le dev local sans clés Supabase). Matcher qui exclut `_next/static`, `_next/image`, favicons, fichiers avec extension.
- [x] **Handler de callback OAuth/magic link** (`app/auth/callback/route.ts`) : `exchangeCodeForSession`, redirection vers `?next=...` ou `/profil/dashboard` par défaut. En cas d'erreur, redirection vers `/connexion?erreur=...` avec message lisible.
- [x] **Layout `(auth)`** (`app/(auth)/layout.tsx`) : header sobre avec retour `/`, main centré max-w-md, footer avec mention RGPD (Supabase Francfort, pas de cookies pub).
- [x] **Page `/inscription`** : formulaire complet (Server Component + Client `FormulaireInscription`). Champs : Prénom, Nom, Pronom, Email, Code postal, Téléphone (optionnel), Date de naissance (15 ans min), Mot de passe, CGU, Turnstile. Validation client live via react-hook-form + zodResolver. État disabled pendant l'envoi.
- [x] **Page `/connexion`** : 4 portes empilées dans 3 `<Card>` :
  - Mot de passe (`FormulaireConnexionMdp`)
  - Lien magique (`FormulaireMagicLink`)
  - OAuth : GAFAM (Google, Apple, Microsoft) cliquables ; éthique (Mastodon, Framasoft, Solid) en disabled avec attribut `title` qui annonce le branchement à venir.
  - Lecture du paramètre `?erreur=` envoyé par le callback en cas d'échec.
- [x] **Page `/verifier-email`** : message « Vérifie ton email » + Alert d'aide + retour `/connexion`.
- [x] **Page d'accueil** mise à jour avec liens vers `/inscription` et `/connexion` (le crawler les inclut désormais).
- [x] **Tests unitaires Zod** (`tests/unit/validations/auth.test.ts`) : **23 tests** couvrent mot de passe (4 cas), code postal (3 cas), date de naissance (4 cas dont 14 ans refusé / 15 ans accepté), inscription complète (7 cas dont CGU obligatoire, pronom obligatoire, téléphone optionnel, normalisation email), connexionMdp (2), magicLink (2).
- [x] **Tests E2E** (`tests/e2e/auth.spec.ts`) : **7 tests** couvrent rendu `/inscription`, validation client (champs vides + âge < 15), navigation vers `/connexion` ; rendu `/connexion` avec les 6 boutons OAuth (3 cliquables + 3 désactivés), navigation vers `/inscription` ; rendu `/verifier-email`.
- [x] **ADR-007** : Supabase Auth gère les mails d'auth (SMTP Brevo), `BrevoEmailService` gère le métier (newsletter, reçus). Voir `docs/ARCHITECTURE-decisions.md`.
- [x] **Variable `NEXT_PUBLIC_TURNSTILE_PROVIDER`** ajoutée à `.env.example` (le composant client en a besoin pour décider mock vs réel).

## Livré partiellement

- (rien sur le code applicatif. Voir « Non livré » pour ce qui dépend de Supabase live.)

## Non livré (et pourquoi)

- [ ] **Flux d'inscription / connexion end-to-end** : nécessite l'instance Supabase live + Brevo SMTP configuré dans le projet Supabase. Sans elles, les Server Actions throw avec un message clair (« Variable d'environnement NEXT_PUBLIC_SUPABASE_URL manquante »). **Action attendue** : créer le projet Supabase Francfort, remplir `.env.local`, `supabase db push` (cf. MANIFEST 1.1).
- [ ] **OAuth GAFAM cliquables réels** : code en place, mais nécessite la configuration des credentials OAuth (Google Cloud Console, Apple Developer, Microsoft Azure) côté projet Supabase (dashboard → Authentication → Providers). **Action attendue** : créer les apps OAuth pour Google (sans urgence : peut attendre une vraie demande), Apple (coût ~99 €/an, à arbitrer), Microsoft. Les boutons fonctionnent et redirigent vers Supabase qui retournera une erreur « provider not enabled » tant que pas configuré.
- [ ] **OAuth éthique (Mastodon, Framasoft, Solid)** : posés en UI désactivée. Branchement à un chantier dédié parce que ces providers ne sont pas natifs Supabase. Trois pistes possibles à arbitrer :
  - **Mastodon** : peut être implémenté via `signInWithOAuth({ provider: 'keycloak', options: { ... } })` si on déploie un Keycloak intermédiaire, OU via un endpoint OAuth custom (Mastodon expose une API OAuth standard).
  - **Framasoft** : utilise probablement Framapiaf (Mastodon-like) ou un OIDC custom.
  - **Solid** : protocole OIDC + WebID, complexe, demande une intégration spécifique.
  
  Recommandation : ouvrir un chantier de phase 11.2 ou plus tard pour ces 3 providers. Pour 1.2, on garde les boutons désactivés avec leur infobulle. **Action attendue de Lilou/Ben** : confirmer cet arbitrage ou prioriser un de ces providers plus tôt.
- [ ] **Page `/confidentialite` (lien dans CGU)** : référée par le label CGU mais la page elle-même arrive au **chantier 2.2** (pages utilitaires). La case à cocher dit « J'accepte la politique de confidentialité » sans lien actif pour éviter un 404. Le footer du layout `(auth)` ne lie pas non plus pour la même raison.
- [ ] **Page `/profil/dashboard`** : destination par défaut après connexion réussie. N'existe pas encore (chantier **1.3**). Quand on se connectera après 1.3, on atterrira dessus. D'ici là, le redirect aboutirait à un 404 qui sera juste signalé en console dev.
- [ ] **2FA TOTP optionnelle / obligatoire admin** (RGPD §5F) : pas dans 1.2, prévue au chantier 1.3 (profil / sécurité).
- [ ] **Rate limiting applicatif sur les Server Actions** : la spec dit 5/min/IP sur les formulaires publics (config/limites.ts). Le seul rate-limit en place pour 1.2 est celui de Supabase Auth. Un middleware de rate-limit applicatif sera ajouté à un chantier ultérieur (probablement 11.2 sécurité).

## Contenus à arbitrer

- [ ] **Page `/inscription` libellé d'accueil** : actuellement « Bienvenue. Quelques minutes pour rejoindre Maintenant!. » C'est de l'aide utilitaire, pas un texte éditorial signé, donc autorisé par CLAUDE.md §3. À réviser au chantier 2.x si Lilou/Ben veut un ton différent.
- [ ] **Templates emails Supabase Auth** (confirmation, magic link, reset) : à personnaliser dans le dashboard Supabase quand l'instance sera créée. Garder un ton sobre, français, avec mention « Maintenant! » et signature collective (sans nom individuel).

## Décisions techniques prises (ADR à archiver)

- **ADR-007** : Supabase Auth gère les mails d'auth via SMTP Brevo ; `BrevoEmailService` reste pour la newsletter et le métier. Voir `docs/ARCHITECTURE-decisions.md`.

## Incertitudes techniques résolues avec Lilou/Ben

- **Choix Zod 4 vs Zod 3** : Zod 4 est installé par défaut (`npm install zod` au mai 2026 prend la dernière major). Compatible avec `@hookform/resolvers@5`. L'API `z.literal(true)` est plus stricte qu'en v3 (refuse `false` dans `defaultValues`), donc on utilise `z.boolean().refine(v => v === true)` pour la case CGU. Documenté en commentaire dans `lib/validations/auth.ts`.

## Tests

- **Unitaires (Vitest)** : 4 fichiers, **42 tests verts** (+23 par rapport à 1.1).
  - `factories.test.ts` (services externes mockés) : 7
  - `cn.test.ts` (helper de classes) : 5
  - `supabase/env.test.ts` (getters env Supabase) : 7
  - `validations/auth.test.ts` (schémas Zod auth) : 23
- **E2E (Playwright, chromium)** : 4 fichiers, **13 tests verts** (+7 par rapport à 1.1) : home (2), design-system (3), crawl (1), auth (7). Durée 40 s.
- **Lint (Biome)** : 0 erreur sur 83 fichiers.
- **Typecheck (tsc strict)** : 0 erreur.
- **Build (`next build`)** : OK. 7 routes : 4 statiques (`/`, `/_not-found`, `/design-system`, `/verifier-email`) + 3 dynamiques (`/auth/callback`, `/connexion`, `/inscription`). Middleware 82.5 kB.

## Notes pour les chantiers suivants

- **Pattern Server Action avec validation Zod + Turnstile + Supabase + résultat typé** : à reproduire pour toutes les futures actions (créer pétition, signer, créer commune, etc.). Le helper `verifierTurnstile()` est privé à `app/(auth)/actions.ts` ; s'il sert ailleurs, l'extraire dans `lib/turnstile/`.
- **Convention `<Card>` pour empiler les méthodes de connexion** : la page `/connexion` montre comment 3 méthodes peuvent cohabiter sans tabs. Pattern réutilisable pour d'autres pages où l'on veut présenter plusieurs options sans en cacher derrière des onglets.
- **`getByLabel` Playwright vs `locator('#id')`** : préférer `locator('#id')` quand un nom est sous-mot d'un autre (« Nom » vs « Prénom » vs « Pronom »). Documenté dans `tests/e2e/auth.spec.ts`.
- **`zodResolver` + react-hook-form** : pattern de référence dans `FormulaireInscription.tsx`. Trois autres formulaires (mdp, magic link, OAuth boutons) suivent la même structure.
- **Middleware avec bypass conditionnel** : le middleware actuel bypass quand `NEXT_PUBLIC_SUPABASE_URL` est absent. Cela permet de continuer à dev sans Supabase. Quand l'instance sera là, le middleware s'active automatiquement. Pas de variable de feature flag dédiée.
- **`ResultatAction` typé** : convention à respecter dans toutes les Server Actions ultérieures. Pas de throw pour les erreurs prévisibles, return `{ ok: false, message }` avec message FR clair. Réserver les throws aux incidents serveur imprévus.
- **Préalables externes inchangés** : projet Supabase Francfort + appliquer les migrations 1.1 + configurer Brevo SMTP dans Supabase pour activer le flux complet. Quand c'est fait, le chantier 1.2 sera intégralement utilisable sans modification de code.
