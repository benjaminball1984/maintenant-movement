# Manifest : Phase 6, Chantiers 6.1 + 6.2 — Carte unifiée enrichie + Agenda agrégé

**Date de fin** : 2026-05-21
**Branche** : `feature/phase-6-chantier-6.1-carte-agenda`
**Commit final** : `À RENSEIGNER PAR LE COMMIT FIX SUIVANT`
**Durée approximative** : 1 session Claude Code (chantier court : enrichissement de l'existant + nouvelle page)

---

## Livré et fonctionnel

### 6.1 — Carte unifiée enrichie

Une carte existait depuis le chantier 3.2 (mobilisations + communes). On l'enrichit avec les nouvelles sources géolocalisées posées en 4.x et 5.x.

- [x] **`lib/carte/donnees.ts` réécrit** : agrège 11 types de points (mobilisations, communes, 4 sous-types d'offres d'entraide, SEL, produits du marché, boutiques, minimarchés, moments solidaires). Les 8 chargements sont parallélisés via `Promise.all`. Garde-fou applicatif sur lat/lng `null` malgré le filtre côté DB.
- [x] **`<CarteUnifiee>` mis à jour** : 11 couleurs + 11 libellés + filtre exhaustif. Tous les types activés par défaut. Les marqueurs SVG hérités du chantier 3.2 fonctionnent inchangés (le composant ne touche pas au rendu, juste à la palette).
- [x] **Filtre par type** : 11 cases à cocher avec compteur par type. Persistant pendant la session (état local).
- [x] **Indexes BDD existants** suffisent : chaque table porte un `_geo_idx` partiel (lat/lng non nulles + statut visible) posé au chantier de la table.

### 6.2 — Agenda agrégé

- [x] **`lib/agenda/donnees.ts`** : agrège 4 types d'événements datés (mobilisations, moments solidaires, minimarchés, boutiques avec `ouverte_du`). Tous les événements à partir de `now()` exclusivement. Heuristique `extraireDepartement` qui sort un code département à 2 chiffres depuis un lieu libre par regex `\b(\d{2})\d{3}\b`.
- [x] **`/agenda`** : page qui regroupe les événements par jour, avec formulaire de filtres GET (`?jour=YYYY-MM-DD`, `?departement=75`, `?type=mobilisation|moment_solidaire|minimarche|boutique_marche`). Badge par type, horaire de début/fin, lien vers la fiche détail.
- [x] **Pas de migration BDD** : on utilise les colonnes existantes (`date_debut` mobilisation, `commence_le` moment/minimarche/boutique). Les indexes posés à chaque chantier (`*_a_venir_idx`) couvrent les requêtes filtrées par statut + date.

### Tests

- [x] **E2E Playwright** (`tests/e2e/carte-agenda.spec.ts`) : 4 scénarios (rendu carte + agenda + formulaire de filtres + filtre URL).
- [x] **Lint Biome + typecheck tsc + build Next.js** : tous verts. Tests unitaires : **232 verts** (inchangés, pas de logique métier nouvelle isolable côté validation).

## Livré partiellement

- [ ] **Filtre par localité** : pour 6.2 v1, seul le filtre département est exposé (heuristique sur le code postal). Un filtre par ville exacte demandera l'intégration du choix de commune (lien avec table `commune`), à faire en polish.
- [ ] **Clusters sur la carte** : la spec §8A mentionne « clusters » mais le composant ne les implémente pas. MapLibre supporte les clusters via sources GeoJSON ; le code actuel utilise des marqueurs HTML individuels (cohérent avec 3.2). À ajouter en polish pour grosse volumétrie.

## Non livré (et pourquoi)

- [ ] **Sondages locaux** : type non listé car la table `sondage` n'existe pas encore (chantier 7.4). À ajouter quand la table sera posée.
- [ ] **Frigos solidaires** : le sous-type est inclus dans `offre_entraide.type = 'fruits_terre'` (couvert par 4.1). Une table dédiée `frigo_solidaire` avec registre + étiquetage n'est pas posée (sous-feature 4.1bis annoncée).
- [ ] **Cagnottes locales** : la table `cagnotte` n'a pas de lat/lng dédié. Une cagnotte est rattachée à une cause/lutte plus qu'à un lieu précis ; la spec §8A liste les « cagnottes locales » mais on attend la décision sur l'attache géo (chantier 9.x admin).

## Décisions techniques prises

- **Une seule page combinée 6.1 + 6.2** (commit unique) : les deux chantiers sont étroitement liés (mêmes sources, doctrine §8 carte/agenda en miroir). Évite la duplication du code de chargement.
- **Filtres URL pour l'agenda** plutôt que client : Server Component, indexable côté SEO, partage de liens facile. Cohérent avec la philosophie Next.js App Router.
- **Heuristique département via regex** : suffit pour 6.2 v1 (la majorité des lieux contiennent un code postal). Plus tard, quand on aura le rattachement explicite à une `commune` (qui porte `departement`), on basculera sur ce champ.
- **Conservation du modèle existant `<CarteUnifiee>`** : pas de réécriture, juste ajout des nouveaux types. Le SVG circle + couleur par type scale bien jusqu'à ~1000 marqueurs ; au-delà, clusters MapLibre à activer.

## Tests

- E2E Playwright : 4 nouveaux scénarios (carte + agenda + filtres).
- Tests unitaires : **232 verts** (inchangés pour ce chantier).
- Lint, typecheck, build : tous verts.

## Notes pour les chantiers suivants

- **Chantier 7.4 (Sondages)** : ajouter les sondages géolocalisés à la carte + à l'agenda si la date est explicite.
- **Chantier 9.2 (Admin)** : décider du rattachement géographique des cagnottes (champ `commune_id` ?) puis les afficher sur la carte.
- **Chantier 11.x (Polish)** : implémenter les clusters MapLibre quand la volumétrie dépasse ~500 marqueurs visibles simultanément.
- **Polish UI** : filtre par commune (au lieu de département) dans l'agenda dès que `commune.id` est exposé en URL.
