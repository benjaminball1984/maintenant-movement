# Manifest — V2 Vague 3, Chantier V2.3.17 : Console admin des réservations en litige

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-17-moderation-litige-reservation`
**Base** : `main` (tip `eee8584`, V2.3.16 + CLAUDE.md)

---

## Livré et fonctionnel

Boucle d'arbitrage complète : quand un demandeur signale un litige (V2.3.16), un·e admin peut désormais trancher depuis `/admin/moderation/reservations`. La décision et son motif sont communiqués au journal D8bis et seront visibles par les deux parties.

- [x] **`app/admin/moderation/reservations/page.tsx`** : Server Component qui liste toutes les réservations en statut `litige` triées par ancienneté (les plus vieilles en haut). Pour chaque entrée : badge danger + type d'offre, lien vers l'offre (si encore présente), créneau, motif initial du litige (encadré danger), message d'amorce dépliable, journal D8bis complet, boutons d'arbitrage.
- [x] **`app/actions/reservation.ts` — `resoudreLitigeReservationAction({reservationId, decision, motif, cheminRevalidation?})`** : Server Action admin. Vérifie session, `est_admin_general` via RPC, motif obligatoire (10 à 2000 caractères), statut courant `litige`. Appelle `changerStatutReservation` avec `auteurId: session.userId` — journal D8bis enregistre `litige → confirmee` ou `litige → annulee` automatiquement.
- [x] **`components/admin/moderation/BoutonsResolutionLitige.tsx`** : composant client UX 2 étapes. Bouton initial « Arbitrer ce litige » (ghost), puis encadré avec textarea motif (compteur 10-2000) + 2 boutons « Trancher pour le propriétaire (confirmer) » / « Trancher pour le demandeur (annuler) » + bouton Fermer. Désactivation tant que le motif est trop court.
- [x] **`lib/reservation.ts` — `listerReservationsEnLitige()`** : helper de listage. Trié par `updated_at` ascendant (les litiges les plus anciens d'abord). RLS V2.2.2 `reservation_select_demandeur_admin` autorise admins.
- [x] **`app/admin/layout.tsx`** : entrée « Réservations en litige » ajoutée à la nav latérale de la console modération.

## Non livré (et pourquoi)

- [ ] **Filtres / tri** : pas de filtre par type d'offre, par date, par ancienneté du litige. La liste est triée chronologiquement et suffit pour un volume modéré. À ajouter si la modération devient massive.
- [ ] **Pagination** : non posée. Tous les litiges chargés d'un coup. Même remarque : à ajouter quand le volume le justifie.
- [ ] **Notification aux deux parties après arbitrage** : pas envoyée. À brancher quand `notification` V2 sera là. Le journal D8bis garde la trace, mais sans notif active, demandeur et propriétaire devront revisiter leurs pages pour découvrir l'arbitrage.
- [ ] **Vue d'historique des litiges arbitrés** : la page ne montre que les litiges EN COURS (statut = `litige`). Une fois arbitré (statut = `confirmee`/`annulee`), la réservation disparaît de la console. Pour audit, l'historique reste dans `reservation_journal`. Une vue dédiée « Litiges arbitrés (30 derniers jours) » pourrait être utile mais c'est V2.4+.
- [ ] **Identification des parties** : on ne nomme pas le demandeur ni le propriétaire de l'offre. Pareil que V2.3.13 — demande le helper `nomAffichageRespectantVisibilite` qu'on n'a pas encore.

## Décisions techniques prises

- **Contournement explicite de `transitionAutorisee`** : la machine à états D8 V2.2.2 considère `litige` comme terminal pour les acteurs ordinaires (demandeur, propriétaire). L'admin a le privilège documenté de débloquer (cf. policy `reservation_update_admin`). On ne tente PAS d'élargir `transitionAutorisee` côté admin (qui resterait alors ambigu : faut-il deux fonctions ?). À la place, la Server Action `resoudreLitigeReservationAction` n'appelle simplement pas `transitionAutorisee` et passe directement à `changerStatutReservation`. Le commentaire dans le code l'explique.
- **2 décisions seulement** : `litige → confirmee` (en faveur du propriétaire, la prestation est réputée réalisée correctement) ou `litige → annulee` (en faveur du demandeur, la prestation est réputée non réalisée). Pas de « renvoi à `acceptee` » ou « renvoi à `realisee` » — l'arbitrage ferme le cycle, et l'historique reste dans le journal.
- **Pas de table `decision_litige` dédiée** : le motif d'arbitrage est stocké dans `reservation_journal.motif` (V2.3.15) au moment de la transition. Pas d'utilité d'avoir une table séparée pour le MVP — l'audit est lisible dans le journal trié par `changed_at`.
- **Liste triée ascendante par `updated_at`** : les litiges les plus anciens (ceux qui attendent le plus longtemps) apparaissent en premier. Cohérent avec une logique de file d'attente FIFO.
- **Placement dans `/admin/moderation/`** plutôt que `/admin/national/` : l'arbitrage est un acte de modération inter-personnes, pas un acte national. Cohérent avec le pattern de la console.

## Écarts V1→V2 appliqués

- **Greffe additive pure** : pas de migration, juste une page admin et une Server Action. Pas de modification du schéma V2.2.2 (la machine à états D8 est respectée, l'admin contourne avec un privilège documenté).

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (inchangés).
- **Lint Biome** : 466 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **Notif d'arbitrage** : prioritaire dès que `notification` V2 sera là. Brancher dans `resoudreLitigeReservationAction` pour notifier demandeur ET propriétaire.
- **Audit log** : envisager un dashboard `/admin/national/audit` qui présente une vue agrégée des transitions journalisées (D8bis). Utile pour mesurer le volume de litiges, le délai moyen d'arbitrage, etc.
- **Permission affinée** : aujourd'hui c'est `est_admin_general` (binaire). Quand `verifierDroit('arbitrer_litige_reservation')` V2.1.3 sera branché aux contrôles d'accès, basculer la vérification (cohérent avec V2.1.3 droit atomique).
- **Cycle D8 fermé de bout en bout** : avec V2.3.17, plus aucun statut n'est inatteignable. Le cycle complet est navigable, observable et arbitrable.
