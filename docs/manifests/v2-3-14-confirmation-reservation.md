# Manifest — V2 Vague 3, Chantier V2.3.14 : Bouton « Confirmer » côté demandeur + correction du branchement Annuler V2.3.11

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-14-confirmation-reservation`
**Base** : `main` (tip `d68b4fd`, V2.3.13)

---

## Livré et fonctionnel

Boucle finale de la machine à états D8 côté demandeur : confirmation post-réalisation pour figer la réservation. Plus dette résolue : le bouton Annuler V2.3.11 n'avait jamais été branché dans la page (le commit V2.3.11 ne touchait pas `app/(membre)/profil/reservations/page.tsx` malgré ce que disait son manifest).

- [x] **`app/actions/reservation.ts` — `confirmerReservationAction({reservationId, motif?, cheminRevalidation?})`** : Server Action. Vérifie session active, demandeur (`reservation.demandeur_personne_id === session.userId`), transition autorisée par la machine à états D8 (`transitionAutorisee(statut, 'confirmee')` n'est vrai que depuis `realisee`). Appelle `changerStatutReservation` (V2.2.2) puis `revalidatePath`. Symétrique à `annulerReservationAction` (V2.3.11).
- [x] **`components/reservation/BoutonConfirmerReservation.tsx`** : composant client minimaliste, 1 clic (pas de confirmation 2-étapes : la confirmation n'est pas destructive, c'est la fin attendue du cycle). Gestion d'erreur inline. État `enCours` pendant l'appel.
- [x] **`app/(membre)/profil/reservations/page.tsx`** : branche les DEUX boutons conditionnellement.
  - `transitionAutorisee(statut, 'confirmee')` vrai → `BoutonConfirmerReservation` (uniquement quand statut = `realisee`).
  - `transitionAutorisee(statut, 'annulee')` vrai → `BoutonAnnulerReservation` (statut = `proposee` ou `acceptee`). Corrige la dette V2.3.11.

## Non livré (et pourquoi)

- [ ] **Notification au propriétaire** : pas envoyée quand le demandeur confirme. Pareil que V2.3.11 et V2.3.13 : à brancher quand la table `notification` V2 sera là. La V2.3.12 a posé le DM `message_reseau` comme amorce ; on pourrait poser un message « réservation confirmée » dans la même conversation mais c'est du scope creep dans ce chantier.
- [ ] **Litige côté demandeur** : la machine à états D8 autorise `realisee → litige` côté demandeur (si la réalisation n'a pas eu lieu ou s'est mal passée). Pas de bouton ici : la modération de litige V2 demande un workflow dédié avec motif obligatoire et envoi aux modérateurs. Chantier séparé quand la table `litige` V2 sera là.
- [ ] **Modification du motif** : `confirmerReservationAction` accepte un `motif` (par symétrie avec annuler), mais l'UI ne propose pas de saisie. Pas grand intérêt pour une confirmation (action positive, motif rare). Si on en a besoin plus tard, ajouter un textarea optionnel.

## Décisions techniques prises

- **1 clic pour confirmer, 2 clics pour annuler** : la confirmation est une action constructive (action attendue à la fin d'une réalisation). L'annulation et le refus sont destructifs (déçoivent l'autre partie), donc 2 clics. Aligné avec V2.3.11 et V2.3.13.
- **Dette V2.3.11 corrigée silencieusement** : le manifest V2.3.11 affirmait avoir branché `BoutonAnnulerReservation` dans `/profil/reservations` mais le commit ne touchait pas cette page (`git show --name-only 91db11a` confirme). Le bouton existait mais n'était jamais rendu. La correction tient en 2 lignes — coût trivial vs. faire un V2.3.14b dédié.
- **Pas d'AlertDialog / modale** : suit le pattern V2.3.11 / V2.3.13 — confirmation inline pour Annuler (encadré danger), 1 clic direct pour Confirmer. Cohérence UI.
- **Ordre des boutons** : Confirmer rendu avant Annuler dans le JSX. En pratique les deux ne sont jamais visibles simultanément (les statuts `realisee` et `proposee/acceptee` sont disjoints), donc l'ordre est cosmétique.

## Écarts V1→V2 appliqués

- **Greffe additive pure** : la V1 n'avait pas de réservation transversale, donc pas de cycle de confirmation. Le bouton ferme la boucle ouverte par V2.2.2.

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (inchangés — `transitionAutorisee('realisee', 'confirmee')` est déjà couvert par les tests V2.2.2).
- **Lint Biome** : 462 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **Bouton litige côté demandeur** : symétrique au bouton Confirmer mais avec motif obligatoire (Server Action accepte déjà `motif`). À faire quand la modération de litige V2 sera définie.
- **Notif sur transition `realisee → confirmee`** : poser une notif au propriétaire (« Ta prestation a été confirmée par X »). Cohérent avec la doctrine D8bis du cycle V2 (cycle ouvert/fermé observable des deux côtés).
- **Affichage de l'historique des transitions** : la table `reservation_journal` (V2.2.2) trace chaque changement de statut avec acteur et motif. On pourrait l'exposer dans une `<details>` « Historique » côté demandeur ET propriétaire. Utile pour le débogage et la transparence.
