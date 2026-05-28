# Journal de nuit — 2026-05-29 / 2026-05-30

> Journal chronologique tenu par Claude Code (Opus 4.7) pendant la session autonome ouverte par Lilou/Ben le 2026-05-29 au soir. Sert au contrôle a posteriori (lecture le matin avec le ZIP du code).

**Pilote** : Lilou/Ben (couché·e pour la nuit, contrôle a posteriori).
**Cadre** : Master Plan V2.6 adopté le 29/05 (cf. `docs/MASTER-PLAN-V2.6.md` et CLAUDE.md §0bis + §11).
**Cycle interne** : V2.5 (mapping du cycle externe Master Plan V2.6).
**Périmètre autorisé** : phases A à L du Master Plan. Phases M et N hors scope (distant Francfort + câblage payant, réservés à Lilou/Ben).
**Tip de départ** : `3b2826a` (commit V2.5.0 intégration directives CLAUDE.md).

---

## Plan d'exécution prévisionnel

1. **V2.5.1** — Phase A : données de démonstration (objet_demo + 6 profils + 6 entrées par espace + bouton supprimer démo)
2. **V2.5.2** — Phase A-bis : espace profil + mentions RGPD (Collectif Maintenant)
3. **V2.5.3** — Phase B : réinjection du dégradé identitaire
4. **V2.5.4** — Phase C : gabarit riche pour espaces collectifs
5. **V2.5.5** — Phase D : blocs personnalisables façon newsletter
6. **V2.5.6** — Phase E : tunnel pétition → adhésion → commune
7. **V2.5.7** — Phase F : moteur d'invitation virale
8. **V2.5.8** — Phase G : double relation aux campagnes (UI sur `module_campagne`)
9. **V2.5.9** — Phase H : double visage réseau social / espace d'action
10. **V2.5.10** — Phase I : embellir les espaces type plateforme (marché, transport, hébergement, fruits de la terre, SEL, prêt)
11. **V2.5.11** — Phase J : réseau social plus chaleureux
12. **V2.5.12** — Phase K : améliorer l'interface d'édition CMS
13. **V2.5.13** — Phase L : emails soignés par défaut

---

## Journal chronologique

### 00:55 — Démarrage de la nuit autonome

- Heure de démarrage : 2026-05-29 00:55 (heure locale machine Lilou/Ben).
- Tip git : `3b2826a` (commit V2.5.0).
- Branche : `main`.
- Lilou/Ben se couche et m'autorise à enchaîner Phases A à L.

### 00:56 — État de l'environnement

- **Docker** : installé (v29.4.3) mais **Docker Desktop pas en marche** (pipe Linux Engine introuvable). Donc Supabase local non démarrable cette nuit.
- **Migrations existantes** : 57 fichiers, dernière numérotée `20260527150000_journal_affiche.sql`. Mes nouvelles migrations partiront de `20260529...`.
- **Stack confirmée** : Next.js 14, TypeScript strict, Supabase, Tailwind, Biome, Vitest, Playwright. Node ≥ 20.
- **Adaptation forcée** : pas de test d'intégration BDD cette nuit (Docker éteint). Je travaille en mode :
  - Migrations SQL écrites mais pas appliquées (Lilou/Ben fera `supabase db push` au matin).
  - Helpers TS écrits avec tests unitaires Vitest (qui passent sans BDD).
  - Scripts de seeding écrits mais à lancer par Lilou/Ben (`scripts/seed-demo.ts`).
  - Lint et typecheck obligatoires verts à chaque commit.
- **Pas de `npm run dev`** cette nuit : perd des ressources sans Supabase pour servir les données.
- **Pas de Playwright E2E** : même raison.

### 00:58 — Exploration de l'existant pour ne pas réinventer

Lancement de Globs et Reads parallèles sur : types/database.ts, app/admin/, app/(public)/, scripts/, lib/.

### 01:00-01:30 — V2.5.1 Phase A données démo : Docker + Supabase local

- **Docker démarré par Lilou/Ben** avant son coucher (proposition spontanée, énorme gain).
- **Supabase init** créé `supabase/config.toml` (manquait, projet jamais initialisé en local).
- **Supabase start** : 1ère tentative échoue avec « network supabase_network_Maintenant not found » (réseau Docker orphelin) → `supabase stop` + `docker network prune` puis retry.
- **2ème tentative** : analytics, realtime, storage marquent unhealthy au démarrage et le start s'auto-stop.
- **Contournement** : démarrage avec exclusion des services non essentiels (`-x realtime -x storage -x analytics -x edge-runtime -x imgproxy -x inbucket -x vector -x functions`). Postgres + auth + kong + studio suffisent largement pour le seeding.
- Supabase UP sur les ports 54321 (API), 54322 (DB), 54323 (Studio), 54324 (Mailpit).
- **Clés locales récupérées** dans `.env.local.demo` (gitignored). URL pointe sur `127.0.0.1:54321`.
- **`.gitignore` mis à jour** pour ignorer `.env.local.*` (couvrait juste `.env.local` avant).
- **`npx supabase db reset`** : applique les 58 migrations sur le local (les 57 existantes + ma nouvelle `20260529000000_objet_demo.sql`).

### 01:30-01:55 — V2.5.1 Phase A : helpers + script de seeding

- **`supabase/migrations/20260529000000_objet_demo.sql`** : table polymorphe `(nom_table, id_ligne)` PK composite, idempotent par construction, RLS lecture-authentifiée. Conforme à la doctrine de greffe (§0.3 du CLAUDE.md), aucune table existante touchée.
- **`lib/demo/tables-supportees.ts`** : liste fermée et ordonnée des tables marquables (24 tables, niveau 1 = contenus utilisateur → niveau 4 = personne). Helper pur `estTableDemoSupportee`.
- **`lib/demo/marqueur.ts`** : 5 fonctions (poser, vérifier existence, compter par table, compter total, lister IDs, supprimer toutes). Cas spécial `personne` : `supabase.auth.admin.deleteUser(id)` cascade vers personne via FK (pas de DELETE direct).
- **Régénération types/database.ts** : 1ère tentative `supabase gen types typescript --local` a écrasé les extensions custom (`CommuneEnrichie`, `FederationEnrichie`, etc.) maintenues à la main → 100+ erreurs typecheck. Revert via `git checkout types/database.ts`, puis insertion manuelle de la table `objet_demo` à la bonne position alphabétique. **À retenir** : le CLAUDE.md §11 dit explicitement « types/database.ts maintenu à la main », il faut respecter ça scrupuleusement.
- **`scripts/seed-demo.ts`** : 6 profils + 6 pétitions + 6 mobilisations + 6 cagnottes + 6 sondages + 6 communes + 6 appartenances + 20 posts réseau. Idempotent, avec garde-fou qui refuse de tourner si URL ne contient pas `127.0.0.1`.

### 01:55-02:00 — V2.5.1 corrections en cascade

Plusieurs tâtonnements pour aligner les valeurs aux contraintes CHECK des tables (j'ai dû lire chaque migration source pour les vraies valeurs autorisées) :
- `cagnotte.type` : `ouverte | lutte | cotisation` (pas mes valeurs inventées `solidaire | collective`)
- `sondage.mode` : `classique | pondere` (pas `choix_unique`)
- `sondage.statut` : `ouvert | ferme | archive | retire` (pas `publie`)
- `appartenance_commune` : pas de colonne `role`, contrainte unique DEFERRABLE qui ne supporte pas `ON CONFLICT` → fallback SELECT puis INSERT conditionnel.
- `correspondance_cp_insee` vide en local → fallback : créer 6 communes démo (`auto_creee`) avec les villes des profils.

### 02:00-02:05 — V2.5.1 finalisation

- **Reset complet + re-seed testé** : 56 lignes supprimées + 6 comptes auth, puis 56 lignes recréées. Idempotence parfaite.
- **918 tests verts** (912 existants + 6 nouveaux sur `tables-supportees`).
- **Lint biome propre** sur les 3 nouveaux fichiers.
- **Typecheck vert** global.

