# Manifest — V2 Vague 2, Chantier V2.2.2 : Réservation (composant transversal D8)

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-2-2-reservation`
**Base** : `main` après V2.2.1 (tip `7106fd0`, FilDeGroupe fermé)

---

## Livré et fonctionnel

- [x] **Migration `supabase/migrations/20260527040000_reservation.sql`** : table `reservation` avec FK polymorphe `(offre_type, offre_id)` (liste fermée CHECK pour le type : `transport_covoiturage`, `hebergement`, `pret`, `service_sel`, `location_mutualisee`, `autre`), `demandeur_personne_id` FK `personne` ON DELETE CASCADE, créneau (`creneau_debut` non nul + `creneau_fin` nullable pour événements ponctuels) avec CHECK de cohérence (`fin >= debut` ou null), `quantite` int default 1 (CHECK > 0), `message_amorce` text obligatoire (CHECK longueur 1-2000), `statut` text default `proposee` (CHECK liste fermée 7 états D8), `motif_decision` text nullable, `transaction_id` uuid nullable (pas de FK SQL stricte tant que D7 V2 pas posée). 3 index actifs (`(offre_type, offre_id, created_at)`, `(demandeur_personne_id, created_at)`, partiel `(statut, creneau_debut)` sur états vivants). Trigger `updated_at`. 4 policies RLS (lecture demandeur + admin + modérateur autres-moyens, insertion self-only authentifié, update demandeur pour annulation, update admin, delete admin uniquement). NON appliquée au distant.
- [x] **`lib/reservation-amorce.ts`** : helper pur `genererMessageAmorce(contexte)` qui pré-remplit un message respectueux selon le type d'offre, le titre, le créneau (formaté `Intl.DateTimeFormat` français, distingue mêmes jours / jours différents), la quantité (singulier/pluriel adaptés au type), le prénom du demandeur, une note libre optionnelle. Sortie bornée à 2000 caractères pour respecter la contrainte SQL. Testable sans Supabase. Type `OffreTypeReservation` exporté.
- [x] **`lib/reservation.ts`** : `creerReservation`, `changerStatutReservation`, `listerReservationsParOffre`, `listerReservationsDuDemandeur` + helper pur `transitionAutorisee(actuel, cible)` qui implémente la machine à états D8 :
  - `proposee` → `acceptee` / `refusee` / `annulee`
  - `acceptee` → `realisee` / `annulee` / `litige`
  - `realisee` → `confirmee` / `litige`
  - `refusee`, `annulee`, `confirmee`, `litige` : terminaux
- [x] **`types/database.ts` enrichi** : ajout manuel du type `reservation` (Row/Insert/Update + Relationships vers `personne`). Pas de régénération CLI (déjà documenté en §11 CLAUDE.md).
- [x] **Tests unitaires** `tests/unit/reservation/amorce-transitions.test.ts` (9 tests) : 5 sur `genererMessageAmorce` (covoit quantité 1, hébergement pluriel, note libre intégrée, borne 2000 caractères avec note longue, prénom vide), 4 sur `transitionAutorisee` (transitions valides depuis chaque état non-terminal + non-transitabilité des terminaux).

## Livré partiellement

- [ ] **Intégration applicative dans les sous-espaces** (transport covoit', hébergement, prêt SEL, location mutualisée, marché solidaire) : le helper TS `creerReservation` et la migration sont prêts, mais aucune page V1 n'a encore de bouton « Réserver ». L'intégration au cas par cas se fait en VAGUE 3 quand les sous-espaces seront enrichis selon les fiches V2. À ce moment-là, chaque sous-espace pose sa propre Server Action qui : (a) vérifie l'existence et la disponibilité de l'offre, (b) vérifie que l'appelant n'est pas le propriétaire, (c) appelle `creerReservation` puis poste le `message_amorce` dans la messagerie interne.

## Non livré (et pourquoi)

- [ ] **Migration appliquée au distant** : convention V2.2 (à faire au matin avec `supabase db push`).
- [ ] **UI de gestion des réservations côté propriétaire** (accepter / refuser / clore) : hors périmètre du composant transversal. Sera intégré dans les pages de chaque sous-espace en VAGUE 3 (l'UI doit s'inscrire dans le flux propre à chaque type d'offre).
- [ ] **Notifications email d'amorce / acceptation / refus** : le `message_amorce` est posté dans la messagerie interne ; l'envoi email transactionnel suivra la doctrine commune du mouvement (Brevo en prod, mock en dev) au moment de l'intégration applicative.
- [ ] **Lien `transaction_id` vers l'entité Transaction V2** : champ posé en `uuid` nullable sans FK SQL, car l'entité `Transaction` V2 (D7) n'est pas encore matérialisée en table. À renforcer en FK quand la table existera (greffe additive cohérente).

## Écarts V1→V2 appliqués

- **Nouveau composant transversal V2** sans équivalent V1 (la V1 n'a pas de table de réservation : `offre_entraide` propose, mais l'engagement se prend par message libre). Greffe additive pure, aucune table V1 modifiée ou supprimée.
- **FK polymorphe `(offre_type, offre_id)`** plutôt qu'une vraie FK SQL : choix cohérent avec V2.2.1 (FilDeGroupe utilise `(espace_type, espace_id)` pour la même raison). L'intégrité référentielle est portée par la Server Action de chaque sous-espace (vérification de l'existence de l'offre avant insert). Documenté dans la migration SQL et dans `lib/reservation.ts`.
- **Vocabulaire** : en V2 D8 le champ s'appelle `demandeur_profil_id` (terme V2 « Profil ») ; en V1 la table de personnes s'appelle `personne` (D1 V1). Greffe : on conserve `personne` côté SQL et on nomme le champ `demandeur_personne_id` (cohérent avec les autres FK de la V1, ex. `auteur_id` → `personne` dans `fil_groupe_message`). Le jour où le tronc V2 « Profil » émergera, l'alias se fera proprement.

## Tests

- **Unitaires** : 33 fichiers, **352 tests verts** (+9 nouveaux).
- **Lint Biome** : 434 fichiers, 0 issue.
- **Typecheck** : 0 erreur.

## Notes pour les chantiers suivants

- L'intégration dans le sous-espace **transport (covoiturage)** sera probablement le premier candidat en VAGUE 3 (cas d'usage le plus mature, déjà ébauché en V1 via `offre_entraide` type transport).
- Garder en tête que les sous-espaces qui intègrent `reservation` doivent **également** poser le `message_amorce` généré dans `message_reseau` (DM individuel) au moment du `creerReservation`, pour que la conversation s'amorce dans la messagerie interne comme prévu §14.
- La machine à états est volontairement liberale (proposee → annulee directement par le demandeur). Les Server Actions de sous-espaces peuvent durcir (ex. interdire l'annulation après acceptation pour le covoit' si trop proche du départ) sans toucher au helper transverse.
