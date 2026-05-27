# Manifest — V2 Vague 3, Chantier V2.3.12 : message d'amorce envoyé dans la messagerie interne

**Date de fin** : 2026-05-27 (matin)
**Branche** : `feature/v2-3-12-message-amorce-reseau`
**Base** : `main` (tip `91db11a`, V2.3.11)

---

## Livré et fonctionnel

Tient la promesse UX du bouton « Demander une réservation » (V2.3.5) qui annonçait « un message d'amorce sera envoyé via la messagerie interne ». Avant V2.3.12, le message était stocké dans `reservation.message_amorce` mais **rien n'arrivait dans la messagerie** côté propriétaire.

- [x] **`creerReservationAction`** (`app/actions/reservation.ts`) enrichi : après une création de réservation réussie, on insère AUSSI un `message_reseau` (DM V1 chantier 7.5) de la personne demandeuse vers le créateur de l'offre, avec le `messageAmorce` comme texte.
- [x] **Helper interne `envoyerMessageAmorceInterne`** : fire-and-forget (try/catch). Si l'envoi du message échoue (par exemple en dev sans réseau social actif), la réservation reste créée et l'utilisateurice peut renvoyer le message manuellement depuis la messagerie. Cohérent avec la doctrine « pas d'effet de cascade qui annule une opération principale ».
- [x] **Microcopy ajusté** : `app/(public)/s-entraider/offre/[slug]/page.tsx` ne dit plus « chantier réseau social » au futur — c'est désormais effectif.

## Livré partiellement

- [ ] **Lien retour vers la réservation depuis le DM** : le message arrive comme un texte brut chez le propriétaire. Pas de bouton « voir la réservation » côté propriétaire (qui n'existe pas en V1 — V2.3.13 à venir : dashboard propriétaire). Pour l'instant, le propriétaire répond simplement au DM et coordonne avec le demandeur en messagerie.
- [ ] **Notification cloche** quand le DM arrive : le module `notification` V1 (chantier 8.1) gère probablement les notifs DM. À vérifier que le pipeline déclenche bien une notif à chaque insertion `message_reseau`. Si non, à brancher.

## Non livré (et pourquoi)

- [ ] **Lien permanent message ↔ réservation** : pas de FK SQL entre `message_reseau` et `reservation`. On accepte le découplage pour V2.3.12 — la coordination se fait par le contenu du message. Si on veut un lien fort, ajouter une colonne `reservation_id` nullable sur `message_reseau` dans un chantier dédié.
- [ ] **Idempotence stricte** : si la Server Action est appelée 2 fois (retry réseau), on peut avoir 2 messages identiques. Acceptable car la table `reservation` a un index unique partiel qui empêchera la 2e réservation, donc le 2e message ne sera pas envoyé.

## Décisions techniques prises

- **Fire-and-forget** : `try/catch` avec `console.warn`. La réservation est créée même si le DM échoue. Cohérent avec la philosophie : une dépendance externe ne doit pas faire échouer l'opération principale.
- **Pas de FK entre `message_reseau` et `reservation`** : le découplage permet d'éviter une migration et facilite un éventuel ré-envoi manuel. Le texte du DM contient déjà toutes les infos.
- **Microcopy retiré** : « chantier réseau social » devient une mention obsolète, à retirer maintenant que la promesse est tenue.

## Écarts V1→V2 appliqués

- Aucun écart. C'est une finition de V2.3.5 qui complète la boucle UX.

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (inchangés).
- **Lint Biome** : 459 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **V2.3.13 « Dashboard propriétaire d'offre »** : page qui liste les réservations REÇUES sur les offres dont la personne est créatrice, avec actions accepter/refuser/marquer réalisée (helper `changerStatutReservation` déjà disponible). Demande aussi de filtrer côté Server Action pour vérifier que la personne est bien propriétaire de l'offre référencée.
- **Notifications email automatiques** : « X a demandé à réserver ton offre » via Brevo. Demande de coordonner avec `lib/email/` (V1 chantier 8.1) + le profil notif du destinataire.
- **Lien d'action dans le DM** : un préfixe en début de message qui pointe vers `/profil/demandes-reservations` (V2.3.13 à venir) pour que le propriétaire accède directement à la liste.
