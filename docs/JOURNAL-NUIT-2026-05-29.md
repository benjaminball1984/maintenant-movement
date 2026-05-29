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
- **Commit V2.5.1** : `7433c27`, +1693 lignes, 11 fichiers.

### 02:10-02:25 — V2.5.2 cadre juridique Collectif Maintenant

- Constat : l'espace profil et les pages légales existaient déjà (28 fichiers profil, 2 pages CMS éditables). Phase A-bis presque entièrement faite. Le seul vrai blocage était le cadre juridique précis.
- **`app/(public)/mentions-legales/page.tsx`** : fallback réécrit pour intégrer Collectif Maintenant comme éditeur (association de fait), Ben mandaté, hébergement précis, propriété intellectuelle, accessibilité RGAA, médiation.
- **`app/(public)/confidentialite/page.tsx`** : fallback réécrit en politique RGPD complète. Responsable de traitement = Collectif Maintenant. Sections : DPD (placeholder), principes, données par niveau d'engagement, durées de conservation, droits RGPD complets, CNIL, cookies.
- Placeholders éditables CMS conservés pour ce que seul·e Lilou/Ben peut fournir.
- **Commit V2.5.2** : `c6b62a1`, +154/-31 lignes.
- Point reporté : tension Master Plan ↔ V2.1.1 sur le wallet T99CP (Master Plan dit « affichage en lecture seule », V2.1.1 a retiré l'onglet). À trancher au matin.

### 02:30-02:40 — V2.5.3 wordmark dégradé footer

- Audit : 49/81 fichiers Button utilisent déjà le dégradé `bg-grad` ou `variant="primary"`. L'identité visuelle est déjà en place dans le code.
- **`components/layout/Footer.tsx`** : le mot « Maintenant! » du footer passe en `bg-grad bg-clip-text text-transparent` (gradient text). Ajout d'un commentaire structuré indiquant où coller le futur logo officiel (poing levé + coquelicot) quand Lilou/Ben le fournira.
- Pas d'invention de logo (règle de non-invention §3). Wordmark gradient = solution temporaire honnête.
- **Commit V2.5.3** : `bd1a188`, +54 lignes.

### 02:45-02:55 — V2.5.4 image de couverture commune + fédération

- Audit : la plupart des pages d'espaces collectifs sont déjà riches (FilDeGroupe, BoutonAdminEditer, CMS). 2 manques détectés :
  - **Page commune** : commentaire affirmait à tort que `image_url` n'existait pas. Or la colonne existe (migration `20260520120003`).
  - **Page fédération** : `image_url: null` codé en dur dans `metadataPourPartage`, aucun affichage.
- **`app/(public)/agir/communes/[slug]/page.tsx`** : affichage de l'image en 16/9 ajouté, metadata Open Graph corrigée.
- **`app/(public)/agir/federations/[slug]/page.tsx`** : idem.
- Les 5 types d'espaces collectifs (campagne, commune, fédération, GT, groupe entraide) affichent maintenant tous une image de couverture dans le même format.
- **Commit V2.5.4** : `83b5283`, +83 lignes.
- Non livré (volontairement reporté) : boîte à outils universelle (`module_espace` polymorphe), colonne `logo_url` distincte.

### 03:00-03:35 — V2.5.5 blocs personnalisables newsletter (Phase D)

- **Migration `bloc_espace`** (`20260530000000_bloc_espace.sql`) : table polymorphe `(espace_type, espace_id)` avec CHECK liste fermée (6 types d'espaces, 4 types de blocs), trigger updated_at, RLS lecture publique.
- **`lib/blocs-espace/`** : 3 fichiers (types.ts union discriminée, validation.ts avec 4 schémas Zod stricts, requetes.ts avec 4 helpers).
- **`components/blocs/RenduBlocsEspace.tsx`** : Server Component dispatcher selon type. Texte = div, image = figure 16/9, lien = Link, bouton = Link stylé avec `bg-grad` et 3 variantes.
- **Branchement sur la page commune**.
- **Seeding démo enrichi** : `scripts/seed-demo.ts` crée 3 blocs sur chacune des 6 communes démo (texte de bienvenue + lien WhatsApp + bouton réunion visio). 18 blocs au total.
- **14 nouveaux tests** sur `decoderBloc` et `estTypeBloc`. Couvre cas valides, types inconnus, URLs malveillantes (javascript:), longueurs excessives.
- **932 tests verts**.
- **Commit V2.5.5** : `8b52889`, +732 lignes.

### 03:40-03:55 — V2.5.6 tunnel pétition → adhésion + commune (Phase E)

- Constat : la pile petition+adhesion+commune est entièrement codée mais sans CHAÎNAGE. Après signature, l'écran de merci n'offrait qu'un bouton Fermer.
- **`components/modales/ModaleSignaturePetition.tsx`** : l'écran de merci affiche désormais un encart « Aller plus loin avec Maintenant! » avec 2 CTA : « Devenir adhérent·e » (vers `/agir/adherer`, dégradé primary) et « Rejoindre une commune libre » (vers `/agir/communes`, outline).
- 4 nouvelles clés ajoutées à `LibellesSignaturePetition` (éditables CMS).
- Message de merci passe de « Pas de partage à demander : c'est déjà fort » à « Tu vas recevoir un email pour confirmer ».
- **Commit V2.5.6** : `5e09a66`, +92 lignes.
- Non livré : page de confirmation post-signature avec formulaire d'adhésion pré-rempli, page « gens près de chez moi », enrichissement email confirmation.

### 04:00-04:25 — V2.5.7 moteur d'invitation virale (Phase F)

- **`lib/partage/liens.ts`** : 6 helpers purs (WhatsApp, Telegram, Messenger, Signal, Email, Mastodon) qui fabriquent les URLs de partage avec encodage propre.
- **`components/partage/BoutonsPartage.tsx`** : Server Component grille de 6 boutons (border + emoji + libellé), target=_blank rel=noopener.
- **Branchement sur la page détail pétition**.
- **9 tests unitaires** sur les fabricants d'URLs (origine, encodage accents, paramètres attendus, caractères dangereux & < > ").
- **941 tests verts**.
- Décisions : 6 services pas plus (pas Twitter/X ni Facebook). Emojis pour les icônes (pas d'iconographie inventée). Helpers purs séparés du composant.
- **Commit V2.5.7** : `6ed8be0`, +319 lignes.

### 04:30-04:45 — V2.5.8 extension partage mobilisations + cagnottes (Phase G partielle)

- Décision d'arbitrage : la Phase G (UI bouton « intégrer à une campagne ») mérite un vrai chantier dédié. La mécanique est déjà entièrement codée (Server Action `attacherModule`, table `module_campagne`, helper `listerCampagnesPubliees`). Plutôt que de bâcler l'UI à 4h30 du matin, je documente précisément l'état Phase G et j'utilise le temps disponible pour étendre le moteur de partage V2.5.7.
- **`<BoutonsPartage>` branché sur la page détail mobilisation** : message pré-rempli inclut date et lieu. Titre « Ramener des proches » (lien tunnel 6.6).
- **`<BoutonsPartage>` branché sur la page détail cagnotte** : titre « Faire connaître cette cagnotte ». Intro insiste sur l'objectif financier.
- **Commit V2.5.8** : `3bfc438`, +83 lignes.

### 04:50 — Bilan de fin de nuit

**9 commits livrés cette nuit** :
1. `3b2826a` V2.5.0 — Master Plan adopté, 8 directives intégrées au CLAUDE.md
2. `7433c27` V2.5.1 — Phase A : données de démonstration (6 profils Auth + 56 lignes métier + 18 blocs + objet_demo polymorphe)
3. `c6b62a1` V2.5.2 — Phase A-bis : cadre juridique Collectif Maintenant dans les pages légales
4. `bd1a188` V2.5.3 — Phase B : wordmark dégradé dans le footer + emplacement logo
5. `83b5283` V2.5.4 — Phase C : image de couverture sur communes et fédérations
6. `8b52889` V2.5.5 — Phase D : système de blocs personnalisables newsletter (migration + helpers + composant + seeding démo)
7. `5e09a66` V2.5.6 — Phase E : début du tunnel pétition → adhésion + commune (CTA dans la modale de merci)
8. `6ed8be0` V2.5.7 — Phase F : moteur d'invitation virale (6 services de partage)
9. `3bfc438` V2.5.8 — Extension du moteur de partage à mobilisations + cagnottes + documentation Phase G

**941 tests verts** (912 au départ + 29 nouveaux cette nuit). **Typecheck** vert. **Lint** propre.

**Distant Francfort INTOUCHÉ** : pas une seule écriture vers Supabase production. Tout le travail s'est fait contre Supabase local (Docker, ports 54321-54324). Les 17 746 signatures, 15 737 profils, 35 011 communes restent intactes.

**Migrations posées localement à pousser au matin (en plus de celles déjà en attente)** :
- `20260529000000_objet_demo.sql` (Phase A)
- `20260530000000_bloc_espace.sql` (Phase D)

**Espaces NON traités cette nuit (reportés)** :
- Phase G complète (UI bouton « intégrer à une campagne ») — V2.5.8.a
- Phase H (double visage réseau social / espace d'action) — gros chantier
- Phase I (embellir 6 espaces type plateforme : marché, transport, hébergement, fruits de la terre, SEL, prêt) — gros chantier
- Phase J (réseau social plus chaleureux) — gros chantier de design
- Phase K (CMS amélioré, 1200+ clés) — gros chantier de console
- Phase L (emails soignés par défaut) — gros chantier templates
- Phase M et N (mise en ligne + câblage payant) — réservées à Lilou/Ben par doctrine

### 05:00 — Vérifications finales et clôture

- Lancement d'une dernière passe de tests, typecheck et lint pour confirmer.
- Mise à jour du bilan synthétique pour le réveil.
