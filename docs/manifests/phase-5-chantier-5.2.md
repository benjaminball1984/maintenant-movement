# Manifest : Phase 5, Chantier 5.2 — Communes libres + Fédérations + Confédérations + Assemblée Confédérale

**Date de fin** : 2026-05-20
**Branche** : `feature/phase-5-chantier-5.2-communes`
**Commit final** : `0c13ac4`
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

### Schéma BDD (migration 028)

- [x] **Table `mandat_confederal`** : un mandat = une personne représente UNE entité (commune | fédération | confédération) dans un binôme. Tirage au sort avec seed. Statut `actif | libere`. Trigger `tg_mandat_confederal_incompatibilite` qui libère automatiquement les mandats inférieurs quand on tire un mandat supérieur (cf. spec §7B incompatibilité de cumul). RLS : lecture publique (transparence radicale), insert/update réservés admin national.
- [x] **Fonction `nombre_communes_actives(personne_id)`** : compteur (0-3) utilisé par la Server Action `rejoindreCommune` pour décider du palier de modale.
- [x] **Fonction `candidates_pour_assemblee(entite_type, entite_id)`** : retourne les UUIDs éligibles pour un binôme (adhérent·es actif·ves + membres actif·ves de l'entité, traversant les rattachements `commune → federation → confederation`).
- [x] Réutilisation des trois mécanismes existants posés en 1.1 : trigger `tg_appartenance_commune_max_actives` (3 max), trigger `tg_appartenance_commune_anti_spam` (1 transition / 30 jours), policies RLS sur `commune`, `federation`, `confederation`.

### Code applicatif

- [x] **Types Database** : `MandatConfederal`, unions `EntiteConfederal | StatutMandat`. Signatures `nombre_communes_actives` et `candidates_pour_assemblee` ajoutées dans `Functions`.
- [x] **Validations Zod** (`lib/validations/communes.ts`) : `rejoindreCommune` (avec flag `confirme` pour les paliers 2 et 3), `quitterCommune`, `creerCommuneLibre` (avec refinement géo + code postal FR), `creerFederation` (type `geographique | thematique | mixte`), `creerConfederation`, `rattacherFederation`, `rattacherConfederation`, `tirerAuSortAssemblee` (nb_binomes 1-10).
- [x] **Server Actions** (`app/(public)/agir/communes/actions.ts`) :
  - `palierRejoindreCommune` : retourne `{palier, nombre}` pour que la fiche commune affiche la bonne modale avant l'action.
  - `rejoindreCommune` : enforce `confirme = true` aux paliers 2 et 3, refuse au palier 4. Traduit les erreurs de trigger BDD (anti-spam, max 3) en messages lisibles.
  - `quitterCommune` : passe `est_active = false` + `quittee_le`.
  - `creerCommuneLibre` : `statut_creation = 'auto_creee'`, slug unique.
  - `creerFederation` (type au choix), `creerConfederation`.
  - `rattacherCommuneFederation`, `rattacherFederationConfederation` : avec gestion du `23505` (déjà rattaché).
  - `tirerAuSortAssemblee` : réservé admin national. Lit les candidat·es via RPC, mélange via Fisher-Yates seedé (seed sauvegardé pour audit), insère `nb_binomes * 2` mandats. Le trigger BDD `incompatibilite_cumul` libère automatiquement les mandats inférieurs.
- [x] **Couche de requêtes** (`lib/communes/requetes.ts`) : `listerCommunes` (avec recherche ilike + comptage `nombre_adherents`), `communeParSlug`, `listerFederations`, `federationParSlug`, `listerConfederations`, `confederationParSlug`, `listerMandatsActifs` (avec hydratation des personnes).
- [x] **Script d'import CSV** (`scripts/import-communes.ts`) : CLI `npx tsx scripts/import-communes.ts <fichier.csv>`, parser des 8 colonnes attendues (slug, nom, code_insee, code_postal_principal, departement, region, latitude, longitude), upsert sur `slug` avec `statut_creation = 'pre_creee'`. Récap succès/échecs en console. Préalables : `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

### Composants

- [x] **`<CarteCommune>`** : vignette commune avec badge libre/pré-créée, code postal, compteur d'adhérent·es.
- [x] **`<BoutonRejoindreCommune>`** : composant client qui reçoit le `palier` calculé côté serveur et adapte son UI :
  - direct (0) → bouton + Turnstile, 1 clic.
  - deuxieme (1) → Alert info « Es-tu sûr·e ? » + case à cocher de confirmation.
  - troisieme (2) → Alert warning « Tu participes déjà à 2... » + case à cocher.
  - refus (3) → Alert warning sans bouton.
  - Si déjà membre : bouton « Quitter cette commune » + Alert info anti-spam.
- [x] **`<FormulaireCreationCommuneLibre>`** : nom + description + code postal optionnel + lat/lng optionnels.
- [x] **`<FormulaireCreationFederation>`** : nom + type (3 radios) + description optionnelle.

### Pages

- [x] **`/agir/communes`** : liste avec barre de recherche + carte récap des 3 niveaux supra-locaux + lien Assemblée Confédérale.
- [x] **`/agir/communes/[slug]`** : fiche détail + bouton rejoindre/quitter contextualisé.
- [x] **`/agir/communes/nouvelle`** : auth requise, formulaire commune libre.
- [x] **`/agir/federations`** : liste avec badge type, compteur de communes rattachées.
- [x] **`/agir/federations/[slug]`** : fiche détail.
- [x] **`/agir/federations/nouvelle`** : auth requise, formulaire fédération.
- [x] **`/agir/confederations`** : liste simple.
- [x] **`/agir/assemblee`** : Assemblée Confédérale avec 4 onglets (Toutes / Communes / Fédérations / Confédérations). Liste les mandats actifs avec nom et date de tirage.

### Tests

- [x] **12 nouveaux tests unitaires** (`tests/unit/validations/communes.test.ts`) : rejoindre/quitter, création commune libre / fédération / confédération, tirage au sort. Total **212 tests verts** (+12).
- [x] **E2E Playwright** (`tests/e2e/communes.spec.ts`) : 7 scénarios (4 listes, 2 redirections auth, 404 commune).
- [x] **Lint Biome + typecheck tsc + build Next.js** : tous verts.

## Livré partiellement

- [ ] **Création / page de détail confédération** : la liste `/agir/confederations` existe + Server Action `creerConfederation`. Pas de page `/agir/confederations/nouvelle` ni `/agir/confederations/[slug]` car ce sont des entités plus rares qui se créent depuis l'admin national pour l'instant. Sera ajouté quand le besoin se concrétisera.
- [ ] **UI de rattachement commune ↔ fédération depuis la fiche** : les Server Actions `rattacherCommuneFederation` et `rattacherFederationConfederation` sont prêtes. L'UI dédiée (formulaire ou bouton « rejoindre cette fédération ») n'est pas exposée. Sera ajoutée au chantier 9.2 (console admin) ou en polish 5.x.
- [ ] **Bouton « Tirer au sort » dans la console admin** : la Server Action `tirerAuSortAssemblee` est prête mais l'UI admin n'a pas été touchée pour 5.2. Sera intégrée au chantier 9.1 (console modération unique) ou 9.2 (tableau de bord admin).

## Non livré (et pourquoi)

- [ ] **Import du CSV des 2100-2300 communes** : le script d'import est prêt (`scripts/import-communes.ts`). Lilou/Ben doit fournir le CSV avec les 8 colonnes attendues, puis lancer `npx tsx scripts/import-communes.ts data/communes.csv`. Préalable signalé dans le préambule du fichier.
- [ ] **Pages profil pour gérer ses appartenances** : `/profil/communes` existait depuis 1.3 mais n'a pas été mis à jour pour utiliser les nouvelles données enrichies. Cohérent avec la décision « 1.3 polish » prise au chantier précédent.
- [ ] **Page d'accueil de l'Assemblée Confédérale plus riche** : pour 5.2 v1, on affiche juste la liste des mandats actifs. Une vue par binôme (regrouper les 2 délégué·es d'une même entité), un historique des tirages, et des stats globales viendront avec le chantier 9.2 (console admin) ou un polish dédié à l'Assemblée.

## Contenus à arbitrer

Aucun. Tout le contenu est technique/fonctionnel et les microcopies (« On part du réel et on ne part pas de coquille vide », « Maximum 3 communes par personne ») reprennent verbatim la doctrine de la spec §7B.

## Décisions techniques prises

- **Palier de modale calculé côté serveur** (`palierRejoindreCommune`) : la fiche commune lit le palier de la session avant de rendre le bouton. Évite le scénario où une personne arrive sur la fiche en ayant déjà 3 communes mais voit quand même le bouton « Rejoindre ». Cohérent avec le pattern Server-First de Next.js App Router.
- **Trigger BDD `tg_mandat_confederal_incompatibilite`** : libère automatiquement les mandats inférieurs au moment où on insère un mandat supérieur, sans logique applicative. Robuste face à des appels concurrents (impossible de se retrouver avec un cumul commune + fédération en BDD).
- **Tirage au sort avec seed sauvegardé** : la Server Action `tirerAuSortAssemblee` utilise un seed UUID stocké en BDD (`tirage_seed`), ce qui permet de reproduire le tirage pour audit. L'implémentation `xorshift32` est suffisante pour 5.2 v1 ; un audit cryptographique pourra réclamer un CSPRNG par la suite.
- **`candidates_pour_assemblee` traverse les rattachements** : pour les fédérations et confédérations, on remonte la chaîne `commune → appartenance_federation → appartenance_confederation`. Permet d'inclure tou·tes les adhérent·es actif·ves indirectement membres.
- **Script d'import CSV en upsert sur slug** : permet de relancer le script si Lilou/Ben corrige le CSV ; pas de doublons. `statut_creation = 'pre_creee'` distingue les communes pré-créées des communes libres ajoutées en cours de route.

## Tests

- Unitaires : **212 tests verts** (+12 pour 5.2).
- E2E Playwright : 7 scénarios couvrant la navigation des 4 listes + redirections auth + 404.
- Lint, typecheck, build : tous verts.

## Notes pour les chantiers suivants

- **Chantier 5.3 (Moments solidaires)** : organiser un moment = être membre de la commune territoriale concernée. Réutiliser `est_membre_commune` (helper SQL existant) + lecture via la couche de requêtes.
- **Chantier 6.1 (Carte unifiée)** : ajouter les marqueurs `commune` géolocalisée. La colonne `latitude/longitude` est posée depuis 1.1, le script d'import les remplit pour les communes pré-créées.
- **Chantier 9.2 (Admin)** : intégrer le bouton « Tirer au sort un binôme » dans le tableau de bord admin national, qui appelle `tirerAuSortAssemblee` avec les paramètres choisis.
- **Polish (profil)** : enrichir `/profil/communes` avec le compteur de transitions restantes, la liste des appartenances avec date d'entrée, l'option de quitter une commune.
