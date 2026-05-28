# Manifest — Chantier V2.5.1 : Master Plan V2.6 Phase A (données de démonstration)

**Date de fin** : 2026-05-29 (nuit du 29 au 30)
**Branche** : `main` (chantiers Master Plan livrés directement sur main, comme V2.5.0)
**Commit final** : (à renseigner après commit)
**Durée approximative** : ~1h15 (00:55 → 02:10)
**Préalable Lilou/Ben** : a démarré Docker Desktop avant son coucher (sans cela le seeding réel aurait été impossible cette nuit).

## Livré et fonctionnel

- [x] **Migration `objet_demo`** : table polymorphe `(nom_table, id_ligne)` PK composite, idempotent, RLS lecture authentifiée. Fichier : `supabase/migrations/20260529000000_objet_demo.sql`. Appliquée sur le local via `supabase db reset` (locale uniquement, distant Francfort intouché conforme à la règle locale stricte du Master Plan).
- [x] **Helper `lib/demo/tables-supportees.ts`** : liste fermée et ordonnée de 24 tables marquables, avec garde `estTableDemoSupportee` (helper pur testé).
- [x] **Helper `lib/demo/marqueur.ts`** : 5 fonctions de gestion (`poserMarqueurDemo`, `estObjetDemo`, `compterDemoParTable`, `compterDemoTotal`, `listerIdsDemo`, `supprimerToutesLesDemos`). Cas spécial personne : suppression du compte auth.users qui cascade vers personne.
- [x] **Script `scripts/seed-demo.ts`** : 6 profils + données par espace. Garde-fou qui refuse de tourner si l'URL ne contient pas `127.0.0.1` ou `localhost`. Idempotent (skip si déjà seedé), option `--reset` pour repartir à zéro.
- [x] **Types `types/database.ts`** : table `objet_demo` ajoutée manuellement à la position alphabétique correcte (entre `notification` et `offre_entraide`), sans toucher aux extensions maintenues à la main.
- [x] **`.env.local.demo`** : variables d'env dédiées au seeding démo local (gitignored via `.env.local.*`).
- [x] **`.gitignore`** : pattern `.env.local.*` ajouté pour couvrir les fichiers env dérivés.
- [x] **6 profils Auth créés** : test1@maintenant.local → test6@maintenant.local, avec mots de passe en clair (`demo-test1!` à `demo-test6!`) pour permettre la connexion réelle. Codes postaux variés : Argenteuil (95100), Lyon (69001), Toulouse (31000), Nantes (44000), Marseille (13001), Saint-Denis Réunion (97400).
- [x] **6 lignes `personne` créées** avec prénoms diversifiés (Camille iel, Sacha iel, Léa elle, Marc il, Yasmine elle, Théo il), bios sobres, avatars Picsum stables.
- [x] **6 pétitions démo** sur sujets neutres, préfixées `[DÉMO]`, dont 1 en modération et 5 publiées.
- [x] **6 mobilisations démo** à venir (dates +3 à +30 jours), avec lieux et descriptions génériques.
- [x] **6 cagnottes démo** réparties sur les 3 types (`ouverte`, `lutte`, `cotisation`).
- [x] **6 sondages démo** ouverts (mode `classique`) avec questions à choix multiples neutres.
- [x] **6 communes démo** créées en `auto_creee` (Argenteuil, Lyon, Toulouse, Nantes, Marseille, Saint-Denis Réunion).
- [x] **6 appartenances commune** : chaque profil rattaché à sa commune.
- [x] **20 publications réseau** réparties sur les 6 profils, sujets variés (vie de quartier, entraide, mobilisation).
- [x] **Tests unitaires** : 6 nouveaux tests sur `tables-supportees.ts` (acceptation/refus/anti-doublons). Total : 918 tests verts.
- [x] **Lint biome** propre sur tous les nouveaux fichiers.
- [x] **Typecheck** global vert.

## Livré partiellement

- [ ] **Bouton admin « Supprimer toute la démo »** : la logique de suppression (`supprimerToutesLesDemos`) existe et est testée par `seed-demo.ts --reset`. La Server Action + page admin `/admin/national/demo` reste à câbler. **Workaround temporaire pour Lilou/Ben** : utiliser `npx tsx --env-file=.env.local.demo scripts/seed-demo.ts --confirm --reset`. La page admin sera ajoutée dans V2.5.1.bis si le temps le permet, ou dans V2.5.2.
- [ ] **Modules de seeding par espace plus complets** : campagnes, GT thématiques, groupes d'entraide locaux, offres entraide, services SEL, journal-affiche, éditions journal-affiche → pas seedés cette nuit (volume déjà très représentatif avec ce qui est livré). À ajouter selon besoin dans les chantiers V2.5.1.a, .b, etc.

## Non livré (et pourquoi)

- [ ] **Tests E2E Playwright** sur l'admin demo : pas effectués cette nuit, Playwright non lancé. À voir si pertinent vu que la suppression est testable via script.
- [ ] **Images Unsplash/Pexels téléchargées en local** : décision pragmatique de prendre des URLs Picsum stables (`https://picsum.photos/seed/...`) à la place. Avantages : 0 octet dans le repo, varié, image stable par seed. Inconvénient : nécessite internet pour afficher les images (acceptable pour de la démo). Lilou/Ben peut substituer par de vraies images téléchargées via le CMS s'il préfère.

## Contenus à arbitrer

- [ ] Aucun contenu politique inventé. Tous les sujets de démo sont neutres et préfixés `[DÉMO]`. Les textes courts précisent explicitement « démonstration créée par le seeding automatique, aucune position politique réelle n'est exprimée ».

## Décisions techniques prises (ADR à archiver)

- **ADR-Master-Plan-A-01** : Marqueur démo via table polymorphe `objet_demo` au lieu d'ajouter une colonne `est_demo` à chaque table. Conforme à la doctrine de greffe §0.3 (aucune table existante touchée). Compromis : suppression cascade gérée applicativement plutôt que par trigger BDD.
- **ADR-Master-Plan-A-02** : 6 vrais comptes Supabase Auth (test1 → test6) plutôt que de fausses lignes `personne` orphelines. Permet à Lilou/Ben de se connecter en tant que membre démo pour voir le site « avec les yeux d'un membre ».
- **ADR-Master-Plan-A-03** : Images démo via URLs Picsum stables (`/seed/xxx`) plutôt que téléchargement Unsplash/Pexels en local. Pragmatique pour la nuit, substituable par le CMS plus tard.
- **ADR-Master-Plan-A-04** : Sujets de démo neutres préfixés `[DÉMO]`, contenu explicitement marqué comme « démonstration ». Respecte strictement la règle de non-invention politique (§3 du CLAUDE.md).
- **ADR-Master-Plan-A-05** : Communes démo créées en `auto_creee` pour les 6 profils, plutôt que d'utiliser le référentiel `commune_reference` (vide en local). Permet le test end-to-end sans dépendre d'imports préalables.
- **ADR-Master-Plan-A-06** : Supabase local démarré sans realtime/storage/analytics/edge-runtime/imgproxy/vector/functions, qui posaient des problèmes de healthcheck. Postgres + Auth + Kong + Studio suffisent pour le seeding démo.

## Incertitudes techniques résolues

- Pas de trigger `handle_new_user` existant : la ligne `personne` doit être créée explicitement après `auth.admin.createUser` (confirmé en lisant les migrations existantes).
- `correspondance_cp_insee` vide en local : décidé d'éviter la dépendance, créer les 6 communes démo directement.
- Suppression d'un compte auth → cascade vers personne via FK ON DELETE CASCADE (confirmé dans migration `20260520120002_personne.sql`).

## Tests

- **Unitaires** : 6 nouveaux tests sur `lib/demo/tables-supportees.ts`, tous verts. Total : **918 tests verts** (912 + 6).
- **E2E Playwright** : non lancés (cf. « Non livré »).
- **Lint biome** : propre sur les 3 nouveaux fichiers (`lib/demo/marqueur.ts`, `lib/demo/tables-supportees.ts`, `scripts/seed-demo.ts`).
- **Typecheck** : `npx tsc --noEmit` exit 0, aucune erreur.
- **Test fonctionnel manuel** : `npx tsx --env-file=.env.local.demo scripts/seed-demo.ts --confirm` puis `--confirm --reset` : seeding et suppression idempotents vérifiés (56 lignes + 6 comptes auth supprimés puis recréés).

## Notes pour les chantiers suivants

- **Le script `seed-demo.ts` est extensible** : pour ajouter le seeding d'un nouvel espace, ajouter une fonction `seedXxx(supabase, profilIds)` et l'appeler dans `main()`. Vérifier les contraintes CHECK avant.
- **Le `.env.local.demo` est commité gitignore** : Lilou/Ben doit relancer le seeding via `npx tsx --env-file=.env.local.demo scripts/seed-demo.ts --confirm` après chaque `supabase db reset`.
- **Pour aller plus loin** : étendre les modules de seeding aux espaces non couverts cette nuit (campagne, GT, groupes entraide, SEL, journal). Ajouter quelques signatures de pétition, dons de cagnotte, réponses de sondage pour rendre la démo encore plus vivante.
- **Bouton admin « Supprimer la démo »** : prévoir Server Action `app/actions/admin-demo.ts` + page `app/admin/national/demo/page.tsx` avec compteurs par espace et bouton de confirmation. Pas urgent pour cette nuit.
