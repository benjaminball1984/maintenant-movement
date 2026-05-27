# Manifest — V2 Vague 3, Chantier V2.3.24 : Filtres par statut sur dashboard demandeur + refactor partagé

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-24-filtres-statut-demandeur`
**Base** : `main` (tip `5e283c2`, V2.3.23)

---

## Livré et fonctionnel

Symétrie côté demandeur du chantier V2.3.23. Plus factorisation du module de filtres.

- [x] **`lib/reservation-filtres.ts`** : module partagé qui exporte `STATUTS_FILTRES_RESERVATION` (8 entrées) et le type-guard `estFiltreStatutValide`. Centralise la liste pour éviter la duplication entre les 2 pages.
- [x] **`app/(membre)/profil/reservations/page.tsx`** : ajoute la barre de filtres identique à V2.3.23 (8 chips ronds avec compteurs, aria-current sur le filtre actif). `searchParams.statut` valide via le helper partagé. Filtre côté TS sur la liste déjà chargée.
- [x] **`app/(membre)/profil/demandes-reservations/page.tsx`** : migré pour consommer le module partagé (supprime la duplication V2.3.23). Comportement identique.

## Non livré (et pourquoi)

- [ ] **Filtre par type d'offre** : pareil que V2.3.23, non posé. À ajouter conjointement aux deux pages quand le besoin se confirme.
- [ ] **Sauvegarde du filtre préféré** : cookie ou localStorage. Bonus UX.
- [ ] **Compteur dynamique sur les onglets de la nav profil** : « Mes réservations (n) ». Demande de transformer NavOnglets en Server Component, hors scope de ce chantier.

## Décisions techniques prises

- **Factorisation à la 2ᵉ instance** : doctrine projet — pas de DRY prématuré. Avec V2.3.23 il n'y avait qu'une instance, j'ai laissé inline. Avec V2.3.24 (2 callers), j'extrait dans `lib/reservation-filtres.ts`. Cohérent.
- **`STATUTS_FILTRES_RESERVATION` exporté avec le suffixe `_RESERVATION`** : pour éviter une collision future si d'autres entités (paiements, adhésions) ont des filtres similaires.
- **Migration silencieuse de V2.3.23 vers le module partagé** : pas de manifest correctif distinct ; l'extraction est cohérente avec ce chantier. Le diff montre clairement la suppression du dédoublonnage.

## Écarts V1→V2 appliqués

- **Greffe additive pure** : pas de migration. UI seulement.

## Tests

- **Unitaires (Vitest)** : 38 fichiers, **413 tests verts** (inchangés).
- **Lint Biome** : 473 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.

## Notes pour les chantiers suivants

- **Tests unitaires de `estFiltreStatutValide`** : pure, facile à tester. Petit follow-up.
- **Composant `BarreFiltresStatut`** : si on factorise les 60 lignes de barre de filtres entre les 2 pages (même rendu, juste l'`href` change), créer `components/reservation/BarreFiltresStatutReservation.tsx` qui prend `basePath: '/profil/reservations'`. Au prochain besoin de variation.
