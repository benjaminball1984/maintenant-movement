# Manifest : Phase 1, Chantier 1.1 — Schéma BDD initial

**Date de fin** : 2026-05-20
**Branche** : `feature/phase-1-chantier-1.1-schema-bdd-initial`
**Commit final** : à renseigner après commit
**Durée approximative** : 1 session Claude Code (enchaînée avec 0.1 et 0.2)

---

## Livré et fonctionnel

- [x] **11 migrations SQL** dans `supabase/migrations/` :
  - `001_extensions.sql` : `pgcrypto`.
  - `002_personne.sql` : table cœur liée à `auth.users(id)` (cf. ADR-005), avec tous les champs RGPD (statut `actif`/`pending_deletion`/`anonymise`, `suppression_demandee_le`, `anonymise_le`, `email_verifie`, `totp_secret`, `preferences_visibilite jsonb`, `mode_theme`, `derniere_connexion_le`), CHECK age ≥ 15 ans (RGPD §5G), trigger `updated_at`, RLS activée.
  - `003_commune.sql` : slug unique (URL-safe), géoloc, `statut_creation` (`pre_creee`/`auto_creee`), `createurice_id`.
  - `004_appartenance_commune.sql` : N-N personne/commune + **trigger max 3 actives** + **trigger anti-spam 1 transition/mois** (cf. ADR-006), avec historique préservé (`est_active`, `quittee_le`).
  - `005_federation.sql` : `federation` (type `geographique`/`thematique`/`mixte`) + jointure `appartenance_federation` (commune ↔ fédération).
  - `006_confederation.sql` : `confederation` + jointure `appartenance_confederation` (fédération ↔ confédération).
  - `007_gt_thematique.sql` : `gt_thematique` (agrège des personnes sur un sujet) + `appartenance_gt`.
  - `008_droit_admin.sql` : 6 niveaux (`national`, `admin`, `moderation`, `tresorerie`, `animation`, `dpd`), `scope_commune_id` pour animation, `perimetre_onglet text[]` pour modération filtrée, historique conservé via `retire_le`.
  - `009_journal_admin.sql` : audit log RGPD §5K (admin_id, action, cible, états jsonb, ip, user_agent).
  - `010_helpers.sql` : 6 fonctions `security definer` (`est_admin_national()`, `est_admin_general()`, `est_moderateurice(onglet?)`, `est_animation_commune(uuid)`, `est_membre_commune(uuid)`, `est_dpd()`).
  - `011_rls_policies.sql` : politiques RLS sur toutes les tables (soi-même + admin + lecture publique selon contexte ; pas de DELETE côté RLS sur les tables avec historique).
- [x] **Trois clients Supabase** dans `lib/supabase/` :
  - `server.ts` (Server Components + Server Actions, cookies SSR via `@supabase/ssr`).
  - `client.ts` (browser, singleton).
  - `admin.ts` (service_role, jamais exposé côté client, bypass RLS, singleton, `autoRefreshToken: false`).
  - `env.ts` (getters paresseux qui throw avec message clair pointant `.env.example` si une variable manque).
  - `index.ts` (barrel export).
- [x] **Types TypeScript** dans `types/database.ts` : interface `Database` complète (Tables + Functions), unions de string literals pour les enums textuels (`StatutPersonne`, `ModeTheme`, `StatutCreationCommune`, `TypeFederation`, `NiveauDroitAdmin`), alias pratiques (`Personne`, `Commune`, etc.). Régénération automatique via `supabase gen types typescript --linked` une fois le projet créé.
- [x] **Packages** `@supabase/supabase-js@2.106` + `@supabase/ssr@0.10` installés.
- [x] **Tests unitaires** : `tests/unit/supabase/env.test.ts` (7 tests : variable absente → throw, variable vide → throw, variable définie → valeur retournée). Total **19 tests verts** (5 cn + 7 factories services + 7 supabase env).
- [x] **`supabase/migrations/README.md`** : convention de nommage, application en local, régénération des types.
- [x] **`.gitattributes`** : normalisation `* text=auto eol=lf` pour éviter le cycle Windows CRLF / Biome LF.
- [x] **ADR-005** (lien `personne.id` ↔ `auth.users.id` avec cascade) et **ADR-006** (triggers SQL pour max-3 et anti-spam) ajoutées à `docs/ARCHITECTURE-decisions.md`.

## Livré partiellement

- (rien sur le code applicatif. Les tests d'intégration SQL réels — exécution des migrations sur un Postgres + insertion + vérification des triggers + tests RLS — restent à faire à l'arrivée de l'instance Supabase, cf. « Non livré ».)

## Non livré (et pourquoi)

- [ ] **Instance Supabase distante créée et migrations appliquées** : Lilou/Ben n'a pas encore créé le projet. **Action attendue** : créer le projet sur app.supabase.com (région Francfort), remplir `.env.local` avec les 3 clés, puis :
  ```bash
  npm i -g supabase           # CLI Supabase
  supabase login
  supabase link --project-ref <ref>
  supabase db push            # applique les 11 migrations
  supabase gen types typescript --linked > types/database.ts
  ```
- [ ] **Tests d'intégration SQL** (vérifier que les triggers max-3 et anti-spam refusent bien les 4e/transitions <30j, que les politiques RLS empêchent bien les accès interdits) : faisables avec Supabase CLI local (Docker) ou contre l'instance distante. À ajouter dès que l'instance est disponible. Cible : chantier 1.2 ou chantier dédié de durcissement RLS.
- [ ] **Branchement de l'auth Supabase aux flux applicatifs** : chantier **1.2** (auth 4 portes). 1.1 pose juste le schéma.
- [ ] **Edge Function d'anonymisation 30 jours** (RGPD §5A) : prévue à un chantier dédié (probable phase 9 ou 11) avec déclenchement cron.
- [ ] **Cron de purge `journal_admin` après 3 ans** : idem, à brancher plus tard.

## Contenus à arbitrer

- (aucun. Le seul texte du chantier est dans les `COMMENT ON` SQL et la documentation, tous descriptifs et techniques.)

## Décisions techniques prises (ADR à archiver)

- **ADR-005** : `personne.id` lié à `auth.users.id` via FK avec cascade. Voir `docs/ARCHITECTURE-decisions.md`.
- **ADR-006** : règles métier max-3 et anti-spam appliquées par triggers SQL plutôt que par contraintes ou validation applicative seule. Voir idem.

## Incertitudes techniques résolues avec Lilou/Ben

- **Périmètre du chantier 1.1** : on pose tout ce qui est faisable sans Supabase live (migrations + clients + types + tests des getters env). Tests SQL réels reportés à l'arrivée des clés. Convention de hors-scope par défaut : le pattern adapter du chantier 0.1 (mocks par défaut) ne s'applique pas à Supabase parce que les APIs du SDK sont trop riches pour mocker utilement ; on se contente d'un getter qui throw clair quand les variables manquent.

## Tests

- **Unitaires (Vitest)** : 3 fichiers, **19 tests verts**.
  - `factories.test.ts` (5 services externes mockés) : 7
  - `cn.test.ts` (helper de classes) : 5
  - `supabase/env.test.ts` (getters variables d'env) : 7
- **E2E (Playwright, chromium)** : 3 fichiers, **6 tests verts** (`home.spec.ts`, `design-system.spec.ts`, `crawl.spec.ts`), durée 9.9 s.
- **Lint (Biome)** : 0 erreur sur 68 fichiers.
- **Typecheck (tsc strict)** : 0 erreur.
- **Build (`next build`)** : OK, mêmes routes statiques que 0.2 (la BDD n'ajoute pas de page).
- **Tests SQL natifs** : non exécutés (Supabase non disponible). Les migrations ont été relues à la main pour cohérence ; elles seront exécutées sur l'instance dès qu'elle existera.

## Notes pour les chantiers suivants

- **Convention « tout passe par les helpers `est_*()` dans les politiques RLS »** : les politiques de toutes les futures tables doivent s'appuyer sur ces helpers plutôt que sur des sous-requêtes inline. Améliore la lisibilité et garantit qu'un changement dans la logique de droit ne nécessite pas de toucher 20 politiques.
- **Insertion `personne`** : après `auth.signUp()`, insérer la ligne `personne` correspondante avec `id = user.id`. Pattern à formaliser au chantier 1.2 (Server Action `inscrire()`).
- **Régénération des types** : refaire `supabase gen types typescript --linked > types/database.ts` après chaque migration future. Ajouter un script npm `gen:types` (à faire au moment où l'instance est disponible).
- **Tests RLS** : pattern recommandé Supabase : utiliser `pgTAP` ou un harnais Vitest qui parle au Postgres local avec différents JWT (auth.uid() simulé). À documenter en ADR le jour où on les met en place.
- **Suppression compte (anonymisation 30j)** : la table `personne` a déjà tous les champs nécessaires (`statut`, `suppression_demandee_le`, `anonymise_le`). La fonction SQL `anonymise_personne(uuid)` et le cron quotidien restent à écrire (chantier dédié RGPD plus tard).
- **Pré-créées (chantier 5.2)** : l'import CSV des 2100-2300 communes utilisera `getSupabaseAdmin()` (service_role, bypass RLS) et marquera `statut_creation = 'pre_creee'`. Penser à mettre `createurice_id = null` pour ces lignes.
- **`.gitattributes`** : si quelqu'un édite manuellement avec un éditeur qui colle des CRLF, `git add` les normalisera. Pas de bypass nécessaire.
- **Préalables externes inchangés** : repo GitHub distant, projet Cloudflare Pages, clés Brevo/Stripe/LiveKit/Turnstile/T99CP. Maintenant Supabase devient le prochain palier bloquant pour avancer.
