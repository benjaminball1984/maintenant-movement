# Manifest — V2 Vague 1, Chantier V2.1.3 : table `droit` atomique + presets

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-1-3-droit-atomique`
**Commit final** : (voir `git log -1 --format=%h` sur cette branche)
**Durée approximative** : 1 session
**Base** : `main` (tip `c25d78c`, V2.1.2)

---

## Livré et fonctionnel

- [x] **Migration `supabase/migrations/20260527020000_droit.sql`** : crée la table `droit` (id, personne_id FK, cible_type, cible_id, type_droit, accorde_par, accorde_le, retire_par, retire_le, metadata), contraintes CHECK strictes sur `cible_type` (15 valeurs ou NULL pour droit global) et `type_droit` (25 valeurs atomiques exhaustivement listées selon MD1). Cohérence `(cible_type, cible_id)` par CHECK. Index actifs et unique partiel sur le triplet (personne × type × cible) actif. **4 policies RLS dans la même migration** : `select` self + admin général + DPD ; `insert/update/delete` admin général uniquement. **À appliquer manuellement** avec `supabase db push` ou `scripts/appliquer-sql-distant.ts` — non appliquée au distant cette nuit (consigne).
- [x] **`lib/droit-presets.ts`** : table de mapping des presets V2 (5 fonctions de commune : redacteurice, moderateurice, editeur_media, gestionnaire_espace, tresorier_iere) ET des presets V1 (6 niveaux historiques : national, admin, moderation, tresorerie, animation, dpd) vers la liste atomique V2. Helper `droitsPourPresetV2(preset)` et `droitsPourPresetV1(preset, { perimetreOnglet })` (gère le cas modération + onglet « petitions » qui ajoute `moderer_a_priori`).
- [x] **`lib/droit.ts`** : 5 fonctions exposées avec types stricts.
  - `accorderDroit({...})` : upsert idempotent (par triplet personne × type × cible).
  - `retirerDroit({...})` : soft delete via `retire_le`/`retire_par`, ne supprime pas la ligne.
  - `verifierDroit(personneId, typeDroit, cible?)` : check booléen direct.
  - `peutAccorder(accordantId, typeDroit, cible?)` : helper MD3 non-élévation à appeler côté Server Action AVANT `accorderDroit`. Gère le cas particulier `gerer_droits` qui exige `admin_total_plateforme`. Un admin total passe toujours.
  - `listerDroitsDuProfil(personneId)` : retourne les droits actifs, tri par date d'accord décroissante.
- [x] **`lib/droit-projection.ts`** : fonction pure `projeterDroitAdminEnDroits(ligne)` qui applique les règles V1→V2 (cf. table `PRESETS_V1`). Cas spécifiques traités : `national` → 1 ligne `admin_total_plateforme` (marqueur MD5), `animation` → cible obligatoire = `(espace_commune, scope_commune_id)`, `moderation` → ajout conditionnel de `moderer_a_priori`. Lignes V1 retirées (`retire_le != null`) → non projetées (passé figé).
- [x] **`scripts/backfill-droits.ts`** : lit `droit_admin` par lots de 500, projette via le helper pur, upsert idempotent côté Supabase. **`--dry-run` requis explicitement par défaut**, `--confirm` exigé pour écrire. Sortie détaillée : compteurs par preset V1, lignes retirées ignorées, total atomique projeté.
- [x] **`types/database.ts` enrichi** : définition manuelle de `droit` cohérente avec la migration. Helpers correctement typés.
- [x] **Tests unitaires** `tests/unit/droit/projection.test.ts` (12 tests) : couvre les 6 niveaux V1, scope commune obligatoire pour animation, périmètre d'onglet pour modération (avec/sans/exclu), propagation des métadonnées, ignorance des lignes retirées.

## Livré partiellement

- [ ] **Helpers RLS V1 (`est_admin_general`, `est_moderateurice`, etc.) qui lisent encore `droit_admin`** : volontairement INCHANGÉS. La migration applicative vers `droit` (helper qui lit la nouvelle table) sera faite chantier par chantier, sans casser l'existant. C'est la coexistence prescrite par MD1 V2.
- [ ] **UI d'administration des droits** : poser/retirer un droit via interface admin. Le helper `lib/droit.ts` + `peutAccorder` est posé ; la UI est un chantier V2 dédié.
- [ ] **`appliquerPreset` côté server action** : `lib/droit.ts` n'expose pas encore de fonction qui prenne un nom de preset et applique en lot. Facile à ajouter à partir de `droitsPourPresetV2(preset).map(accorderDroit)`. Reporté à la UI admin.

## Non livré (et pourquoi)

- [ ] **Migration `20260527020000_droit.sql` appliquée au distant.** Non appliquée volontairement (consigne explicite). À appliquer au matin via `supabase db push` ou `scripts/appliquer-sql-distant.ts`.
- [ ] **Backfill exécuté.** Idem, script prêt + testé en logique pure. À lancer en `--dry-run` puis `--confirm` au matin, **après** que la migration ait été appliquée. Estimation : le distant porte un nombre limité de lignes `droit_admin` (admins V1 uniquement, probablement < 50), donc le backfill sera rapide.

## Contenus à arbitrer

Rien à arbitrer côté contenu. Les libellés des `type_droit` suivent strictement la liste MD1 V2.

## Décisions techniques prises (ADR à archiver)

Pas d'ADR formelle. Choix techniques découlant de D10/MD1-MD6 :

- **Liste fermée de `type_droit` via CHECK** plutôt qu'enum Postgres : suit la convention V1 du repo (toutes les contraintes de liste sont des CHECK `... in (...)`). Permet d'ajouter une valeur par simple migration ALTER, sans toucher au type SQL.
- **Soft delete cohérent avec `droit_admin`** : `retire_le` + `retire_par`, jamais de DELETE. Audit RGPD + MD3 traçabilité obligatoire.
- **`admin_total_plateforme` comme marqueur unique** plutôt qu'un statut sur `personne` : choix d'extensibilité. MD5 V2 envisage un « Cercle d'admin plateforme » avec appartenances cooptées explicites — entité future, dans laquelle ce marqueur trouvera sa place. En attendant, marqueur = ligne `droit` sans cible.
- **`peutAccorder` côté TypeScript, pas côté RLS** : la règle MD3 « non-élévation » exige de raisonner sur les droits de l'accordant sur la cible — pas modélisable proprement dans une policy SQL. La RLS reste la deuxième ligne de défense (« est_admin_general »).

## Incertitudes techniques résolues avec Lilou/Ben

Aucune incertitude pendant le chantier.

## Écarts V1→V2 appliqués

Rubrique dédiée au cycle V2 (cf. CLAUDE.md §0.4).

- **Droits : 6 niveaux fixes V1 → cases atomiques V2** (Famille A, cf. `docs/cdc-v2/01-REVUE-ECARTS-V1-V2.md` §2). La V1 portait `droit_admin.niveau` contraint à 6 valeurs. Le V2 D10/MD1 exige des permissions atomiques (24 droits + 1 marqueur). **Compromis appliqué** : on **ajoute** la table `droit` à côté de `droit_admin` qui reste intacte. Les 6 niveaux V1 deviennent des **presets** dans `lib/droit-presets.ts` ; le script de backfill projette les lignes ACTIVES de `droit_admin` en lignes atomiques `droit`. Les helpers RLS V1 continuent de lire `droit_admin` (coexistence). Personne ne perd ses droits.
- **Compteur droits inchangé** : aucune ligne `droit_admin` n'est modifiée. Lecture pure, projection, écriture dans la nouvelle table.
- **Aucun écart sur le grand modèle** (tronc Objet/Espace). Les `cible_type` ici sont une **liste fermée** (`espace_commune`, `objet_petition`, etc.), pas le tronc générique V2. La convergence vers un tronc reste reportée (interdit n°3).

## Tests

- **Unitaires (Vitest)** : `npm test` → **31 fichiers, 337 tests, tous verts**. Dont 12 nouveaux pour V2.1.3 (`tests/unit/droit/projection.test.ts`).
- **Build Next.js** : non lancé (chantier BDD + helpers, pas d'impact sur les routes).
- **Lint (Biome)** : `npm run lint` → 424 fichiers, 0 issue. `lint:fix` a auto-organisé les imports des 4 nouveaux fichiers.
- **Typecheck (tsc)** : `npm run typecheck` → 0 erreur.
- **E2E Playwright** : non lancés.

## Notes pour les chantiers suivants

- **Application au matin** (séquentiel, dans cet ordre) :
  1. `supabase db push` pour appliquer `20260527020000_droit.sql` (et les migrations V2.1.1 / V2.1.2 si pas encore appliquées).
  2. `npx tsx scripts/backfill-droits.ts --dry-run` → vérifier les compteurs annoncés.
  3. Si OK, `npx tsx scripts/backfill-droits.ts --confirm`.
- **Migration applicative progressive des helpers RLS** : remplacer `est_admin_general()` par `auth.uid() in (select personne_id from droit where type_droit='admin_total_plateforme' and retire_le is null)` etc. À faire chantier par chantier, table par table, avec tests à chaque étape. La coexistence permet de basculer progressivement.
- **UI admin des droits** : page `/admin/national/droits` (qui existe en V1) à enrichir pour exposer la nouvelle granularité — appliquer un preset, cocher case par case, retirer. Server Actions reposent sur `accorderDroit` + `peutAccorder`.
- **Journal admin** : chaque appel à `accorderDroit` / `retirerDroit` devrait également logger dans `journal_admin` (D10 V2 et MD3 « traçabilité obligatoire »). À ajouter dans les Server Actions, pas dans le helper directement (le helper reste un primitive).
- **`appliquerPreset(presetV2, options)`** côté helper : à ajouter quand la UI le demandera. Doit appliquer le preset en respectant `peutAccorder` pour chaque droit individuellement.
- **Tests d'intégration** : sans mock Supabase, les helpers `accorderDroit`/`verifierDroit` ne sont pas testés. À écrire en harnais E2E quand Supabase sera disponible, en particulier pour valider le comportement de l'index unique partiel sur les lignes actives uniquement (upsert ne devrait pas violer la contrainte si la seule ligne existante est retirée).
