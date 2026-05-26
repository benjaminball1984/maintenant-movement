# Manifest — V2 Vague 3, Chantier V2.3.8 : FilDeGroupe sur fédération + fix helper SQL

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-8-fil-groupe-federations-gt`
**Base** : `main` (tip `da0fa40`, V2.3.7)

---

## Livré et fonctionnel

- [x] **Branchement `FilDeGroupe` sur `/agir/federations/[slug]`** : visible aux comptes authentifiés (la RLS de `fil_groupe_message` + le helper SQL corrigé restreignent côté BDD aux vrais membres via la chaîne `appartenance_commune` → `appartenance_federation`).
- [x] **Migration corrective `supabase/migrations/20260527080000_est_membre_espace_fix.sql`** : `CREATE OR REPLACE FUNCTION` qui réécrit `est_membre_espace`. Trois bugs latents V2.2.1 corrigés :
  - **`federation`** : la table `appartenance_federation` lie une COMMUNE (pas une personne) à une fédération. Le helper V2.2.1 lisait `personne_id` inexistant. Réécriture par jointure transitive `appartenance_commune` → `appartenance_federation`.
  - **`confederation`** : table similaire (lie fédération → confédération). Réécriture par double jointure transitive `appartenance_commune` → `appartenance_federation` → `appartenance_confederation`.
  - **`gt_thematique`** : la colonne s'appelle `gt_thematique_id`, pas `gt_id`. Corrigé.
- [x] **Découverte** : ces 3 bugs n'avaient jamais été exercés en production car aucune feature ne consommait `est_membre_espace('federation' | 'confederation' | 'gt_thematique', ...)` avant V2.3.8. Le helper aurait planté à la première utilisation (erreur SQL « column does not exist »). Bonne raison de plus pour appliquer cette migration au matin avant tout test.

## Non livré (et pourquoi)

- [ ] **GT thématique : pas de page détail publique V1** : `app/(public)/agir/gts/...` n'existe pas. Si un jour la page est créée, brancher `<FilDeGroupe espaceType="gt_thematique" espaceId={gt.id} />` en suivant le pattern commune.
- [ ] **Confédération : pas de page détail publique V1** non plus. Idem.
- [ ] **Migration appliquée au distant** : à faire au matin.

## Décisions techniques prises

- **`CREATE OR REPLACE FUNCTION`** plutôt que `DROP + CREATE` : compatible avec les policies RLS qui dépendent du helper (elles ne sont pas re-cassées).
- **`est_membre_espace('federation', ...)` est désormais réellement coûteux** (jointure entre 2 tables). Sur un cas concret « 17 746 signatures × N appartenances », pas de problème. Mais sur les RLS d'autres tables qui appellent ce helper de façon répétée (`fil_groupe_message` SELECT par exemple), surveiller si la latence devient un sujet. Solution éventuelle : index `(personne_id, est_active)` sur `appartenance_commune` (probablement déjà en place via la clé primaire).

## Écarts V1→V2 appliqués

- **Correction du helper V2.2.1** : c'est un fix, pas un écart. Aucun comportement V1 cassé (le helper n'était utilisé que dans la nouvelle table `fil_groupe_message` qui n'avait pas encore d'usage réel).

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (inchangés).
- **Lint Biome** : 454 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.
- **Test SQL** : le helper corrigé compile (DDL) ; le test de comportement réel nécessite une instance Supabase avec des données — à valider au matin après `supabase db push`.

## Notes pour les chantiers suivants

- **Appliquer `20260527080000_est_membre_espace_fix.sql`** au matin. C'est une migration **prioritaire** car le helper V2.2.1 plantait pour 3 valeurs d'`espace_type`.
- **Créer des pages détail GT thématique et confédération** si la spec V2 le demande — pas vu de fiche dédiée actuellement, à clarifier avec Lilou/Ben.
- **Index `appartenance_commune(personne_id, est_active)`** : vérifier qu'il existe (cf. migration 004). Si non, le créer pour éviter une dégradation perf des helpers RLS.
