# Manifest — Chantier B (réseau V2) : organisations + mandat (V2.6.13 → V2.6.16)

**Date de fin** : 2026-05-30
**Branche** : `main`
**Commits** : `93453ec` (B.1) → B.4
**Spec** : `docs/specs/09_RESEAU-SOCIAL-V2.md` §7 (arbitré avec Lilou/Ben le 30/05/2026)

Greffe additive stricte (CLAUDE.md §0.3) : « organisation » devient un `espace_type` de plus, AUCUNE table interne existante (commune, fédération, GT, groupe) n'est fusionnée. Le mécanisme gestionnaire/badge/mandat est polymorphe `(espace_type, espace_id)`.

## Décisions de gouvernance appliquées (arbitrées par Lilou/Ben)

- **Badge officiel — voie 2** : l'admin accorde le premier badge, puis cooptation entre gestionnaires d'une organisation déjà officielle.
- **Droits gestionnaire — les trois** : tenir la page + initier des contenus rattachés + gérer les autres gestionnaires.
- **Revendication concurrente** : file d'attente, l'admin tranche (pas de fusion auto).
- **Taxonomie** : organisation umbrella (collectif, association, syndicat, mouvement, fondation, ONG, coopérative, entreprise, groupe, autre) ; les espaces internes du mouvement sont aussi des organisations conceptuellement.

## Livré et fonctionnel

### B.1 (V2.6.13) — Entité organisation
- [x] Migration `20260601100000_organisation.sql` : table `organisation` (taxonomie, `badge_officiel`, `statut`, `cree_par`), RLS, extension des CHECK `espace_type` (abonnement + post_reseau) pour inclure `organisation`.
- [x] `espace_type` 'organisation' propagé : `TypeEspacePostable`, `cheminPublicEspace` (`/organisations/[slug]`), `estMembreActifEspace`, attribution flux, 2 enums Zod.
- [x] Pages `/organisations` (index filtrable), `/organisations/[slug]` (suivable + fil), `/organisations/nouvelle` (création + attestation). Lien footer.

### B.2 (V2.6.14) — Gestionnaires + badge + cooptation
- [x] Migration `20260601110000_gestionnaire_espace.sql` : table polymorphe + fonctions SECURITY DEFINER (`est_gestionnaire_espace`, `bootstrap_gestionnaire_organisation`, `coopter_gestionnaire_organisation`, `retirer_gestionnaire`, `definir_badge_officiel_organisation`). Policy `organisation_update` élargie aux gestionnaires.
- [x] Création → le·la créateur·ice devient gestionnaire. Publication au nom de l'orga (gestionnaire). Server Actions (éditer, coopter, retirer, badge). `PanneauGestionOrganisation` + `ComposerPostEspace` sur la page.

### B.3 (V2.6.15) — Revendications + console admin
- [x] Migration `20260601120000_revendication_organisation.sql` : table file d'attente + fonctions `revendiquer_organisation`, `traiter_revendication_organisation` (admin).
- [x] `BoutonRevendiquer` sur la page orga (connecté·e non-gestionnaire) ; console `/admin/national/organisations` (arbitrage + badge) + carte dans l'index admin national.

### B.4 (V2.6.16) — Contenus portés par une organisation
- [x] Migration `20260601130000_contenu_organisation.sql` : table polymorphe `(objet_type, objet_id) → organisation` + fonctions `declarer_contenu_organisation` (gestionnaire), `retirer_contenu_organisation`.
- [x] `BlocOrganisationPorteuse` (affichage « Porté par [org] » + rattachement gestionnaire) câblé sur pétition, cagnotte, mobilisation, campagne.

## Non livré / refinements (signalés)

- [ ] **Création-auto à la déclaration au lancement** d'un contenu (§7.3) : non fait. À la place, le rattachement se fait après coup par un·e gestionnaire (plus flexible, additif). Brancher l'organisation initiatrice dans les formulaires de création reste un chantier ultérieur.
- [ ] Types `sondage` et `moment` : prévus dans le schéma `contenu_organisation`, pas encore câblés en UI.

## Déploiement distant (Supabase Francfort)

**Décision Lilou/Ben du 30/05** : on est passé en mode « tout sur Supabase ». Les 4 migrations B (`20260601100000`/`110000`/`120000`/`130000`) ont été **appliquées au distant** (via l'API Management + jeton perso temporaire, le dump Docker étant indisponible). **Données vérifiées intactes à chaque étape** : 17 746 signatures, 35 011 communes, 15 737 profils, 470 comptes. Sauvegarde REST des tables critiques effectuée avant la 1ʳᵉ application (`scripts/backup-rest.ts`, sortie hors dépôt).

## Tests

- 1009 tests unitaires verts. typecheck + lint verts à chaque commit.
- Migrations idempotentes (testées en conditions réelles : la migration amitié a révélé un bug d'ordre corrigé, puis tout re-appliqué proprement).

## Notes pour la suite

- Le jeton Supabase perso est rangé dans `.env.local` (gitignoré) le temps de la session ; **à révoquer** sur le dashboard en fin de travaux.
- L'épopée réseau V2 (chantiers A, A.2b, C, D, B) est désormais **complète**. Reste les refinements ci-dessus si besoin.
