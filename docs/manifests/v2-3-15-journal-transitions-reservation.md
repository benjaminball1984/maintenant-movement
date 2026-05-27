# Manifest — V2 Vague 3, Chantier V2.3.15 : Journal des transitions D8 sur réservation

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-15-journal-transitions-reservation`
**Base** : `main` (tip `7fcaa91`, V2.3.14)

---

## Livré et fonctionnel

Cycle observable des deux côtés (doctrine D8bis V2) : à chaque transition D8, on inscrit une ligne dans `reservation_journal` (qui, quand, depuis quel statut, vers quel statut, avec quel motif). L'historique est visible côté demandeur ET côté propriétaire dans une section dépliable.

- [x] **Migration `supabase/migrations/20260527090000_reservation_journal.sql`** : table `reservation_journal` (uuid PK, FK `reservation_id` cascade, `statut_avant`/`statut_apres` enum-like par CHECK, `motif` text nullable, `auteur_id` FK auth.users nullable pour les transitions système, `changed_at` default now), index sur `(reservation_id, changed_at)`, RLS activée. Policy `SELECT` autorise demandeur + admin + modérateur autres-moyens (côté propriétaire on lit via Server Action après vérif applicative, cohérent avec `reservation`). Policy `INSERT` bloquée — seul `service_role` (utilisé par les Server Actions) insère. Pas de UPDATE / DELETE policies : journal immuable. **Non appliquée distant** (consigne « pas de touche au distant Supabase »).
- [x] **`types/database.ts` — `reservation_journal`** : Row/Insert/Update + Relationship ajoutés à la main (cf. CLAUDE.md §11 sur la maintenance manuelle).
- [x] **`lib/reservation.ts` — journalisation applicative** :
  - `ChangerStatutOptions.auteurId?: string` ajouté (cf. doctrine : on capture l'identité de l'auteur, non disponible en trigger SQL).
  - `changerStatutReservation` lit d'abord le statut courant, fait l'UPDATE, puis appelle `journaliserTransition` si `statutAvant !== nouveauStatut`. Fire-and-forget : l'échec d'insertion du journal n'invalide pas la transition.
  - `listerJournalReservation(reservationId)` : retourne l'historique trié chronologiquement.
  - `listerJournauxReservations(reservationIds)` : batch (Map indexé) pour éviter N+1 côté Server Component.
- [x] **`app/actions/reservation.ts` — propagation `auteurId`** : les 3 actions propriétaire (`accepter/refuser/marquer_realisee`), `annulerReservationAction` (V2.3.11), `confirmerReservationAction` (V2.3.14) passent désormais `auteurId: session.userId` à `changerStatutReservation`.
- [x] **`components/reservation/HistoriqueTransitions.tsx`** : Server Component pur (reçoit les entrées déjà chargées). Affiche un `<details>` « Historique (n) » avec liste chronologique : `statut_avant → statut_apres` + date FR + motif italique le cas échéant. N'affiche rien si le journal est vide.
- [x] **`app/(membre)/profil/reservations/page.tsx`** : charge `listerJournauxReservations(ids)` en parallèle de `chargerTitresOffres` (`Promise.all`), passe la slice à chaque `CarteReservation`, rend `<HistoriqueTransitions />` après le message d'amorce.
- [x] **`app/(membre)/profil/demandes-reservations/page.tsx`** : même branchement côté propriétaire.

## Non livré (et pourquoi)

- [ ] **Affichage du nom de l'auteur** : `auteur_id` est stocké mais on affiche seulement la transition (pas « par X »). Demande un join `personne` qui retombe dans le débat visibilité réseau (V1 §15-7) : le propriétaire d'une offre doit-il voir le nom du demandeur ? À traiter dans un chantier dédié avec un helper `nomAffichageRespectantVisibilite()` réutilisable (déjà identifié dans le manifest V2.3.13).
- [ ] **Historique pour les admins / modérateurs** : la policy `SELECT` les inclut, mais aucune UI admin ne consomme `reservation_journal`. Quand la modération de litige V2 sera là, brancher un visualiseur côté `/admin/moderation/reservation/[id]`.
- [ ] **Transitions système (cron expirations)** : pas encore implémentées. Quand on en posera (par exemple « expirer une `proposee` après 7j sans réponse »), passer `auteurId: undefined` est correct (interprété comme transition système, journal montrera « par Maintenant! »).
- [ ] **Migration appliquée distant** : laissée à Lilou/Ben au matin (consigne). DDL pure, sans PII. `supabase db push` ou `npx tsx scripts/appliquer-sql-distant.ts supabase/migrations/20260527090000_reservation_journal.sql`.

## Décisions techniques prises

- **Journalisation applicative vs trigger SQL** : trigger SQL `AFTER UPDATE` n'a pas accès facile à `auth.uid()` dans tous les contextes (notamment quand le `service_role` contourne RLS). Insertion depuis `changerStatutReservation` après le UPDATE est plus simple, et `motif` est déjà passé en paramètre. Coût : une requête supplémentaire (insert) par transition — acceptable, les transitions sont rares en pratique.
- **Lecture statut avant + UPDATE = 2 requêtes** : on aurait pu faire l'UPDATE en RETURNING avec un trigger qui copie l'ancien dans une variable de session, mais c'est plus complexe à maintenir. La doctrine V2 préfère la simplicité applicative.
- **Pas de skip-if-same-statut côté UPDATE** : la fonction écrit même si le statut ne change pas (idempotent côté DB grâce au `updated_at` trigger). Le journal lui en revanche n'insère pas pour transitions « inertes » (`statutAvant === nouveauStatut`).
- **`auteurId` optionnel rétrocompatible** : les callers V2.2.2-V2.3.x existants qui n'ont pas encore été migrés continueraient à fonctionner ; ils journaliseraient juste avec `auteur_id = null`. Aujourd'hui tous les callers sont migrés.
- **RLS `INSERT with check (false)` côté journal** : empêche tout client (même le client anon avec session) d'insérer arbitrairement. Seul le `service_role` utilisé côté Server Action contourne la policy. Cohérent avec le principe d'immuabilité du journal.
- **Pas d'index sur `auteur_id`** : pas d'usage actuel (on liste par `reservation_id`). À ajouter quand on aura un dashboard « mes transitions » par auteur.

## Écarts V1→V2 appliqués

- **Greffe additive séparée** : table annexe en lecture, pas de modification de `reservation` (doctrine V2 — on ne touche pas le tronc). Aucun écart au schéma V1 (qui n'avait pas de réservation).

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (inchangés ; le journal est une greffe en aval, pas dans le path des tests transitions).
- **Lint Biome** : 463 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **Tests unitaires de `journaliserTransition`** : aujourd'hui on ne le teste pas (le service Supabase est mocké). Si on ajoute un test, mocker `from('reservation_journal').insert` et vérifier le payload (`statut_avant`, `statut_apres`, `motif`, `auteur_id`). Petit chantier mais pas critique — le code est défensif (try/catch silencieux).
- **Triggers SQL pour les autres entités** : la même doctrine D8bis se posera quand on ajoutera des cycles ailleurs (paiements, adhésions). On aura sans doute un journal par entité (`adhesion_journal`, `transaction_journal`), même pattern.
- **Purge / RGPD** : un journal qui garde le `motif` peut contenir des données semi-personnelles (« annulée parce que le demandeur a oublié »). Politique de rétention à définir avec Lilou/Ben dans le chantier RGPD V2.
- **Migration à appliquer** : `20260527090000_reservation_journal.sql`. Le matin venu, `supabase db push` la rangera après les 9 autres en attente (la liste passe à 10).
