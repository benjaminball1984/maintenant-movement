# Manifest — V2 Vague 3, Chantier V2.3.9 : Page « Mes réservations » côté profil

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-9-page-mes-reservations`
**Base** : `main` (tip `7f6cccd`, V2.3.8)

---

## Livré et fonctionnel

- [x] **`app/(membre)/profil/reservations/page.tsx`** : Server Component protégé par `getSessionOuRediriger`. Liste les réservations dont la personne est demandeuse (via `listerReservationsDuDemandeur` V2.2.2). Pour chaque ligne : type d'offre (Badge), statut coloré (Badge variant selon état), titre + lien vers la page offre si disponible, créneau (début → fin si fournie), quantité, motif de décision si présent, message d'amorce envoyé (replié dans `<details>` pour ne pas surcharger la liste). État vide explicite avec un message bienveillant.
- [x] **`lib/reservation-titres.ts`** : helper de **jointure manuelle FK polymorphe**. Regroupe les `offre_id` par `offre_type`, fait 3 requêtes max (offre_entraide, service_sel, location_mutualisee), retourne une `Map<offre_id, { titre, slug, cheminPage }>` pour lecture O(1). La page location_mutualisee n'étant pas encore livrée (V2.3.3 socle), on n'expose pas de `cheminPage` pour ce type.
- [x] **Onglet « Réservations » ajouté au `NavOnglets`** profil, entre « Contributions » et « Notifications ».

## Livré partiellement

- [ ] **Dashboard symétrique « En tant que propriétaire d'offre »** : pas livré. Demande une requête côté offre (lister les `reservation` dont `offre_id` ∈ mes offres), différente de la version demandeur. Chantier dédié.
- [ ] **Annulation d'une réservation** depuis la page : la `quantite > 1` est affichée comme « N parts » sans bouton « Annuler ». Demande une UI client avec confirmation + Server Action qui passe `statut` à `'annulee'`. Chantier dédié.

## Non livré (et pourquoi)

- [ ] **Pas de migration ni de backfill** : V2.3.9 ne touche que l'UI/le code, lit la table `reservation` (V2.2.2) telle quelle.
- [ ] **Notifications quand une réservation change de statut** : pas branché. Demande de coordonner avec `lib/notifications/` (V1 chantier 8.1). À traiter quand la messagerie/notifs V2 sera renforcée.

## Décisions techniques prises

- **Jointure polymorphe manuelle** (3 requêtes max, indexées par `offre_id`) : plus simple qu'une vue Postgres et tient en TS strict. Si le volume monte (> 100 réservations affichées simultanément), envisager une pagination.
- **`<details>` pour le message d'amorce** : évite de gonfler la liste. Le message peut être long (jusqu'à 2000 chars).
- **Pas de lien vers la page location_mutualisee** : la page n'existe pas encore (V2.3.3 socle backend). On affiche juste le titre.

## Écarts V1→V2 appliqués

- **Nouvelle page V2 sans pendant V1** (la V1 n'a pas de système de réservation structurée). Greffe additive pure.

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (inchangés).
- **Lint Biome** : 456 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **Dashboard propriétaire d'offre** : page `/profil/offres-reservations` ou ajout d'un onglet « Demandes reçues » dans la même page. Server Action `changerStatutReservation` (helper existe V2.2.2) pour accepter / refuser / marquer réalisée.
- **Mécanisme « marquer réalisée »** : seul le demandeur peut transitionner `realisee → confirmee`, le propriétaire `acceptee → realisee`. Cohérent avec la machine à états D8.
- **Notifications « ta réservation a été acceptée / refusée »** : à brancher sur le changement de statut côté propriétaire.
