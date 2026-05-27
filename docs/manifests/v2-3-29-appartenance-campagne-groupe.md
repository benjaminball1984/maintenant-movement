# Manifest — V2 Vague 3, Chantier V2.3.29 : `appartenance_campagne` + extension Mes groupes

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-29-appartenance-campagne-groupe`
**Base** : `main` (tip `cd94e43`, V2.3.28)

---

## Livré et fonctionnel

Couverture des 6 axes d'appartenance dans « Mes groupes ». `appartenance_campagne` posée (manquante). `appartenance_groupe_entraide_local` lue (existait déjà côté V1, je l'ai découverte en faisant cherche).

- [x] **Migration `supabase/migrations/20260527120000_appartenance_campagne_groupe.sql`** : crée UNIQUEMENT `appartenance_campagne` (pattern aligné sur `appartenance_commune`). Pas de table groupes : la V1 a déjà `appartenance_groupe_entraide_local` (champs `rejoint_le`/`quitte_le`/`role_groupe`).
- [x] **`types/database.ts`** : Row/Insert/Update/Relationships de `appartenance_campagne` ajoutés à la main. Pas de duplicat de `appartenance_groupe_entraide_local` (qui existe déjà).
- [x] **`lib/mes-groupes.ts` — `listerMesAppartenances`** :
  - Élargi à 6 axes (4 → 6) : ajout `campagnes` et `groupesEntraide`.
  - 4 requêtes en parallèle au lieu de 2 (Promise.all élargi).
  - Schémas adaptés : `campagne.titre` (pas `nom`), `appartenance_groupe_entraide_local.rejoint_le` (pas `rejointe_le`).
- [x] **`app/(membre)/profil/mes-groupes/page.tsx`** : 2 nouvelles sections (« Campagnes » + « Groupes d'entraide locaux ») avec icônes `Megaphone` et `HandHelping`. Liens vers `/mobiliser/campagnes/[slug]` et `/s-entraider/groupes-locaux/[slug]` (routes existantes).

## Non livré (et pourquoi)

- [ ] **Inscription/désinscription depuis la page** : pas dans ce chantier. La page est purement lecture. Le bouton « rejoindre » devra être posé sur la page individuelle de chaque espace (commune, campagne, groupe…) avec ses propres Server Actions.
- [ ] **Backfill `appartenance_campagne`** : la table V1 n'avait personne en stock pour les campagnes (pas de table d'appartenance avant). Donc pas de backfill nécessaire.
- [ ] **Page individuelle GT thématique** : toujours pas livrée. Le lien GT reste vide (cf. V2.3.22).
- [ ] **Filtrage `est_active` côté UI** : on filtre déjà côté DB ; pas d'option « voir aussi les groupes quittés » dans l'UI. À ajouter si besoin.

## Décisions techniques prises

- **Découverte `appartenance_groupe_entraide_local` existante** : grep révèle la table V1. Doctrine de greffe §0.3 : on RÉUTILISE. Annule la moitié de la migration que j'avais commencé à écrire. Bonne illustration du « pas d'invention ».
- **Mapping `campagne.titre` → `AppartenanceGroupe.nom`** : pour uniformiser l'affichage côté UI. L'interface `AppartenanceGroupe` parle de « nom », mais la source peut être titre/nom/libellé selon la table.
- **Schémas avec `nom`/`titre`/`rejointe_le`/`rejoint_le`** : irrégularité V1 acceptée par la doctrine de greffe. On s'adapte côté TS.
- **Pas de table de rôles** : `appartenance_campagne` est simple (pas de `role_campagne`). On verra plus tard si on a besoin (porteur·euse de campagne ?).

## Écarts V1→V2 appliqués

- **Greffe additive minimaliste** : une seule nouvelle table (`appartenance_campagne`). Le reste réutilise V1.

## Tests

- **Unitaires (Vitest)** : 38 fichiers, **413 tests verts** (inchangés).
- **Lint Biome** : 479 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.

## Notes pour les chantiers suivants

- **Bouton « Rejoindre cette campagne »** : à poser sur `/mobiliser/campagnes/[slug]`. Server Action `rejoindreCampagne(campagneId)` qui insère dans `appartenance_campagne` (RLS `insert_self` accepte).
- **Bouton « Quitter ce groupe »** : symétrique, sur la page du groupe. Update `est_active=false, quittee_le=now()`.
- **Compteur de membres** par espace : count des appartenances actives. Helper batch utile pour la page liste.
- **Migration `20260527120000_appartenance_campagne_groupe.sql`** : 12ᵉ en attente d'application distant.
