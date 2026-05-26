# Manifest — V2 Vague 3, Chantier V2.3.4 : TeleverseurImage sur formulaires de création

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-4-televerseur-image-formulaires`
**Base** : `main` (tip `e85d9ca`, V2.3.3)

---

## Livré et fonctionnel

Remplace le champ « collez l'URL d'image » par un **vrai bouton d'upload** (ET2 V2.0.3) sur les formulaires de création des objets les plus partageables. Le pattern est centralisé dans un composant réutilisable.

- [x] **`components/ui/ChampImageObjet.tsx`** : composant client qui encapsule `TeleverseurImage` (V2.0.3) + un champ caché `<input name="..." />` compatible `react-hook-form`. Synchronise la valeur via `onChange`. Exposé dans `components/ui/index.ts`. Cohérent avec ET1 + ET2 du cycle V2 (« si la personne uploade, son image remplace la défaut ; sinon la défaut reste »).
- [x] **5 formulaires branchés** sur `ChampImageObjet` (champ caché synchronisé avec react-hook-form via `setValue('image_url', url ?? '')`) :
  - `components/petitions/FormulaireCreationPetition.tsx`
  - `components/cagnottes/FormulaireCreationCagnotte.tsx`
  - `components/mobilisations/FormulaireCreationMobilisation.tsx`
  - `components/entraide/FormulaireCreationOffre.tsx`
  - `components/marche/FormulaireCreationProduit.tsx`

## Livré partiellement

- [ ] **Formulaires non encore branchés** (à compléter au cas par cas) :
  - `FormulaireEditionPetition.tsx` (édition d'une pétition existante).
  - `FormulaireCreationMinimarche.tsx`, `FormulaireCreationBoutique.tsx` (marché solidaire — autres types d'objet).
  - `FormulaireCreationCampagne.tsx`.
  - `FormulaireCreationSondage.tsx`.
  - `FormulaireCreationGroupeEntraide.tsx` (V2.3.2 — gardée volontairement minimale jusqu'à V2.3.4, à brancher maintenant si besoin).

Pour chacun, le pattern d'intégration est simple (≤ 5 lignes ajoutées + 1 import + suppression de l'ancien `<Input type="url">`).

## Non livré (et pourquoi)

- [ ] **Bucket Supabase Storage `media`** : la migration `20260526220000_storage_media_bucket.sql` (chantier V2.0.3) doit être appliquée au distant pour que les uploads réels fonctionnent en production. Tant qu'elle ne l'est pas, `IMAGE_STORAGE_PROVIDER=mock` continue de retourner des data URLs base64 (taille à surveiller, mais fonctionnel pour démo). À appliquer au matin avec `supabase db push`.

## Décisions techniques prises

- **Prop renommée `roleImage` (non `role`)** : Biome considérait `role="couverture"` comme un attribut ARIA invalide. Renommée pour ne pas créer un faux positif a11y. Conséquence : le default `'couverture'` suffit pour 99 % des usages, on n'a pas à le préciser explicitement dans les formulaires.
- **Champ caché `<input type="hidden" name="image_url" value={...}>`** : pour préserver la compatibilité avec `react-hook-form` (`register('image_url')` + `setValue('image_url', url)`) ET avec les formulaires sans react-hook-form qui s'appuieraient sur `FormData`.
- **Pas de migration pour le champ `image_url`** : le champ existait déjà sur toutes les tables concernées (cf. types/database). On change juste comment la valeur est saisie, pas le schéma.

## Écarts V1→V2 appliqués

- **Champ URL d'image → bouton d'upload** : la V1 demandait à la personne de coller une URL d'image hébergée ailleurs (exclut la majorité des gens qui n'ont pas de blog/CDN). L'ET2 V2 exige un vrai bouton d'upload. **Appliqué** sur 5 formulaires clés. Aucune donnée n'est touchée : les `image_url` existantes restent valides (URL ou data URL en mode mock).

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (pas de nouveau test — le helper `TeleverseurImage` était déjà couvert en V2.0.3, et `ChampImageObjet` est un wrapper trivial).
- **Lint Biome** : 452 fichiers, 0 issue (fix : `role` → `roleImage` pour éviter le faux positif a11y).
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **Appliquer le bucket `media`** au matin : indispensable pour que `IMAGE_STORAGE_PROVIDER=supabase` fonctionne en production.
- **Brancher les ~5 formulaires restants** : trivial avec le pattern `ChampImageObjet`. Peut se faire en un chantier doux.
- **Édition d'objets existants** : `FormulaireEditionPetition.tsx` doit passer `valeurInitiale={petition.image_url}` à `<ChampImageObjet>` pour que l'image actuelle soit pré-affichée. Pattern documenté.
- **Tests E2E « upload puis affichage de l'objet »** : à ajouter une fois le bucket distant en place.
