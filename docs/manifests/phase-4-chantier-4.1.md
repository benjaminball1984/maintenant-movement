# Manifest : Phase 4, Chantier 4.1 — S'entraider (4 sous-espaces)

**Date de fin** : 2026-05-20
**Branche** : `feature/phase-4-chantier-4.1-entraide`
**Commit final** : à renseigner après commit
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

### Schéma BDD (migration 020)

- [x] **Table `offre_entraide`** (polymorphe) : 4 types (`hebergement | transport | pret_objet | fruits_terre`), sens (`propose | cherche`), titre, description, image, lieu + lat/lng, `meta` JSONB pour les métadonnées par type, statut (`publiee | retiree | cloturee`), méta de retrait. 7 contraintes CHECK + 5 index dont géo + récents.
- [x] **RLS** : lecture publique (publiées + clôturées), créateurice voit ses retirées, modé/admin tout. Insert auth requise. Update créateurice tant que publiée + modé/admin. Pas de DELETE.

### Code applicatif

- [x] **Types** : `OffreEntraide`, unions `TypeOffreEntraide`, `SensOffreEntraide`, `StatutOffreEntraide`.
- [x] **Validations Zod** : `creerOffreEntraideSchema` (avec refinement géo cohérent), `retirerOffreSchema`, `cloturerOffreSchema`.
- [x] **Server Actions** : `creerOffreEntraide`, `retirerOffre`, `cloturerOffre`. Slug unique partagé, droit modé via `est_moderateurice('entraide')`.
- [x] **`lib/entraide/config.ts`** : configuration centralisée des 4 sous-espaces (titre, description, verbes offre/demande, slug URL). Permet d'éviter 4 fois la même logique côté pages.
- [x] **`lib/entraide/requetes.ts`** : `listerOffresPubliees(type)`, `offreParSlug(slug)`. Hydratation porteur·euse.

### Composants

- [x] **`<CarteOffre>`** : carte de listing avec badge offre/demande, lieu, accroche.
- [x] **`<FormulaireCreationOffre>`** (Client) : RHF + Zod, radio des 4 types et 2 sens, lat/lng optionnels. La type pré-rempli depuis chaque page de création, mais peut être changé.
- [x] **`<PageListeSousEspace>`** : composant générique avec 2 sections « Offres » / « Demandes ». Évite la duplication entre les 4 pages liste.

### Pages

- [x] **Layout `/s-entraider`** : nav latérale listant les 4 sous-espaces actifs + SEL/Marché en stub.
- [x] **`/s-entraider`** : accueil avec 4 tuiles cliquables vers chaque sous-espace + info SEL/Marché à venir.
- [x] **4 pages liste** : `/hebergement`, `/transport`, `/qui-prete-tout`, `/fruits-de-la-terre`. Chacune ne fait qu'appeler `<PageListeSousEspace type={...} />`.
- [x] **4 pages création** : `/[sousespace]/nouvelle` — auth requise, type pré-rempli.
- [x] **Page détail commune** : `/s-entraider/offre/[slug]` — image, lieu (avec lien carte), description, créateur·ice, état (publiée/retirée/cloturée).

### Tests

- [x] **9 nouveaux tests unitaires** (`tests/unit/validations/entraide.test.ts`) : création, géo cohérence, retrait, clôture. Total **154 verts** (+9).
- [x] **E2E** (`tests/e2e/entraide.spec.ts`) : 8 scénarios + 1 boucle de 4 → 9 tests effectifs (rendu des 4 sous-espaces, redirections auth, page accueil, 404).
- [x] **Lint** (Biome) + **typecheck** (tsc) verts.
- [x] **Build production** : 60+ routes, dont 9 nouvelles routes /s-entraider/* (4 listes + 4 créations + 1 détail).

## Livré partiellement

- [ ] **Contact créateur·ice** : la fiche détail prépare le bouton de contact, mais la mise en relation effective dépend de la messagerie interne (chantier 7.5). En attendant, on affiche un message expliquant la situation.
- [ ] **Métadonnées spécifiques par type** : le champ `meta` JSONB est posé, mais l'UI ne propose pas encore de champs spécifiques (capacité hébergement, trajet transport, durée prêt, etc.). Saisie libre via le titre/description pour l'instant.

## Non livré (et pourquoi)

- [ ] **Frigos solidaires** (sous-feature de `fruits_terre`) : la spec §6D demande étiquetage, registre quotidien, gestion collective. Demande une table `registre_frigo` dédiée + une UI de suivi. Reporté en chantier dédié (4.1bis ou 6.x).
- [ ] **Repair Café** (sous-feature de `pret_objet`) : crée automatiquement un groupe sur le réseau social. Dépend du chantier 7.5 (réseau social).
- [ ] **Console modération entraide** : pas d'onglet `/admin/moderation/entraide` posé pour 4.1. À ajouter quand le besoin se concrétisera (a posteriori, donc pas urgent).
- [ ] **Cagnottes locales sur carte unifiée** : la carte `/carte` n'agrège pas encore les offres d'entraide. Une ligne dans `chargerPointsCarte()` permettrait l'inclusion ; reporté pour ne pas surcharger la carte sans filtres dédiés.

## Décisions techniques prises

- **Table polymorphe unique** plutôt que 4 tables séparées (hebergement, transport, etc.). Les 4 sous-espaces partagent 95 % de leur modèle ; un seul `type` discriminant + `meta` JSONB pour les exceptions par type. Permet d'écrire des requêtes transverses (« toutes mes offres d'entraide ») sans UNION.
- **Composant `<PageListeSousEspace>` partagé** + 4 pages thin. Chaque page = 5 lignes. Ajouter un 5e sous-espace = ajouter une ligne dans `SOUS_ESPACES` + 2 fichiers thin.
- **`meta` JSONB sans validation stricte v1**. Permet de poser la fondation sans figer les champs ; la validation par type viendra quand on saura précisément ce qu'on veut.
- **Pas de table de messages entraide en 4.1**. La messagerie interne est un chantier dédié (7.5). En attendant, le contact se fait hors plateforme.

## Tests

- Unitaires : **154 tests verts** (+9 pour 4.1).
- E2E Playwright : `tests/e2e/entraide.spec.ts` (9 scénarios). Le flux complet dépend de Supabase branchée.
- Lint, typecheck, build : tous verts.

## Notes pour les chantiers suivants

- **4.2 SEL** : posera la table `service_sel` + workflow modération 2h + crédit 99-coins automatique. Peut s'inspirer de `offre_entraide` pour le modèle d'offre.
- **4.3 Marché solidaire** : table `produit_marche` + toggle vente/don + notation 5 étoiles + 4 monnaies physique / 2 en ligne. Modèle proche d'`offre_entraide` mais avec champ prix + monnaie.
- **6.1 Carte unifiée enrichie** : ajouter `offre_entraide` aux sources de `lib/carte/donnees.ts` (3 lignes).
- **7.5 Messagerie interne** : activer le bouton « Contacter le créateur·ice » sur la fiche détail.
- **9.1 Console modération** : ajouter un onglet `/admin/moderation/entraide`.
