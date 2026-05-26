# Manifest — V2 Vague 1, Chantier V2.1.2 : entité Consentement + backfill

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-1-2-consentement`
**Commit final** : (voir `git log -1 --format=%h` sur cette branche)
**Durée approximative** : 1 session
**Base** : `main` (tip `f218e35`, V2.1.1)

---

## Livré et fonctionnel

- [x] **Migration `supabase/migrations/20260527010000_consentement.sql`** : crée la table `consentement` (id, profil_unifie_id FK, type_consentement, objet_type, objet_id, valeur, date_consentement, source, timestamps), avec contraintes CHECK strictes sur `type_consentement` (4 valeurs initiales) et `objet_type` (6 valeurs ou null). Cohérence `(objet_type, objet_id)` toujours tous deux NULL ou tous deux remplis via CHECK. Index unique sur `(profil_unifie_id, type_consentement, coalesce(objet_id, '00000000-...'))` pour gérer les NULL comme valeur distincte. 3 index de recherche. Trigger automatique sur `updated_at` qui met aussi à jour `date_consentement` quand `valeur` change (révocation = nouvelle date).
- [x] **Policies RLS dans la même migration** (cohérent avec le retour d'expérience revue 21/05 qui pointait la RLS déportée) : `select` self via `profil_unifie.personne_id = auth.uid()` + admin + créateur de pétition pour les `contact_createur` actifs sur SA pétition ; `insert` self ; `update` self (révocation) ; `delete` admin uniquement (la doctrine RGPD V2 dit « update à false », pas DELETE).
- [x] **Helper `lib/consentement.ts`** : 3 fonctions exposées avec types stricts.
  - `enregistrerConsentement({...})` : upsert avec validation des combinaisons `objet_type`/`objet_id`.
  - `revoquerConsentement({...})` : UPDATE valeur à false sans créer de ligne fantôme si aucun consentement existant.
  - `listerConsentementsDuProfil(profilUnifieId)` : retourne actifs ET révoqués, tri par date décroissante.
- [x] **Helper de projection `lib/consentement-projection.ts`** : fonction pure `projeterSignatureEnConsentements(signature)` qui applique les règles D8 V2 (newsletter_plateforme global / contact_createur par pétition / les `false` ne créent rien). Extrait du script pour pouvoir être testé sans mock Supabase.
- [x] **Script `scripts/backfill-consentement.ts`** : lit `signature_petition` par lots de 500 (curseur sur `created_at + id`), projette via le helper, upsert idempotent côté Supabase. **`--dry-run` requis explicitement par défaut**, `--confirm` exigé pour écrire (cohérent avec la consigne « --dry-run obligatoire » de la revue 21/05 §1.6).
- [x] **`types/database.ts` enrichi** : définition manuelle de `consentement` cohérente avec la migration. Le helper `enregistrerConsentement` est correctement typé.
- [x] **Tests unitaires** `tests/unit/consentement/projection.test.ts` (7 tests) qui couvrent les 4 combinaisons des deux booléens × signature avec/sans `profil_unifie_id` × propagation correcte de `petition_id`, `date_consentement`, `source`, `valeur`.

## Livré partiellement

- [ ] **UI de gestion des consentements côté profil** (`/profil/confidentialite/consentements` ou onglet existant). Le helper et le schéma sont posés ; la UI qui les expose à l'utilisateurice est un chantier V2 dédié. Pour l'instant, la révocation n'a pas d'entrée utilisateur en self-service.
- [ ] **Branchement du flux de signature pétition** sur la nouvelle table : actuellement le `signerPetition` continue d'écrire dans les colonnes V1 `accepte_newsletter` / `accepte_contact_createurice` de `signature_petition`. Ces colonnes restent la trace d'origine (snapshot D9). La création parallèle d'un `consentement` V2 à la signature sera ajoutée dans un chantier V2 dédié, sans rien retirer.

## Non livré (et pourquoi)

- [ ] **Migration `20260527010000_consentement.sql` appliquée au distant.** Non appliquée volontairement (consigne explicite « pas de touche au distant Supabase »). À appliquer au matin via `supabase db push` ou `scripts/appliquer-sql-distant.ts` (DDL pur, sans PII).
- [ ] **Backfill exécuté.** Idem, le script est prêt et testé en logique pure. À lancer en `--dry-run` puis `--confirm` au matin, **après** que la migration ait été appliquée au distant. Estimation : ~17 746 signatures à projeter (cf. CLAUDE.md §11), donc au plus 35 492 consentements potentiels selon les cases cochées par les signataires. L'idempotence du upsert garantit qu'une réexécution ne crée pas de doublons.

## Contenus à arbitrer

Rien à arbitrer côté contenu pour V2.1.2.

## Décisions techniques prises (ADR à archiver)

Pas d'ADR formelle. Toutes les décisions découlent de D8 V2 et de la doctrine de greffe :

- **FK vers `profil_unifie.id` plutôt que `personne.id`** : la table `profil_unifie` (chantier 13.3-E) porte l'identité durable des signataires AVEC ou SANS compte applicatif. Un consentement doit pouvoir survivre à la création tardive d'un compte. Cohérent avec D8 qui parle de « Profil » abstraitement.
- **Index unique avec COALESCE** sur `(profil, type, objet_id ou UUID nul)` : sans cette astuce, deux `consentement` globaux (`objet_id = NULL`) pour le même profil et type seraient acceptés par Postgres car NULL ≠ NULL dans les contraintes UNIQUE classiques. Cette construction force l'unicité réelle.
- **Révocation = UPDATE, pas DELETE** : suit D8 (« état vivant et révocable ») + la doctrine RGPD V2 (traçabilité des choix de la personne). Le trigger `consentement_updated_at_trigger` synchronise `date_consentement` avec le changement de valeur.

## Incertitudes techniques résolues avec Lilou/Ben

Aucune incertitude — déroulé direct sur la base des spécifications V2.

## Écarts V1→V2 appliqués

Rubrique dédiée au cycle V2 (cf. CLAUDE.md §0.4).

- **Consentements RGPD : 2 colonnes V1 → entité V2** (Famille A, cf. `docs/cdc-v2/01-REVUE-ECARTS-V1-V2.md` §1). La V1 portait `signature_petition.accepte_newsletter` et `signature_petition.accepte_contact_createurice` comme deux booléens en dur. Le V2 D8 demande une entité granulaire et révocable. **Compromis appliqué** : on **ajoute** la table `consentement` à côté des deux colonnes V1, qui restent **intactes** et deviennent la **trace figée de l'état initial** (cohérent avec D9, le snapshot de la signature). La table `consentement` porte l'**état vivant et révocable**. Aucune donnée n'a été touchée (la migration est posée mais pas encore appliquée ; le backfill est posé mais pas encore lancé).
- **Compteur signature inchangé** : les 17 746 signatures restent 17 746. Aucune ligne `signature_petition` n'est modifiée ; on lit, on projette, on insère ailleurs.

## Tests

- **Unitaires (Vitest)** : `npm test` → **30 fichiers, 325 tests, tous verts**. Dont 7 nouveaux pour V2.1.2 (`tests/unit/consentement/projection.test.ts`).
- **Build Next.js** : non lancé (chantier strictement BDD + helper + script, pas d'impact sur les routes).
- **Lint (Biome)** : `npm run lint` → 419 fichiers, 0 issue. (Les `console.log` du script ont été migrés en `console.info` pour rester sous le seuil silencieux de `noConsoleLog: warn`.)
- **Typecheck (tsc)** : `npm run typecheck` → 0 erreur.
- **E2E Playwright** : non lancés (la table n'est pas encore appliquée au distant).

## Notes pour les chantiers suivants

- **Application au matin** (séquentiel, dans cet ordre) :
  1. `supabase db push` pour appliquer `20260527010000_consentement.sql` (et `20260527000000_t99cp_hash_consomme.sql` de V2.1.1 si pas encore fait).
  2. `npx tsx scripts/backfill-consentement.ts --dry-run` → vérifier les compteurs annoncés (~17 746 signatures, X consentements newsletter + Y consentements contact_createur).
  3. Si OK, `npx tsx scripts/backfill-consentement.ts --confirm`.
- **Chantier V2 « branchement signature pétition »** : faire en sorte que `signerPetition` crée AUSSI un `consentement` V2 quand les cases sont cochées (`source: 'signature_petition_v2'`). Garder les colonnes V1 pour la trace.
- **Chantier V2 UI « mes consentements »** : page `/profil/confidentialite/consentements` qui appelle `listerConsentementsDuProfil` et expose un bouton « révoquer » par ligne. Server Action côté serveur qui appelle `revoquerConsentement`.
- **Export CSV signataires consentants** (P6a des fiches pétition V2) : à refactor pour lire `consentement` (état vivant) au lieu de `signature_petition.accepte_contact_createurice` (snapshot). Sinon, les signataires qui ont révoqué après coup seraient exportés à tort.
- **Historique multi-versions** : la table actuelle n'a qu'une ligne par triplet `(profil, type, objet)`. Pour tracer la séquence des changements (accepter/refuser/réaccepter), il faudra une table `consentement_historique` ou un changement de modèle. Non urgent.
- **Index supplémentaire éventuel** : `(type_consentement, valeur)` pour les exports massifs « tous les profils ayant accepté X ». À benchmarker avant.
