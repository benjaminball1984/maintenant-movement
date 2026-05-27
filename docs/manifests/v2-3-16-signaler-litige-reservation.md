# Manifest — V2 Vague 3, Chantier V2.3.16 : Bouton « Signaler un litige » côté demandeur

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-16-signaler-litige-reservation`
**Base** : `main` (tip `d5ca24f`, V2.3.15)

---

## Livré et fonctionnel

Ferme la dernière branche de la machine à états D8 côté demandeur : si une réservation marquée « réalisée » par le propriétaire ne correspond pas à ce qui s'est passé (prestation non délivrée, créneau non respecté, désaccord), le demandeur peut basculer la réservation en statut `litige` pour arbitrage admin.

- [x] **`app/actions/reservation.ts` — `signalerLitigeReservationAction({reservationId, motif, cheminRevalidation?})`** : Server Action. Vérifie session active, demandeur (FK `reservation.demandeur_personne_id`), transition autorisée par D8 (`realisee → litige` ou `acceptee → litige`). Motif obligatoire entre 10 et 1000 caractères (validé applicativement). Appelle `changerStatutReservation` avec `auteurId: session.userId` (journal D8bis automatique via V2.3.15). `revalidatePath` si fourni.
- [x] **`components/reservation/BoutonSignalerLitigeReservation.tsx`** : composant client en 2 étapes.
  - Étape 1 : bouton ghost « Signaler un litige » avec icône AlertTriangle.
  - Étape 2 : encadré danger avec textarea (compteur de caractères, validation visuelle), bouton « Confirmer le signalement » (désactivé tant que `motif.trim().length < 10`), bouton « Annuler ». Erreur serveur affichée inline.
- [x] **`app/(membre)/profil/reservations/page.tsx`** : branche le bouton conditionnellement (`statut === 'realisee' && transitionAutorisee('litige')`). Affiché entre Confirmer et Annuler (3 boutons mutuellement exclusifs pour le statut `realisee` en réalité — seul Confirmer + Litige peuvent coexister).

## Non livré (et pourquoi)

- [ ] **Table `litige` dédiée** : pas créée. Le statut `litige` sur `reservation` suffit pour le MVP — l'arbitrage est une responsabilité admin qui demande un workflow dédié (file modérateurs, décision, contre-arguments, notification aux parties). À traiter dans un chantier modération de litige V2 quand l'arbitrage UX sera défini.
- [ ] **Notif au propriétaire** : pas envoyée quand le demandeur déclenche le litige. Bug pour le propriétaire qui découvrira son statut « litige » sans contexte. À brancher dès que la table `notification` V2 sera là. En attendant : le journal D8bis (V2.3.15) montre la transition + motif côté propriétaire dans `/profil/demandes-reservations`.
- [ ] **Litige côté propriétaire** : la machine à états D8 autorise aussi `acceptee → litige` (si le demandeur ne se présente pas, par exemple). On expose seulement `realisee → litige` côté demandeur pour l'instant. Si le besoin se confirme côté propriétaire, ajouter un bouton symétrique dans `BoutonsProprietaireReservation`.
- [ ] **Arbitrage admin** : aucune UI admin n'affiche les réservations en litige. À ajouter (`/admin/moderation/reservations?statut=litige`).

## Décisions techniques prises

- **Pas de table `litige` séparée pour le MVP** : la machine à états D8 V2.2.2 traite déjà `litige` comme un statut terminal de `reservation`. Le journal D8bis V2.3.15 stocke le motif. Créer une table séparée maintenant serait du sur-design — on attendra le chantier modération qui définira la structure exacte (décision admin, contre-arguments, notif aux deux parties).
- **Motif obligatoire avec validation applicative** : 10 caractères minimum (suffisant pour « rien reçu » mais bloque les soumissions vides), 1000 maximum (sain ; au-delà, le demandeur devrait écrire au support). Validation côté client (bouton désactivé) ET serveur (Server Action revérifie après `trim()`).
- **UX 2 étapes avec encadré danger** : aligné avec `BoutonsProprietaireReservation` (refus avec confirmation 2-clic), mais avec textarea car le motif est obligatoire. L'encadré danger signale la gravité (action sociale, alerte de la modération).
- **Action irréversible** : une fois en `litige`, la machine à états D8 ne propose plus aucune transition (statut terminal). Seuls les admins peuvent débloquer (cf. `reservation_update_admin`). Le bouton disparaît au refresh.
- **Pas branché côté `/profil/demandes-reservations`** : côté propriétaire on n'expose pas le bouton pour l'instant — le demandeur est celui qui constate le problème dans la grande majorité des cas (la prestation lui était destinée).

## Écarts V1→V2 appliqués

- **Greffe additive pure** : pas de nouvelle table, pas de migration. Juste un Server Action et un composant client. Le statut `litige` existait déjà dans V2.2.2 mais n'avait aucun chemin pour y entrer côté UI.

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (inchangés — la transition `realisee → litige` est déjà testée dans `amorce-transitions.test.ts` V2.2.2).
- **Lint Biome** : 464 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **Chantier modération de litige** : définir le workflow d'arbitrage (qui décide, dans quel délai, avec quels critères, notifications aux deux parties, résolution → annulation/maintien). Ajouter `decision_litige`, `decide_par`, `decide_le` à `reservation` OU créer la table `litige` à ce moment. La doctrine V2 préfère la 2e option (greffe séparée).
- **Bouton litige côté propriétaire** : à ajouter dans `BoutonsProprietaireReservation` quand le besoin se confirme — symétrique avec motif obligatoire. La machine à états D8 autorise déjà `acceptee → litige`.
- **Notif** : prioritaire au moment du chantier modération. Le bascule en litige doit alerter le propriétaire ET les modérateurs.
- **Cycle D8 désormais navigable de bout en bout** :
  - création (V2.2.2) → demandeur
  - accepter/refuser (V2.3.13) → propriétaire
  - marquer réalisée (V2.3.13) → propriétaire
  - confirmer (V2.3.14) → demandeur
  - annuler (V2.3.11/14) → demandeur
  - **signaler litige (V2.3.16)** → demandeur
  - journal D8bis (V2.3.15) → observable des deux côtés
  Reste seulement la modération de litige côté admin.
