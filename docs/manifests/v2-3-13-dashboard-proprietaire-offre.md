# Manifest — V2 Vague 3, Chantier V2.3.13 : Dashboard propriétaire d'offre (demandes reçues)

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-13-dashboard-proprietaire-offre`
**Base** : `main` (tip `fe96dd0`, V2.3.12)

---

## Livré et fonctionnel

Côté symétrique à V2.3.9 (« Mes réservations » côté demandeur). Le·la créateur·ice d'une offre voit désormais les demandes reçues et peut accepter / refuser / marquer réalisée selon la machine à états D8.

- [x] **`lib/reservation.ts` — `listerReservationsRecuesParProprietaire(personneId)`** : FK polymorphe gérée applicativement. 3 requêtes parallèles pour ramasser les ids des offres possédées (`offre_entraide.createurice_id`, `service_sel.createurice_id`, `location_mutualisee.organisateur_personne_id`), puis jusqu'à 3 requêtes sur `reservation` pour matcher (`offre_type` filtré par les types possédés, `offre_id` `IN ids`). Concaténation et tri décroissant côté TS.
- [x] **`app/actions/reservation.ts`** : 3 Server Actions
  - `accepterReservationAction({reservationId, motif?, cheminRevalidation?})`
  - `refuserReservationAction({reservationId, motif?, cheminRevalidation?})`
  - `marquerReservationRealiseeAction({reservationId, motif?, cheminRevalidation?})`
  Vérifications : session active, propriétaire de l'offre (recharge `reservation.offre_type/offre_id`, recharge l'offre, compare `createurice_id`/`organisateur_personne_id` au session.userId), transition autorisée par `transitionAutorisee()` (sinon message explicite « Transition X→Y non autorisée par la machine à états D8 »). En cas de succès, `changerStatutReservation()` (V2.2.2) puis `revalidatePath`.
- [x] **`components/reservation/BoutonsProprietaireReservation.tsx`** : composant client conditionné par le statut courant.
  - `proposee` → boutons « Accepter » (1 clic) + « Refuser » (2 clics, confirmation inline avec encadré danger).
  - `acceptee` → bouton « Marquer comme réalisée » (1 clic).
  - autres statuts (`refusee`, `realisee`, `confirmee`, `annulee`, `litige`) → rien (terminaux ou en attente d'action du demandeur).
- [x] **`app/(membre)/profil/demandes-reservations/page.tsx`** : page Server Component qui liste les demandes reçues, affichage cartes (type d'offre + statut en badges, titre lié vers la page de l'offre via `chargerTitresOffres()` V2.3.9, créneau formaté FR, motif éventuel, message d'amorce dépliable, boutons d'action).
- [x] **`app/(membre)/profil/NavOnglets.tsx`** : onglet « Demandes reçues » ajouté, et renommage « Réservations » → « Mes réservations » pour la distinction.

## Non livré (et pourquoi)

- [ ] **Détail du demandeur** : on n'affiche pas le nom du demandeur (juste « voir dans la messagerie »). Demande une jointure `personne` qui implique la RLS V1 sur les visibilités réseau. À ajouter dans un chantier dédié si Lilou/Ben veut afficher le prénom + lien profil quand la visibilité l'autorise.
- [ ] **Notifications** : le propriétaire ne reçoit pas de notif quand une demande arrive (la V2.3.12 a déjà branché le DM `message_reseau` qui sert d'amorce — c'est la notif minimale). À ajouter quand la table `notification` V2 sera là.
- [ ] **Compteur badge sur l'onglet** : « Demandes reçues (3) » avec le nombre de `proposee` en attente. Demande de poser un compteur léger dans la layout. Au prochain chantier UX si besoin.
- [ ] **Filtres / tri** : la liste est triée par date décroissante uniquement. Pas de filtre par statut ou type d'offre. À ajouter si la liste devient longue en pratique.

## Décisions techniques prises

- **Symétrie helpers demandeur/propriétaire** : `listerReservationsDuDemandeur` filtre sur `demandeur_personne_id` (1 colonne, 1 requête). `listerReservationsRecuesParProprietaire` doit faire un join logique côté TS via la FK polymorphe (`offre_type, offre_id`) parce qu'il n'y a pas de colonne `proprietaire_offre_id` sur `reservation` (cohérent : un objet réservable peut changer de main, le propriétaire courant se relit à l'offre). 6 requêtes max au lieu d'une — acceptable parce que les ids sont chargés une fois puis le `IN` est efficace.
- **Vérification de la propriété SERVEUR à chaque action** : même si la page ne propose pas les boutons quand on n'est pas propriétaire, le Server Action recharge `reservation` puis l'offre puis compare le créateur au `session.userId`. RLS Supabase reste la 2e ligne (mais la table `reservation` autorise la lecture aux deux parties).
- **`transitionAutorisee()` re-vérifiée côté serveur** : V2.2.2 a déjà la machine à états D8 (`proposee` → `acceptee|refusee` ; `acceptee` → `realisee|annulee` ; `realisee` → `confirmee|litige` ; etc.). Le helper la consulte avant d'appeler `changerStatutReservation` ; message d'erreur explicite si une transition illégale est tentée.
- **UX 2 clics pour refus, 1 clic pour acceptation/réalisation** : aligné avec V2.3.11 (`BoutonAnnulerReservation`) qui faisait pareil pour l'annulation. Le refus est destructif (déçoit le demandeur), donc on demande une confirmation. L'acceptation n'est pas destructive.
- **Renommage « Réservations » → « Mes réservations »** dans la nav profil pour distinguer du nouvel onglet « Demandes reçues ». Aucun impact route (slug `reservations` inchangé).

## Écarts V1→V2 appliqués

- **Nouvelle page V2 sans pendant V1** : la V1 n'avait pas de réservation transversale (V2.2.2), donc pas de dashboard propriétaire. Greffe additive pure.

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (inchangés ; les transitions D8 sont déjà couvertes par les tests V2.2.2).
- **Lint Biome** : 461 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **Litige côté propriétaire** : la machine à états D8 autorise `realisee → litige`. À l'usage on découvrira sans doute qu'il faut un bouton « Signaler un litige » côté propriétaire AUSSI (pas seulement côté demandeur via V2.3.11 si on l'ajoute). Geler la décision tant que la modération réseau (V1 chantier 7.5) n'a pas absorbé ce flux.
- **Affichage prénom du demandeur** : envisager un helper `nomAffichageRespectantVisibilite(demandeurId, observateurId, contexte='reservation')` qui retourne `{prenom?, lienProfil?}` selon la visibilité réseau de la personne. Cohérent avec la doctrine V1 « numéro M+7 par défaut, prénom seulement si la personne l'autorise ». Branchable ici, sur la messagerie, et sur la fiche commune.
- **Notif quand `proposee` arrive** : pendant le chantier notifications V2, brancher un trigger ou un appel applicatif depuis `creerReservationAction` pour poser une notif au propriétaire (titre « Nouvelle demande sur ton offre [titre] »).
- **Pagination** : si la liste dépasse ~50 entrées, ajouter une pagination basique. Le helper retourne aujourd'hui tout d'un coup.
