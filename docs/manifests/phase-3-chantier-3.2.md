# Manifest : Phase 3, Chantier 3.2 — Mobilisations + Campagnes + Carte unifiée

**Date de fin** : 2026-05-20
**Branche** : `feature/phase-3-chantier-3.2-mobilisations-campagnes`
**Commit final** : `3a30f74`
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

### Schéma BDD (migrations 014 → 017)

- [x] **Table `mobilisation`** (014) : slug, titre, description, image, lieu + lat/lng, date_debut + date_fin optionnelle, créateurice, statut `publiee | retiree` (modération a posteriori), méta de retrait (par/le/raison). 6 contraintes CHECK (statut, slug format, latitude, longitude, géo cohérent, dates cohérentes, retrait cohérent). 4 index dont un partiel sur les publiées géolocalisées (pour la carte).
- [x] **RLS `mobilisation`** : lecture publique si publiée, créateurice voit ses retirées, modé/admin tout. Insert auth requise. Update créateurice (publiée + date_debut futur) + modé/admin. Pas de DELETE (retrait par statut).
- [x] **Table `participation_mobilisation`** (015) : `personne_id` nullable (clic anonyme conforme spec §5C + §12), code_postal et accepte_notifications optionnels (le code postal n'est pas obligatoire pour ce flux, exception explicite de la spec §12). Unique partiel sur `(mobilisation_id, personne_id) WHERE personne_id IS NOT NULL` pour empêcher un double clic connecté tout en laissant passer les anonymes.
- [x] **RLS `participation_mobilisation`** : individuel privé (participant·e + créateurice mobilisation + modé/admin). Insert ouverte avec contrainte `personne_id IS NULL OR = auth.uid()`. Delete par participant·e (droit RGPD).
- [x] **Fonction `nombre_participant_es(uuid)`** : `SECURITY DEFINER` qui expose le count sans révéler la table. Calque du pattern `nombre_signatures` de 3.1.
- [x] **Table `campagne`** (016) : slug, titre, texte, image, créateurice, modération a priori (mêmes états que pétitions : `en_moderation | publiee | rejetee | archivee`). RLS calquée sur pétitions.
- [x] **Table `module_campagne`** (017) : jointure polymorphe campagne ↔ {pétition | mobilisation | cagnotte | sondage | page_editoriale}. Contrainte CHECK qui interdit l'incohérence type ↔ payload (page_editoriale doit avoir `contenu_editorial`, autres types un `cible_id`). Unique sur `(campagne_id, type_module, cible_id)` pour empêcher la double-attache. RLS qui suit la visibilité de la campagne mère.

### Types + validations

- [x] **`types/database.ts`** : ajout des 4 tables (Row/Insert/Update), union `StatutMobilisation`, `StatutCampagne`, `TypeModuleCampagne`, signature `nombre_participant_es`. Alias exportés : `Mobilisation`, `ParticipationMobilisation`, `Campagne`, `ModuleCampagne`.
- [x] **`lib/validations/mobilisation.ts`** : `creerMobilisationSchema` (avec refinements géo cohérent + dates cohérentes), `participerMobilisationSchema` (minimaliste, code_postal optionnel), `retirerMobilisationSchema` (raison >= 10 chars), helper `slugifierTitreMobilisation`.
- [x] **`lib/validations/campagne.ts`** : `creerCampagneSchema`, `modererCampagneSchema` (calque pétition), `attacherModuleSchema` (refinement type ↔ payload), `detacherModuleSchema`.

### Server Actions

- [x] **`app/(public)/mobiliser/mobilisations/actions.ts`** : `creerMobilisation` (auth + Turnstile + slug unique + publication immédiate), `participerMobilisation` (anonyme/connectée, gestion du conflit unique 23505 → message clair), `retirerMobilisation` (créateurice OU modé + raison >= 10 chars + journal). Revalidations propres incluant `/carte` et `/`.
- [x] **`app/(public)/mobiliser/campagnes/actions.ts`** : `creerCampagne` (en_moderation), `modererCampagne` (publier/rejeter avec raison), `attacherModule` (vérifie la cible : pétition publiée OU mobilisation publiée ; rejette explicitement cagnotte/sondage en attendant 3.3 / 7.5), `detacherModule`.

### Couches de requêtes

- [x] **`lib/mobilisations/requetes.ts`** : `listerMobilisationsAVenir` / `Passees`, `mobilisationAlaUne`, `mobilisationParSlug`, `listerMobilisationsGeolocalisees` (pour la carte), `listerMobilisationsAVerifier` (file modé a posteriori), `dejaParticipante` (helper UI). Pattern identique à `lib/petitions/requetes.ts` : hydratation par IN-clause sur `personne` + RPC compteur en parallèle.
- [x] **`lib/campagnes/requetes.ts`** : `listerCampagnesPubliees`, `campagneParSlug`, `listerCampagnesAModerer`. Résolution polymorphe des modules : un SELECT par type de cible, regroupement IN-clause par type, fusion en `ModuleResolu` avec `titre_cible` / `slug_cible` / `statut_cible`.
- [x] **`lib/carte/donnees.ts`** : `chargerPointsCarte()` agrège mobilisations + communes en `PointCarte[]` (union discriminée `type`). Architecture conforme spec §8A « agrégation à l'affichage ».
- [x] **`lib/mobilisations/dates.ts`** : helpers `formaterDateLongue`, `formaterDateCourte`, `formaterHeure`, `formaterPlage` (même jour / pluri-jours / sans date_fin), `formaterRelativeAVenir` (« Demain », « Dans 3 jours », « Passée »).

### Composants UI

- [x] **`<BoutonParticiper>`** (Client) : compteur affiché, Turnstile, cookie anonyme `participe_<id>` 90 jours pour ne pas réafficher le CTA. Confirmation visuelle « Tu participes ✓ » non cliquable. Aucune information demandée (« anonyme par défaut » respecté). Aligne l'UI sur l'état réel BDD via `dejaParticipanteConnectee` prop venant du Server Component.
- [x] **`<CarteMobilisation>`** + **`<CarteCampagne>`** : cartes de listing standardisées (badge type, titre cliquable, métadonnées dates/lieu/compteurs).
- [x] **`<FormulaireCreationMobilisation>`** (Client) : RHF + Zod, gestion `datetime-local` → ISO 8601 UTC, lat/lng en number nullable, redirection vers la fiche détail au succès.
- [x] **`<FormulaireCreationCampagne>`** (Client) : RHF + Zod, redirection vers la fiche détail.
- [x] **`<FormulaireModerationCampagne>`** (Client) : publier / rejeter, raison masquée derrière clic.
- [x] **`<FormulaireRetrait>`** (Client) : retrait a posteriori d'une mobilisation, raison >= 10 chars, action mise derrière un clic pour éviter les retraits accidentels.

### Pages

- [x] **`/mobiliser/mobilisations`** : agenda chronologique des publiées à venir (`CarteMobilisation` x N) + section « Passées récentes » (max 20). Boutons « Créer une mobilisation » (auth-aware) + « Voir sur la carte ». Pied de page rappelant la modération a posteriori.
- [x] **`/mobiliser/mobilisations/[slug]`** : fiche complète (image, dates, lieu + lien carte, description), `<BoutonParticiper>` cliquable, état « retirée » avec raison pour la créateurice.
- [x] **`/mobiliser/mobilisations/nouvelle`** : auth requise (`getSessionOuRediriger`), formulaire complet, message rappelant la modération a posteriori (publication immédiate).
- [x] **`/mobiliser/campagnes`** : liste des publiées, badges des types de modules attachés.
- [x] **`/mobiliser/campagnes/[slug]`** : fiche avec présentation longue + section « Modules de la campagne » qui résout chaque module en carte cliquable (vers pétition / mobilisation) ou en page éditoriale inline. État « cible indisponible » pour les types pas encore implémentés (cagnotte / sondage).
- [x] **`/mobiliser/campagnes/nouvelle`** : auth requise + alerte « modération a priori ».
- [x] **`/carte`** : Server Component qui pré-agrège les points + `<CarteWrapper>` qui charge dynamiquement `<CarteUnifiee>` (ssr: false) avec MapLibre GL JS. Filtres par type (mobilisations / communes) avec compteurs par catégorie, popups cliquables.

### Console modération

- [x] **Nav latérale étendue** (`app/admin/layout.tsx`) : 3 onglets actifs (Pétitions, Campagnes, Mobilisations) + Cagnottes grisée (3.3).
- [x] **`/admin/moderation/campagnes`** : file FIFO des `en_moderation`, formulaire publier/rejeter inline. Calque exact du flux pétitions (3.1).
- [x] **`/admin/moderation/mobilisations`** : modération a posteriori — liste des 50 mobilisations publiées les plus récentes, action « Retirer » avec raison obligatoire. v1 sans table `signalement` (à venir).

### Page d'accueil

- [x] **`<UneMobilisation>`** branchée sur `mobilisationAlaUne()` (la prochaine à venir). Carte avec dates, lieu, compteur participant·es, CTA « Rejoindre » vers la fiche.

### Carte unifiée

- [x] **MapLibre GL JS** installé (`npm install maplibre-gl`). Style raster OSM public (libre, sans clé) ; passage à un style vectoriel libre type OpenFreeMap envisageable plus tard.
- [x] **Architecture Server + Client** : `app/(public)/carte/page.tsx` (Server) charge les points, `<CarteWrapper>` (Client) fait le `dynamic({ ssr: false })`, `<CarteUnifiee>` (Client) instancie la carte. Pattern propre pour les libs WebGL.
- [x] **Marqueurs SVG inline** colorés par type (mobilisations = hue, communes = brand), popup HTML simple avec lien vers la fiche. Filtres checkboxes avec compteur par type.

### Tests

- [x] **Unitaires** (35 nouveaux tests) :
  - `tests/unit/mobilisations/dates.test.ts` (9 tests).
  - `tests/unit/validations/mobilisation.test.ts` (16 tests).
  - `tests/unit/validations/campagne.test.ts` (10 tests).
- [x] **Total unit** : **121 tests verts** (+35 par rapport à 3.1).
- [x] **E2E** (`tests/e2e/mobilisations.spec.ts`) : 9 scénarios (liste mobilisations + campagnes, redirections auth des 4 routes protégées, 404 sur slugs inexistants, rendu carte unifiée + filtres). Sans Supabase branchée, on couvre les comportements front, pas le flux complet.
- [x] **Lint** : Biome `check` zéro erreur (auto-fix appliqué sur 17 fichiers : imports triés, lignes longues compactées).
- [x] **Typecheck** : `tsc --noEmit` zéro erreur.
- [x] **Build production vert** : **43 routes** (+6 par rapport à 3.1). La carte ajoute 3.19 kB First Load JS sur sa route ; MapLibre chargé en dynamic, n'impacte pas les autres pages.

## Livré partiellement

- [ ] **UI d'attachement de modules à une campagne** : la Server Action `attacherModule` est complète et la fiche détail rend bien les modules attachés, mais aucune UI d'édition n'est exposée à la créateurice. Pour 3.2 v1, l'attachement passe par appel direct de la Server Action (ou par la console admin) ; une UI dédiée (« Ajouter un module » → choix de type → picker de cible) est repoussée en polish chantier 11.x.
- [ ] **Géocodage automatique du `lieu`** : pour 3.2 v1, la créatrice saisit lat/lng manuellement (ou pas). Un picker de carte (« Clic sur la carte pour placer ») et/ou un appel à Nominatim viendra plus tard. Sans coordonnées, la mobilisation existe quand même, juste pas sur la carte.
- [ ] **Vue carte sur la page liste `/mobiliser/mobilisations`** : pour 3.2 v1, on propose un bouton « Voir sur la carte » qui redirige vers `/carte`. Une mini-carte embarquée sur la liste (filtres par date) viendra plus tard si la fluidité l'exige.
- [ ] **Tests E2E de bout en bout du flux « créer → participer → retirer »** : dépendent d'une BDD branchée + d'une session de test. Spec couvre les comportements front observables.

## Non livré (et pourquoi)

- [ ] **Agenda agrégé `/agenda`** : c'est l'autre face transverse de la carte (cf. spec §8B). Pour 3.2 le périmètre s'arrêtait à la carte ; l'agenda viendra en chantier 8.x dédié (avec les événements de communes, moments solidaires, etc.).
- [ ] **Modules « cagnotte » et « sondage » pour les campagnes** : tables pas encore créées (chantiers 3.3 et 7.5). La Server Action `attacherModule` retourne un message explicite si ces types sont demandés.
- [ ] **Table `signalement`** : pour 3.2 la modération a posteriori des mobilisations se fait depuis la console qui liste les 50 plus récentes. Un vrai workflow de signalement par les usager·es (signaler une mobilisation → file de modération priorisée) viendra avec un chantier dédié, transverse à tous les espaces.
- [ ] **Notifications push / email aux participant·es** : la colonne `accepte_notifications` est posée en BDD, mais aucun déclencheur n'envoie de notification. Le branchement Brevo arrivera au chantier 8.1.
- [ ] **Rate-limit IP du clic « je participe »** : pas en v1. Le cookie anonyme + Turnstile suffisent pour limiter le spam évident ; un vrai rate-limit (Redis ou Postgres-based) sera à évaluer si le besoin se concrétise.

## Contenus à arbitrer

Aucun nouveau placeholder éditorial : tous les textes du sous-espace Mobiliser sont du microcopy utilitaire couvert par la règle de non-invention.

## Décisions techniques prises

- **Lat/lng en `double precision` plutôt que PostGIS**. Supabase n'active pas PostGIS par défaut, et l'usage v1 ne demande pas de requêtes spatiales complexes (la carte affiche tous les points sans bbox query côté serveur). Si plus tard on a besoin de « mobilisations dans un rayon de 10 km », on activera PostGIS et on convertira la colonne.
- **Style raster OSM pour MapLibre**. Pas de clé requise, libre, suffisant pour 3.2. Le bundle MapLibre (~250 kB gzippé) est isolé dans la route `/carte` grâce à `dynamic({ ssr: false })`.
- **Architecture polymorphe `module_campagne`**. Plutôt que 5 FK séparées (toujours 4 NULL sur 5), un `type_module` + `cible_id` + contrainte CHECK qui enforce la cohérence type ↔ payload. La FK polymorphe n'est pas typable par Postgres, donc la Server Action `attacherModule` vérifie la cible côté app.
- **Slugifieur partagé**. Réutilise `slugifierTitreMobilisation` depuis `lib/validations/mobilisation.ts` pour les campagnes aussi. Une factorisation en `lib/slug.ts` viendra au prochain chantier qui en exprime le besoin (rejointe).
- **Cookie anonyme `participe_<id>`** pour dédoublonner le clic anonyme côté UX. Le compteur BDD peut bouger malgré tout (la BDD n'a pas d'identité côté anonyme), c'est de l'« honor system » assumé.
- **Carte v1 sans bbox query**. Les ~500 mobilisations + ~2300 communes sont chargées côté serveur et envoyées au client. À reconsidérer (clustering, GeoJSON paginated) quand le volume passera 5k+.

## Incertitudes techniques résolues

Aucune question soulevée à Lilou/Ben. Le scope de 3.2 était précisément cadré par la spec §5B-C, §8A et §11. Décisions internes documentées ci-dessus.

## Tests

- Unitaires : **121 tests verts** (`npm test`), +35 pour 3.2.
- E2E Playwright : `tests/e2e/mobilisations.spec.ts` (9 scénarios). Le flux complet dépend de Supabase branchée et sera vérifié manuellement au déploiement des migrations 014-017.
- Lint (Biome), typecheck (tsc), build (next build) : tous verts.

## Notes pour les chantiers suivants

- **3.3 Cagnottes** : posera la table `cagnotte`. Pour qu'une cagnotte soit attachable à une campagne, il suffira d'ajouter le cas `cagnotte` dans la fonction `verifierCible` de `app/(public)/mobiliser/campagnes/actions.ts`. La carte unifiée peut aussi accueillir les cagnottes locales en ajoutant un fetch dans `lib/carte/donnees.ts` (3 lignes).
- **7.5 Sondages** : idem.
- **8.1 Newsletter Brevo** : la colonne `accepte_notifications` est prête. Au moment de la signature, il faut tagger newsletter avec `origine=mobilisation-<slug>` (cf. spec §10 « 3 axes »).
- **8.2 Agenda agrégé** : peut s'appuyer sur `lib/mobilisations/dates.ts` (helpers réutilisables) et sur la même architecture « agrégation à l'affichage » que la carte unifiée.
- **11.x Polish** : géocodage automatique du lieu (Nominatim), UI d'attachement de modules pour les créateurices de campagnes, vraie file de signalement, rate-limit IP du « je participe ».
- **Migration Base44 (10.1)** : les pétitions Base44 sont la priorité ; les mobilisations Base44 ne sont pas mentionnées dans les actifs à préserver (cf. spec §9), aucun travail à prévoir côté mobilisations.
