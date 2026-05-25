# Manifest — Chantier 7.5 : Réseau social (construit pendant la phase 13)

**Date de fin** : 2026-05-25
**Branche** : feature/phase-13-integration
**Durée approximative** : 1 session Claude Code
**Contexte** : Lilou/Ben a demandé de construire le réseau social AVANT la
décision A (membres de commune cliquables vers leur profil + messagerie). Le
chantier 7.5 était jusqu'ici un stub.

Implémente `docs/specs/01_ARCHITECTURE.md §4E` : flux sans publicité, algorithme
strictement transparent et hiérarchisé, messagerie interne, modération a
posteriori, encart financement.

## Livré et fonctionnel

### Données (migration 039 `20260525140000_reseau_social.sql`)
- [x] `relation_reseau` (suivi one-way ; ami·e = suivi mutuel calculé).
- [x] `post_reseau`, `commentaire_reseau` (modération a posteriori : statut
  publie/retire + retire_par/retire_le/raison_retrait).
- [x] `reaction_reseau` (soutien, une par personne et publication, toggle).
- [x] `message_reseau` (messagerie interne, lu/lu_le).
- [x] RLS sur toutes les tables (lecture publique des contenus publiés, écriture
  réservée à l'autrice, messages privés expéditeur/destinataire, modération).
- [x] Helpers SECURITY DEFINER respectant `preferences_visibilite` :
  `champ_reseau_visible`, `personne_affichage`, `est_ami_reseau`,
  `personne_id_par_numero`, et `membres_commune` (décision A).

### Flux et publications
- [x] `/s-informer/reseau` : flux hiérarchisé TRANSPARENT (mes publications →
  personnes suivies → reste, puis date), bannière expliquant l'ordre, encart
  financement, composer (création de post + Turnstile).
- [x] `CartePost` : auteur·ice (lien profil), texte, image, soutien (toggle
  optimiste), commentaires (chargés à la demande + ajout), suppression de sa
  propre publication. Pas d'autoplay, pas de captation d'attention.

### Profil réseau
- [x] `/s-informer/reseau/[numero]` (numéro public M+7 comme handle) : identité
  dans le respect de la visibilité, bio, compteurs abonné·es/suivi·es, badge
  ami·e, boutons Suivre et Envoyer un message, publications de la personne.

### Messagerie interne (DM)
- [x] `ModaleMessage` réutilisable (profil + liste des membres de commune).
- [x] `/s-informer/reseau/messages` (liste des conversations + non-lus) et
  `/s-informer/reseau/messages/[numero]` (fil + réponse, marquage lu).
- [x] Notification cloche type `dm` à la réception (canal primaire, spec §10).

### Modération a posteriori
- [x] `/admin/moderation/reseau` (onglet ajouté à la nav admin) : retrait des
  publications et commentaires avec motif, tracé dans `journal_admin`. Onglet de
  droit `reseau` (free text, déjà supporté par `est_moderateurice`).

### Décision A (membres de commune)
- [x] Sur la page d'une commune, liste des co-membres VISIBLE UNIQUEMENT entre
  membres (fonction `membres_commune`), **nom + prénom complets** (respect
  visibilité), nom **cliquable vers le profil réseau**, **bouton message**.
  Objectif : maximiser les interactions et l'usage du réseau social.

### Qualité
- [x] typecheck + lint (402 fichiers) verts. 300 tests Vitest verts (dont 10
  nouveaux : `tests/unit/reseau/validations.test.ts`).

## Déploiement sur le distant

- [ ] **Migration 039 à appliquer** sur la base distante (DDL + RLS + helpers,
  sans PII) :
  `npx tsx --env-file=.env.local scripts/appliquer-sql-distant.ts supabase/migrations/20260525140000_reseau_social.sql`.
  Sans elle, les pages réseau échouent à l'exécution (tables absentes) ; le code
  ne mocke pas ce cas (fonctionnalité nouvelle). À lancer après feu vert de
  Lilou/Ben.

## Choix techniques

- **Ami·e = suivi mutuel** (pas de cycle demande/acceptation en v1) : couvre
  « ami·es et personnes suivies » du flux de la spec.
- **Visibilité** : tout l'affichage d'identité passe par `personne_affichage`
  (SECURITY DEFINER) qui masque les champs selon `preferences_visibilite`
  (défaut `membres`). On ne lit jamais `personne` directement.
- **Numéro M+7 comme handle public** de profil (chantier 13.3-E), résolu par
  `personne_id_par_numero`.
- **Réaction** unique « soutien » (pas de taxonomie d'emojis inventée).

## Non livré / limites (v1)

- [ ] Tier 3 du flux (« contenus du site ») et tier 4 (« entraide ~5 % ») :
  l'ordre transparent porte sur les publications du réseau ; l'injection de
  contenus du site/entraide dans le flux reste à faire.
- [ ] Messagerie « temps réel » (websockets) : v1 en rechargement, pas de live.
- [ ] Hydratation des auteur·ices : un appel `personne_affichage` par auteur·ice
  distinct·e (acceptable pour un flux modeste ; à batcher si volume).
- [ ] Signalement par les utilisateur·ices (table `moderation_signal`) : la
  modération se fait depuis la console admin (liste des contenus récents).

## Notes pour la suite

- `lib/reseau/requetes.ts` centralise les lectures ; `nomAffiche` y est le
  helper unique de nom affiché (réutilisé par les membres de commune).
- Pour enrichir le flux avec les contenus du site, ajouter une couche
  d'agrégation au-dessus de `getFluxReseau` (sans casser la transparence).
