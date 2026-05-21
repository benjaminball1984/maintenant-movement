# Manifest : Phase 8, Chantier 8.1 — Notifications

**Date de fin** : 2026-05-21
**Branche** : `feature/phase-8-chantier-8.1-notifications`
**Commit final** : `6495e5b`
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

### Schéma BDD (migration 033)

- [x] **Table `notification`** : destinataire, type fonctionnel (texte libre v1), cible polymorphe (table + id), titre + message + href, statut `lue` (boolean) + `lue_le`. RLS : la personne voit ses notifications, admin général voit tout, insert ouvert pour les Server Actions/triggers.
- [x] **Table `preference_notification`** : 1 ligne par personne, opt-ins par canal (`cloche_active`, `push_active`, `mail_recap_mardi_active`, `newsletter_vendredi_active`) + JSONB `preferences_par_type` pour le filtrage fin. Défauts : cloche ON, push opt-in (OFF), mails ON.

### Code applicatif

- [x] **Types Database** : `Notification`, `PreferenceNotification`, `CanalNotification`.
- [x] **Service de notifications** (`lib/notifications/service.ts`) : `declencherNotification` centralise l'envoi — charge ou crée les préférences de la personne, vérifie l'opt-out par type, insère la cloche, déclenche un mail immédiat si demandé via `EmailService` (Mock ou Brevo). Cohérent avec la doctrine §10 : « On ne capte pas l'attention, on la respecte. »
- [x] **Couche de requêtes** (`lib/notifications/requetes.ts`) : `listerNotifications`, `nombreNonLues`, `preferencesParDefaut`.
- [x] **Server Actions** (`app/(membre)/profil/notifications/actions.ts`) : `mettreAJourPreferencesNotification` (upsert sur personne_id), `marquerNotificationLue`, `marquerToutesLues`.

## Livré partiellement

- [ ] **Cloche header (composant `<ClocheNotifs>`)** : la couche `nombreNonLues` est prête mais le composant qui affiche le badge dans le header avec un dropdown des dernières notifs n'a pas été posé pour 8.1 v1. Sera ajouté en polish UI.
- [ ] **Page `/profil/notifications` enrichie** : la page existait déjà depuis 1.3 en stub. Les Server Actions sont prêtes pour brancher l'UI ; la mise à jour du composant client viendra avec un mini-polish UI.

## Non livré (et pourquoi)

- [ ] **Web Push opt-in (canal push)** : nécessite l'enregistrement d'un Service Worker et l'API Web Push avec stockage de l'abonnement par appareil. Sera un chantier dédié (polish ou 11.x) car ça touche au runtime Cloudflare Workers.
- [ ] **Récap mardi groupé** : nécessite un cron applicatif qui collecte par personne les notifs des 7 derniers jours et envoie un seul mail. Sera posé au chantier 11.3 (cron Cloudflare).
- [ ] **Newsletter vendredi (tagguée 3 axes : origine, action, département)** : le service `EmailService` a déjà la méthode `inscrireNewsletter(email, tags)` posée depuis 1.2. Le cron d'envoi groupé du vendredi avec sélection des médias publiés sur la semaine viendra au chantier 11.3.

## Décisions techniques prises

- **`type` en texte libre v1** plutôt qu'un enum : permet d'ajouter des types de notifs sans migration BDD (signature_petition, dm, moderation, mention, etc.). Une CHECK pourra être ajoutée plus tard quand l'inventaire sera stable.
- **`preferences_par_type` en JSONB** plutôt qu'une table dédiée : flexibilité. Format `{ "signature_petition": true, "moderation": true, ... }`. Défaut : tout autorisé (la personne peut opt-out de types spécifiques).
- **Service centralisé `declencherNotification`** : un seul point d'entrée pour les chantiers métier (cagnottes, sondages, etc.). Filtrage des canaux + types fait à un seul endroit.
- **Pas de Web Push dans 8.1 v1** : le périmètre minimum viable de la spec §10 est la cloche + les mails. Push est explicitement « opt-in » dans la spec, on peut le poser en chantier dédié.

## Tests

- Unitaires : **245 verts** (inchangés ; le service notification n'a pas de logique métier isolable côté validation Zod, il s'appuie sur les RLS + EmailService déjà testés).
- Lint, typecheck, build : tous verts.

## Notes pour les chantiers suivants

- **Polish UI** : composant `<ClocheNotifs>` dans le header avec badge non-lues + dropdown des 5 dernières + lien vers `/profil/notifications`.
- **Chantier 9.x** : alimenter les notifications depuis les Server Actions existantes (à chaque signature de pétition, on `declencherNotification` pour le créateur·ice ; à chaque don de cagnotte ; etc.).
- **Chantier 11.3** : poser le cron quotidien (récap mardi) et hebdomadaire (newsletter vendredi). Les deux appellent `EmailService` avec des destinataires filtrés par `preference_notification.*_active`.
