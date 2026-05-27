# Manifest — V2 Vague 3, Chantier V2.3.30 : Branchement notifications réseau

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-30-notifs-reseau`
**Base** : `main` (tip `f717480`, V2.3.29)

---

## Livré et fonctionnel

Branchement complet des 3 types de notifs réseau acté V2.3.25 dans les Server Actions V1 (réseau social chantier 7.5).

- [x] **`app/(public)/s-informer/reseau/actions.ts`** :
  - `commenter` : utilise `poserNotification` avec `type: 'reseau_post_commente'` au lieu de l'insert direct `type: 'autre'`. Garde `cibleId: postId` et `cibleTable: 'post_reseau'` pour le lien retour.
  - `soutenir` : ajoute une notif `type: 'reseau_post_soutenu'` quand on ajoute un soutien (pas quand on retire). Notification au·à la créateurice du post.
  - `envoyerMessage` : utilise `poserNotification` avec `type: 'reseau_message_recu'` au lieu de `type: 'dm'`. Garde le message tronqué à 140 caractères.
- [x] Tous les appels passent `auteurId` pour bénéficier de l'auto-déduplication (V2.3.25 : pas de notif si auteur = destinataire).

## Non livré (et pourquoi)

- [ ] **Notif sur le retrait de soutien** : pas posée (pas pertinente, c'est un défaut d'action).
- [ ] **Notif sur le suivi (`suivre`)** : pas posée dans ce chantier. À envisager : type `reseau_nouveau_suivi` (« X te suit maintenant »).
- [ ] **Notif modération (`retirerContenu`)** : pas posée. Quand un contenu est retiré par la modération, l'auteur·rice devrait recevoir `type: 'moderation_me_concerne'`. À ajouter dans un chantier modération.

## Décisions techniques prises

- **Réutilisation de `poserNotification` (V2.3.25)** plutôt que l'insert direct : centralise l'auto-déduplication + l'erreur logging. Pattern aligné avec le cycle D8 réservation V2.3.13-21.
- **Types V2 spécifiques** plutôt que `type: 'autre'` ou `type: 'dm'` du V1 : `reseau_post_commente`, `reseau_post_soutenu`, `reseau_message_recu`. Permet à un dashboard de stats par type de fonctionner correctement.
- **Garde du `try/catch` autour de la notif soutien** : la notif est secondaire au succès de l'insert reaction_reseau. Si la notif échoue, la réaction reste OK.

## Écarts V1→V2 appliqués

- **`type: 'dm'` → `type: 'reseau_message_recu'`** : la valeur V1 `'dm'` reste valide en base (la colonne `type` est text libre), mais on standardise les nouvelles insertions sur V2.
- **`type: 'autre'` → `type: 'reseau_post_commente'`** : pareil.

## Tests

- **Unitaires (Vitest)** : 38 fichiers, **413 tests verts** (inchangés).
- **Lint Biome** : 479 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.

## Notes pour les chantiers suivants

- **Notifs modération** : brancher dans `retirerContenu` (`type: 'moderation_me_concerne'`).
- **Notif suivi** : envisageable si le besoin se confirme.
- **Realtime** : envisager un subscription Supabase Realtime sur `notification` pour faire vivre le badge cloche sans refresh.
