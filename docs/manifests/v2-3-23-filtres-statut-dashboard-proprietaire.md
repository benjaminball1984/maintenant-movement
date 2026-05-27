# Manifest — V2 Vague 3, Chantier V2.3.23 : Filtres par statut sur dashboard propriétaire

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-23-filtres-statut-dashboard-proprietaire`
**Base** : `main` (tip `e7d21f4`, V2.3.22 + acter CLAUDE.md)

---

## Livré et fonctionnel

Barre de filtres sur `/profil/demandes-reservations?statut=X` permettant au propriétaire d'offre de naviguer rapidement par statut (« En attente », « Acceptées », etc.). Note V2.3.13 listait ça comme « à ajouter si la liste devient longue en pratique ».

- [x] **`app/(membre)/profil/demandes-reservations/page.tsx`** :
  - `searchParams: { statut? }` lu et validé contre la liste des `StatutReservation` (alias `estFiltreValide`).
  - Constante locale `STATUTS_FILTRES` : 8 entrées (`tous` + 7 statuts D8) avec libellé humain.
  - Charge toutes les réservations en une fois (compteur correct), filtre côté TS (rapide et évite une 2ᵉ requête).
  - Compte par statut dans une `Map<StatutReservation, number>`.
  - Rend une `<nav>` avec 8 liens `rounded-full` (style « chip »). Le filtre actif a `bg-brand text-bg`, les autres `bg-surface hover:bg-surface-2`. `aria-current="page"` sur le filtre actif pour l'accessibilité.
  - Le filtre par défaut (sans query string) est « Tous » et reste actif tant que `searchParams.statut` est absent ou invalide.
  - Message vide adapté selon contexte (« aucune demande tout court » vs « aucune demande pour ce filtre »).

## Non livré (et pourquoi)

- [ ] **Mêmes filtres côté demandeur** (`/profil/reservations`) : pas livré dans ce chantier (focus dashboard propriétaire où le volume est typiquement plus élevé). Symétrie facile à ajouter si besoin.
- [ ] **Filtre par type d'offre** : non posé. Aujourd'hui un propriétaire peut avoir 5 covoit + 3 hébergement + 2 SEL ; un filtre par type pourrait être utile. À ajouter si demandé.
- [ ] **URL partage** : le `?statut=X` est partageable mais sans état authentifié de toute façon (la page demande session). OK comme tel.
- [ ] **Tri** : la liste est triée par date décroissante (V2.3.13). Pas de toggle « plus anciennes d'abord » dans ce chantier.

## Décisions techniques prises

- **Filtre côté TS plutôt que côté DB** : on charge tout, puis on filtre. Avantage : les compteurs « En attente (5) » sont calculables sans 2ᵉ requête. Inconvénient : on charge des lignes qui ne s'affichent pas. Acceptable parce que les volumes individuels par utilisateur sont modérés (typiquement <50 demandes). À refactorer côté DB si on passe à des centaines.
- **Sentinelle `tous` comme slug** : permet de représenter « pas de filtre » comme une option dans le tableau `STATUTS_FILTRES` plutôt qu'un cas spécial. Le `searchParams` sans `statut` est interprété comme « tous » par défaut.
- **`estFiltreValide` typed guard** : narrow le type `string | undefined` vers `StatutReservation`. Évite le cast brutal.
- **Chips ronds plutôt que `<select>` ou tabs** : exposition immédiate des compteurs (« En attente (3) ») sans interaction. Pattern aligné avec les sous-onglets de modération V1.
- **Accessibilité `aria-current="page"`** : indique le filtre actif aux lecteurs d'écran. Aligné avec NavOnglets profil (V2.3.13).

## Écarts V1→V2 appliqués

- **Greffe additive pure** : pas de migration. Tout côté UI.

## Tests

- **Unitaires (Vitest)** : 38 fichiers, **413 tests verts** (inchangés).
- **Lint Biome** : 472 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.

## Notes pour les chantiers suivants

- **Symétrie côté demandeur** : porter les filtres sur `/profil/reservations` (pareil avec compteur, même UI). Réutiliser `STATUTS_FILTRES` (à exporter dans un module partagé `lib/reservation-filtres.ts` si on factorise).
- **Filtre par type d'offre** : multiselect (covoit + hébergement + …) en parallèle du statut. URL `?statut=acceptee&type=covoiturage`.
- **Sauvegarde du filtre préféré** : cookie ou localStorage pour rouvrir la page dans le même état.
- **Compteur sur l'onglet « Demandes reçues »** dans la nav profil : déjà identifié au V2.3.13. Demande de transformer NavOnglets en Server Component (ou de poser un wrapper).
