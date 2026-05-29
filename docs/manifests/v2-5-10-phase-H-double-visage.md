# Manifest — Chantier V2.5.10 : Master Plan V2.6 Phase H (double visage réseau / espace)

**Date de fin** : 2026-05-30 (nuit du 29 au 30)
**Branche** : `main`
**Commit final** : (à renseigner après commit)
**Durée approximative** : ~30 min.

## Objectif Master Plan

Phase H : « À la création d'une page ou d'un groupe sur le réseau social, générer automatiquement son espace d'action lié, vide et personnalisable, doté de toute la boîte à outils. Permettre de basculer de l'un à l'autre. Permettre aux gens de rejoindre l'un, l'autre, ou les deux. »

## Décision d'architecture (fondamentale)

Le réseau social V1 (chantier 7.5) est exclusivement centré sur les PERSONNES (`post_reseau.auteurice_id`, `relation_reseau.suiveur_id/suivi_id`, `message_reseau`). Il n'existe AUCUNE notion de « page » ou « groupe » côté réseau.

En revanche, le projet a déjà 6 types d'espaces collectifs (commune, fédération, confédération, GT thématique, groupe d'entraide local, campagne), chacun avec son fil de discussion interne (`FilDeGroupe`), ses membres, son admin éditable CMS.

Plutôt que de créer un nouveau concept « page réseau » qui dupliquerait ces espaces, **on inverse la logique** : on permet aux **espaces existants de publier dans le flux du réseau social**. Cela réalise concrètement le « double visage » du Master Plan : la commune EST à la fois un espace d'action ET une entité postante dans le réseau, en gardant un seul modèle de données.

C'est strictement conforme à la doctrine de greffe §0.3 : aucune table existante touchée pour son schéma principal, on AJOUTE deux colonnes nullable à `post_reseau`.

## Livré

- [x] **Migration `20260530100000_post_reseau_espace.sql`** : ajoute 2 colonnes nullable à `post_reseau` (`espace_type text`, `espace_id uuid`), avec 2 CHECK constraints (liste fermée + cohérence des deux). Index secondaire `post_reseau_espace_idx` partiel sur (`espace_type, espace_id, created_at DESC`) pour la requête « tous les posts d'un espace donné ».
- [x] **Types `types/database.ts`** : `post_reseau.Row/Insert/Update` enrichis manuellement avec les 2 nouvelles colonnes.
- [x] **Helper `lib/reseau/espace.ts`** :
  - Type `TypeEspacePostable` (union des 6 types).
  - Fonction `estMembreActifEspace(type, id, personneId)` : vérifie l'appartenance via la bonne table d'appartenance, switch explicite pour 4 types supportés (commune, gt_thematique, groupe_entraide_local, campagne). Fédération et confédération renvoient `false` (pas de table d'appartenance personne ↔ ces espaces en V1 ; à restreindre aux admins de plateforme côté Server Action).
  - Fonction `creerPostEspace({espaceType, espaceId, auteuriceId, texte})` : INSERT polymorphe via service_role.
  - Helper `cheminPublicEspace(type, slug)` : URL canonique de la page détail de chaque type d'espace.
  - Interface `AttributionEspace` : informations nécessaires à l'affichage d'un post publié au nom d'un espace.
- [x] **Seeding démo enrichi** : `scripts/seed-demo.ts > seedPostsEspaces()` crée 6 publications au nom des 6 communes démo (« [DÉMO espace] [texte] »). Idempotent. Ces 6 posts apparaissent maintenant dans le flux global du réseau social.
- [x] **Typecheck** vert, **lint** propre.

## Non livré (et pourquoi)

- [ ] **Affichage du badge espace dans `CartePost`** : pour cette nuit, les 6 posts au nom de communes apparaissent dans le flux mais sont affichés comme des posts classiques (avec l'auteur·rice personne, sans badge « publié par [Commune] »). Pour faire le badge :
  1. Étendre `PostAffiche` (`lib/reseau/requetes.ts`) avec un champ optionnel `espacePublieur?: AttributionEspace | null`.
  2. Adapter `getFluxReseau` pour faire un join et ramener nom + slug + image_url de l'espace.
  3. Adapter `CartePost.tsx` : si `espacePublieur` présent, afficher l'avatar/nom de l'espace en tête (cliquable vers la page espace) avec « publié par [Auteurice] » en sous-titre fin.
  C'est ~30-45 min de travail propre. **À programmer en V2.5.10.a.**
- [ ] **Server Action `publierAuNomDeLEspaceAction`** : permettrait à un membre d'un espace (vérifié via `estMembreActifEspace`) de publier au nom de l'espace depuis l'UI. Pour cette nuit, seul le script de seeding peut créer ces posts. À programmer en V2.5.10.b.
- [ ] **Composer côté page de l'espace** : sur `/agir/communes/[slug]`, ajouter un mini formulaire `<ComposerEspace>` qui appelle la Server Action ci-dessus. Visible uniquement aux membres actif·ves de l'espace. ~15 min.
- [ ] **Fil propre de l'espace dans le réseau** : section sur la page espace qui affiche les posts publiés au nom de cet espace (utilise l'index `post_reseau_espace_idx`). ~15 min.
- [ ] **Génération automatique d'un espace d'action à la création d'une page sociale** : le Master Plan §H mentionne « générer automatiquement ». Vu qu'il n'y a pas de notion de « page sociale » en V1 (juste des personnes qui publient), cette mécanique « à la création » est inversée : c'est plutôt « activer le double visage » sur les espaces existants. La création réelle d'un espace + sa publication automatique de bienvenue est un raffinement secondaire.
- [ ] **Notion de « suivre un espace »** : symétrique de `relation_reseau` (personne suit personne), il faudrait `abonnement_espace_reseau(personne_id, espace_type, espace_id)` pour que les abonnés voient les posts de l'espace dans leur palier `suivi·e`. Pour cette nuit, les posts d'espaces apparaissent dans le palier 2 (reste) du flux transparent. À considérer pour V2.5.10.c.

## Décisions techniques

- **Greffe additive maximale** : aucune table existante refactorée, aucune colonne renommée, aucune RLS modifiée. Les 2 nouvelles colonnes de `post_reseau` sont nullable, donc 100 % rétro-compatibles.
- **`auteurice_id` reste obligatoire** même pour les posts d'espace : pour la traçabilité (modération, anti-spam) et la transparence (« qui dans cet espace a effectivement publié ça »).
- **Fédération/confédération non traitées** côté `estMembreActifEspace` : `appartenance_federation` lie commune ↔ federation (pas personne ↔ federation), donc la vérification d'appartenance personne ↔ fédération nécessite un join indirect non trivial. Reportée à un chantier dédié si Lilou/Ben en a besoin.
- **Posts d'espace marqués « [DÉMO espace] » dans le seeding** : visible à l'œil nu pour distinguer en démo, conformément à la règle de non-invention §3 (placeholders ostensibles).

## Tests

- **941 tests verts** (inchangé).
- **Typecheck** vert, **lint** propre.
- **Test fonctionnel** : seeding réussi (6 posts au nom de communes créés). Vérification visuelle reportée au matin (Lilou/Ben).

## Notes pour les chantiers suivants

- **V2.5.10.a** : `<CartePost>` enrichie avec badge espace + lien cliquable. Probablement le plus visuel et le plus rapide à faire (~30 min).
- **V2.5.10.b** : Server Action + composer côté page de l'espace pour que les membres puissent publier au nom de l'espace depuis l'UI. (~30 min).
- **V2.5.10.c** : Abonnement personne ↔ espace pour que le palier 1 du flux transparent (suivi·es) inclue les espaces suivis.
- **Cas d'usage validé** : au matin, en allant sur `/s-informer/reseau`, Lilou/Ben verra les 6 nouveaux posts « [DÉMO espace] » qui parlent au nom des communes (« Annonce : notre commune lance une mobilisation pour... »). C'est le premier pas concret du double visage.
