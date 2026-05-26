# Manifest — V2 Vague 2, Chantier V2.2.1 : Fil de discussion de groupe (§18)

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-2-1-fil-groupe`
**Base** : `main` (tip `adb7329`, V2.1 fermée)

---

## Livré et fonctionnel

- [x] **Migration `supabase/migrations/20260527030000_fil_groupe.sql`** : table `fil_groupe_message` (espace_type CHECK liste fermée, espace_id, auteur_id FK personne, contenu CHECK longueur, parent_id pour fil filé, soft delete, dates), 3 index actifs, trigger `updated_at`, helper SQL générique `est_membre_espace(espace_type, espace_id)`. 4 policies RLS dans la même migration (lecture membres + admin, insertion membres, édition auteur, modération admin/modérateur réseau). NON appliquée au distant.
- [x] **`lib/fil-groupe.ts`** : `posterMessageFil`, `listerMessagesFil`, `supprimerMessageFil` (soft delete avec motif obligatoire). Types stricts (`EspaceTypeFil`, `MessageFil`).
- [x] **`lib/fil-groupe-validation.ts`** : helper pur `validerContenuMessageFil` (trim + check longueur 1-4000) avec constantes exportées. Testable sans Supabase.
- [x] **`app/actions/fil-groupe.ts`** : 2 Server Actions (`posterDansFilGroupe`, `supprimerDansFilGroupe`) avec vérification de session, validation, revalidatePath.
- [x] **Composants réutilisables** dans `components/fil-groupe/` :
  - `FilDeGroupe.tsx` (Server Component) : orchestre lecture + affichage + formulaire.
  - `MessageFilAffiche.tsx` (Server Component) : rend un message.
  - `FormulairePosterMessage.tsx` (Client Component) : textarea + bouton + compteur de caractères + validation client.
- [x] **`types/database.ts` enrichi** : définition manuelle de `fil_groupe_message`.
- [x] **Tests unitaires** `tests/unit/fil-groupe/validation.test.ts` (6 tests).

## Livré partiellement

- [ ] **Intégration dans les pages d'espace existantes** (commune, campagne, GT). Le composant `<FilDeGroupe espaceType="..." espaceId={...} />` est prêt mais pas encore monté sur les pages réelles. Reporté en VAGUE 3 quand les sous-espaces seront enrichis selon les fiches V2.

## Non livré (et pourquoi)

- [ ] **Migration appliquée au distant** : consigne, à faire au matin avec `supabase db push`.
- [ ] **Réactions / mentions / notifications dans le fil** : hors périmètre V2.2.1. Le réseau social V1 a déjà des réactions (`reaction_reseau`) et notifications ; l'intégration viendra dans des chantiers V2 dédiés.

## Écarts V1→V2 appliqués

- **Nouveau composant transversal V2** sans équivalent V1 (le réseau social V1 a des DM `message_reseau` mais pas de fil collectif par espace). Greffe additive pure.

## Tests

- **Unitaires** : 32 fichiers, **343 tests verts** (+6 nouveaux).
- **Lint Biome** : 431 fichiers, 0 issue.
- **Typecheck** : 0 erreur.
