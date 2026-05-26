# Manifest — V2 Vague 3, Chantier V2.3.11 : Annulation d'une réservation

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-11-annulation-reservation`
**Base** : `main` (tip `d3820d6`, V2.3.10)

---

## Livré et fonctionnel

Complète la boucle UX de la réservation : la personne demandeuse peut désormais annuler sa propre réservation depuis la page « Mes réservations » (V2.3.9).

- [x] **Server Action `annulerReservationAction`** (`app/actions/reservation.ts`) : vérifie la session, charge la réservation, contrôle que `demandeur_personne_id === session.userId` (pas d'annulation par un tiers), vérifie la transition autorisée via `transitionAutorisee` (machine à états D8) — seuls les statuts `proposee` et `acceptee` peuvent transitionner vers `annulee`. Appelle `changerStatutReservation` (helper existant V2.2.2). Revalide le chemin.
- [x] **Composant `BoutonAnnulerReservation`** (`components/reservation/BoutonAnnulerReservation.tsx`) : Client Component UX en 2 clics (« Annuler la réservation » → « Confirmer l'annulation »). Évite une modale lourde au profit d'une confirmation inline. Gestion d'erreur via `<p role="alert">`.
- [x] **Branchement dans `/profil/reservations`** : `<BoutonAnnulerReservation>` affiché conditionnellement via `transitionAutorisee(reservation.statut, 'annulee')`. Cohérent avec la RLS et la Server Action — le bouton n'apparaît pas pour les statuts terminaux (`refusee`, `realisee`, `confirmee`, `annulee`, `litige`).

## Livré partiellement

- [ ] **Motif d'annulation** : la Server Action accepte un `motif` (stocké dans `motif_decision`) mais l'UI ne le demande pas pour l'instant. À ajouter dans une étape ultérieure (textarea optionnel dans le composant `BoutonAnnulerReservation`).
- [ ] **Notification au propriétaire de l'offre** : pas branché. Demande la coordination avec la messagerie / `lib/notifications/`. À traiter quand le système de notifs V2 sera consolidé.

## Décisions techniques prises

- **Double check transition (UI + Server Action)** : l'UI cache le bouton si la transition n'est pas autorisée ; la Server Action re-vérifie côté serveur. Évite l'affichage d'un bouton qui échouerait à coup sûr, et garantit qu'un utilisateur malveillant qui appellerait directement la Server Action obtient une erreur claire.
- **`transitionAutorisee` réutilisé partout** : la machine à états D8 vit dans `lib/reservation.ts` (V2.2.2). Pas de duplication ; un seul point d'arbitrage.

## Écarts V1→V2 appliqués

- Complète une fonctionnalité V2 (réservation) sans toucher à la V1. Aucun écart.

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (les tests existants couvrent déjà `transitionAutorisee` en V2.2.2 — pas de nouveau test ici, le Server Action et le composant client sont triviaux côté logique).
- **Lint Biome** : 459 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **Acceptation/refus côté propriétaire** : symétrique à l'annulation. Demande de lister « les réservations sur mes offres » côté propriétaire + actions accepter/refuser/marquer réalisée. Chantier dédié.
- **Confirmation côté demandeur** : transition `realisee → confirmee`. Le bouton viendrait sur la page profil quand le propriétaire passe en `realisee`.
- **Notif au propriétaire** : « Tel·le demandeur·euse a annulé sa réservation ». Email + cloche.
- **Champ motif optionnel** dans le composant : textarea révélée seulement si la personne le souhaite (« ajouter un motif »).
