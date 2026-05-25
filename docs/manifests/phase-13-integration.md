# Manifest — Phase 13, intégration des chantiers 13.1 / 13.2 / 13.3

**Date de fin** : 2026-05-25
**Branche** : feature/phase-13-integration (fusionne 13.1, 13.2, 13.3 depuis la base saine d01562b)
**Commit final** : b141b6d
**Durée approximative** : 1 session Claude Code (finition + merge)

Les trois chantiers parallèles de la phase 13 ont été finis puis fusionnés sur une
branche d'intégration unique. `main` n'a pas été touchée (décision Lilou/Ben : ne pas
merger la phase 13 dans `main` brut). La base distante Supabase n'a pas été modifiée
(aucun `supabase db push`).

## Livré et fonctionnel

### Chantier 13.2 : console nationale (« super admin »)
- [x] Socle `lib/admin/national/` : `garde.ts` (`estAdminNational` / `garantirAdminNational`),
  `droits.ts`, `journal.ts` (`journaliser` alimente `journal_admin`). Tables `droit_admin`
  et `journal_admin` déjà présentes en base (migrations 008/009), donc opérationnel sans db push.
- [x] Console nationale : `/admin/national` (vue) et `/admin/national/droits` (accorder / retirer
  les 6 niveaux de droits), composants `FormulaireAccorderDroit` + `BoutonRetirerDroit`.
- [x] Lien « Console nationale » dans la nav `/admin`, visible seulement si `estAdminNational`.
- [x] Tests unitaires des schémas de droits (`tests/unit/validations/droit-admin.test.ts`).

### Chantier 13.2 : modération active (complétée cette session)
- [x] Composant réutilisable `ControleModeration` câblé sur **tous** les domaines :
  médias, marché, moments, sondages, SEL, autres moyens.
- [x] Actions de retrait : médias, marché, moments, sondages, et nouvellement
  `retirerServiceSel` (`app/(public)/s-entraider/sel/actions.ts`) +
  `reafficherOrganisation` (`app/(public)/agir/autres-moyens/actions.ts`).
  Toutes tracées dans `journal_admin`.
- [x] Pages `/admin/moderation/{moments,sondages,sel,autres-moyens}` : boutons de retrait
  (motif obligatoire >= 10 caractères) et, pour les organisations, réaffichage.
- [x] Tests unitaires des schémas de modération (`tests/unit/validations/moderation.test.ts`, 15 tests).

### Chantier 13.2 : édition des pétitions par l'équipe
- [x] `FormulaireEditionPetition` + Server Action `editerPetition` + schéma `editerPetitionSchema`
  (avec règle croisée échéance >= lancement).
- [x] Migration `20260524120035_petition_dates_lancement_echeance.sql` : colonnes `date_lancement`
  et `date_echeance` (optionnelles) + contrainte de cohérence + index partiel.
- [x] Page de gestion `/admin/petitions` (liste tous statuts) + page d'édition `/admin/petitions/[slug]`,
  reliées depuis la nav `/admin` (groupe « Gestion »).
- [x] Tests unitaires de `editerPetitionSchema` (cohérence des dates, objectif, texte).

### Chantier 13.3 : plateforme de données
- [x] Migration `commune_reference` (référentiel complet) + correspondance code_postal / code_insee.
- [x] Scripts `importer-communes-reference.ts`, `importer-signataires.ts` (attribution des pétitions
  importées au compte créateur + réessais réseau), outil `appliquer-sql-distant.ts`. Validés en `--dry-run`.
- [x] Protection RGPD : `data-migration/` (CSV de PII) exclu de git sur toutes les branches fusionnées.

### Qualité
- [x] `npm run typecheck` : vert. `npm run lint` (Biome, 378 fichiers) : vert.
- [x] `npm test` (Vitest) : 279 tests, tous verts (25 fichiers).
- [x] Smoke test serveur dev : pages publiques en 200, pages `/admin/*` en 307 (redirection
  `/connexion` sans session, donc aucune route ne crashe).

## Livré partiellement

- [ ] **Édition des dates de pétition end-to-end** : le formulaire s'affiche et la page route
  correctement, mais l'enregistrement des dates échouera tant que la migration 035 n'est pas
  appliquée sur la base distante (colonnes `date_lancement` / `date_echeance` absentes). Voir
  préalables. Le reste de l'édition (titre, texte, destinataire, objectif) fonctionne déjà.
- [ ] **Test des écrans admin authentifiés** : vérifié au niveau routage (307) mais pas en session
  connectée réelle (nécessite un compte avec droits). À faire manuellement par Lilou/Ben.

## Non livré (et pourquoi)

- [ ] `supabase db push` des migrations 13.x (`commune_reference`, CP/INSEE, dates pétition) :
  volontairement non fait (décision Lilou/Ben : ne pas toucher la base distante).
- [ ] Scripts d'import en `--confirm` (signataires, communes) : non lancés (PII, RGPD, hors demande).
- [ ] Chantier 13.3 C-UI (fiche commune_reference) et D (« Mes données ») : non démarrés.
- [ ] Merge dans `main` : volontairement non fait (intégration isolée pour test d'abord).

## Préalables externes attendus

- **Pour tester l'édition des dates de pétition + la plateforme données contre le distant** :
  appliquer les migrations sur la base distante (`supabase db push`, ou via
  `scripts/appliquer-sql-distant.ts`). Ces migrations sont structurelles (DDL), sans PII.
- **Pour importer les signataires / communes** : lancer les scripts en `--confirm` après feu vert.

## Tests

- Unitaires : 279 tests Vitest, tous verts (`npm test`).
- E2E Playwright : non relancés cette session (dépendent d'un état distant et d'un login ;
  les flux admin nécessitent une session authentifiée).
- Lint, typecheck : verts.

## Notes pour les chantiers suivants

- L'action `editerPetition` revalide `/admin/petitions`, `/mobiliser/petitions` et la page slug
  publique : cohérent avec les nouvelles routes.
- Le helper `aDroitModerationPetitions` factorise le contrôle de droit entre `modererPetition`
  et `editerPetition`.
- Si on fusionne plus tard dans `main`, repartir de cette branche d'intégration (elle contient
  les fixes auth/RLS de 13.1 + les trois lots).
