# Manifest — V2 Vague 3, Chantier V2.3.25 : Cloche in-app + branchement notifs D8

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-25-notifications-cloche`
**Base** : `main` (tip `1e67f81`, V2.3.24 + CLAUDE.md)

---

## Livré et fonctionnel

Canal 1 du CDC V2 §7 acté 19/05 : cloche in-app universelle. La table V1 `notification` existait déjà (chantier 8.1) avec un schéma `destinataire_id` / `lue` / `lue_le` / `cible_id` / `cible_table` / `href` / `message`. Doctrine de greffe §0.3 appliquée : on RÉUTILISE plutôt qu'on remplace.

- [x] **`lib/notification.ts`** : helpers TS pour la cloche, alignés sur le schéma V1.
  - Type `TypeNotification` (15 valeurs : 8 du cycle D8, 3 réseau, 1 modération, 2 évolutif).
  - Interface `Notification` (camelCase), `PoserNotificationOptions`.
  - `poserNotification(options, auteurId?)` : fire-and-forget. Auto-déduplication minimale (n'insère pas si auteur = destinataire).
  - `listerNotifications(personneId, limite=50)` : trié desc par date.
  - `compterNotificationsNonLues(personneId)` : pour le badge cloche.
  - `marquerNotificationLue` et `marquerToutesNotificationsLues` (NB : les Server Actions V1 dans `app/(membre)/profil/notifications/actions.ts` existent aussi, on n'a PAS dupliqué — la page liste les réutilise).
- [x] **`app/actions/reservation.ts`** : branchement de `poserNotification` sur les 8 transitions D8 livrées (V2.3.13-21) :
  - création → propriétaire (`reservation_demande_recue`)
  - accepter/refuser/marquer réalisée → demandeur (3 types)
  - confirmer → propriétaire (`reservation_confirmee`)
  - annuler → propriétaire (`reservation_annulee`)
  - signaler litige (demandeur ou propriétaire) → l'autre partie (`reservation_litige_signale`)
  - arbitrage admin → les deux parties (`reservation_litige_arbitre`)
- [x] **`components/layout/HeaderCloche.tsx`** : Server Component, badge avec compteur non lues. Lien direct vers la page liste (pas de dropdown — philosophie « ne capte pas l'attention »). « 99+ » au-delà.
- [x] **`components/layout/Header.tsx`** : intègre la cloche entre `ThemeToggle` et `HeaderProfilMenu` quand session active.
- [x] **`app/(membre)/profil/notifications-recues/page.tsx`** : nouvelle page distincte de `/profil/notifications` (préférences V1 chantier 8.1). Liste 50 dernières notifs, bouton « tout marquer lu », clic sur une notif marque lue + suit le lien. Réutilise les Server Actions V1 `marquerNotificationLue` et `marquerToutesLues`.
- [x] **`app/(membre)/profil/NavOnglets.tsx`** : ajout onglet « Notifications » (`notifications-recues`) et renommage de l'existant en « Préférences notif ».

## Non livré (et pourquoi)

- [ ] **Canal 2 — messagerie interne (haute priorité)** : déjà géré par `message_reseau` V1 chantier 7.5. Pas dans ce chantier ; les DM ont leur propre UI dans `/s-informer/reseau/messages`.
- [ ] **Canal 3 — mail récap hebdo (mardi)** : demande Brevo branché + cron Cloudflare Worker. Préalable externe.
- [ ] **Canal 4 — newsletter (vendredi)** : pareil que canal 3.
- [ ] **Canal 5 — push** : opt-in via préférences (`push_active` déjà présent côté préférences V1) + service worker + clé VAPID. Préalable externe.
- [ ] **Types `info_groupe`/`autre`** : pas posés en pratique. Les actions concrètes qui les déclencheraient (annonce dans une commune, conv en GT) n'ont pas encore de Server Action côté V2.
- [ ] **Tests unitaires** : `poserNotification` mocké demanderait un mock Supabase complet. Non posés.
- [ ] **Lecture en temps réel** : pas de WebSocket Supabase Realtime. Le compteur s'actualise au prochain rendu de page. Acceptable selon la philosophie « pas urgent ».

## Décisions techniques prises

- **Réutilisation de la table V1** : la table `notification` chantier 8.1 a TOUS les champs nécessaires pour le canal 1. Créer une 2ᵉ table aurait été du sur-design contre la doctrine §0.3. Le `type` est libre (string), j'ai juste documenté les valeurs utilisées par V2 dans le type TS `TypeNotification`.
- **Page liste séparée de page préférences** : `/profil/notifications` reste la page préférences V1 (chantier 8.1). `/profil/notifications-recues` est la nouvelle. La cloche header pointe vers la nouvelle. NavOnglets liste les deux. Évite de toucher au V1 pour respecter le périmètre.
- **`cible_id` + `cible_table` au lieu de `metadata` jsonb** : c'est ce que le V1 propose. Suffisant pour notre besoin (référencer la `reservation` concernée).
- **Pas de migration** : la table V1 existe déjà. Aucune table créée, aucun champ ajouté.
- **Auto-déduplication minimale** : `poserNotification` n'insère pas si `auteurId === destinatairePersonneId`. Évite de notifier qqn de sa propre action (ex. si admin = demandeur).
- **Server Actions V1 réutilisées via import croisé** : la page liste importe `marquerNotificationLue` et `marquerToutesLues` depuis `app/(membre)/profil/notifications/actions.ts` (V1 chantier 8.1). Doctrine de greffe §0.3 stricte.

## Écarts V1→V2 appliqués

- **Aucun écart bloquant** : la table V1 conviait pile à l'usage V2 (les choix de schéma 8.1 sont compatibles avec ce que demande le CDC §7).
- **Petit écart UX** : `/profil/notifications` était présenté en V1 comme « la page de notifications » alors que c'est une page de préférences. V2 introduit la distinction nette (notifications reçues vs préférences). NavOnglets ajusté.

## Tests

- **Unitaires (Vitest)** : 38 fichiers, **413 tests verts** (inchangés).
- **Lint Biome** : 476 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **Canaux 3-5 (mail récap, newsletter, push)** : viendront avec leurs intégrations (Brevo branché pour mails, service worker + VAPID pour push). Le canal 1 livre déjà beaucoup d'utilité seul.
- **Notifs réseau social** (`reseau_message_recu`, `reseau_post_commente`, `reseau_post_soutenu`) : à brancher dans les Server Actions de `lib/reseau/requetes.ts` (V1 chantier 7.5). Pareil pour `moderation_me_concerne` côté admin.
- **Realtime** : éventuel chantier `useRealtimeNotifications` côté client si on veut un compteur dynamique. Optionnel.
- **Purge / RGPD** : politique de rétention à définir (90 jours par défaut ? ou indéfini ?). Hors scope.
