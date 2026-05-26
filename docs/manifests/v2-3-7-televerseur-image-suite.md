# Manifest — V2 Vague 3, Chantier V2.3.7 : ChampImageObjet sur 5 formulaires restants

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-7-televerseur-image-suite`
**Base** : `main` (tip `b301045`, V2.3 fermée)

---

## Livré et fonctionnel

Suite directe de V2.3.4. Branche `ChampImageObjet` sur les 5 formulaires V1 que V2.3.4 n'avait pas encore couverts. ET2 V2.0.3 désormais appliqué à **10 formulaires** au total.

- [x] **`components/petitions/FormulaireEditionPetition.tsx`** : édition d'une pétition existante. Passe `valeurInitiale={petition.image_url}` pour pré-afficher l'image actuelle. Ajout de `setValue` au `useForm` (manquant).
- [x] **`components/marche/FormulaireCreationMinimarche.tsx`** : création d'un minimarché solidaire.
- [x] **`components/marche/FormulaireCreationBoutique.tsx`** : création d'une boutique du marché.
- [x] **`components/campagnes/FormulaireCreationCampagne.tsx`** : création d'une campagne.
- [x] **`components/sondages/FormulaireCreationSondage.tsx`** : création d'un sondage.

## Non livré (et pourquoi)

- [ ] **`components/groupe-entraide-local/FormulaireCreationGroupeEntraide.tsx`** : pas branché. Ce formulaire (V2.3.2) utilise `FormData` natif (pas `react-hook-form`). L'intégration de `ChampImageObjet` demande une boucle plus large (le formulaire ne passe pas `image_url` à `creerGroupeEntraide` actuellement). À traiter dans un chantier dédié si Lilou/Ben veut activer la couverture image sur les groupes.

## Décisions techniques prises

- **`valeurInitiale` propagée pour l'édition** : `FormulaireEditionPetition` est le seul cas d'édition livré. Le composant `ChampImageObjet` accepte une valeur initiale qui s'affiche en aperçu et reste si la personne ne re-téléverse pas (cohérent avec ET1 : l'image actuelle reste).
- **`setValue` ajouté à `useForm`** : V2.3.4 avait déjà `setValue` dans les 5 formulaires de création couverts. L'édition pétition ne l'avait pas. Ajout minimal.

## Écarts V1→V2 appliqués

- Suite directe de V2.3.4 (ET2). Aucun nouvel écart d'architecture.

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (inchangés).
- **Lint Biome** : 454 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur (fix `setValue` manquant dans l'édition pétition).
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **GroupeEntraide** : envisager de migrer le formulaire vers `react-hook-form` ET d'ajouter `image_url` à `DonneesCreerGroupeEntraide` côté validation et Server Action. Pattern à appliquer ensemble.
- **Vérifier que les schémas Zod acceptent `''`** comme valeur de `image_url` (le champ caché passe une chaîne vide quand rien n'est uploadé) : `z.string().url().optional().or(z.literal(''))` est le pattern à suivre.
