# Manifest, Phase V2.5, Chantier V2.5.56 : centralisation des formatteurs de date

**Date de fin** : 2026-05-29
**Branche** : main
**Commit final** : `__TIP__`
**Durée approximative** : 1 session Claude Code (courte)

## Contexte

12 pages définissaient leur propre `const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {...})`
en doublon, alors que `lib/format-date.ts` centralise déjà ce travail. Trois
groupes de formats correspondaient exactement (mêmes options, donc sortie
identique au caractère près) à un format centralisable.

## Livré et fonctionnel

- [x] 2 nouveaux helpers dans `lib/format-date.ts` :
  - `formaterDateMoyenne` (« 23 mai 2026 », mois en toutes lettres, sans jour
    de semaine).
  - `formaterDateLongueHeure` (« samedi 23 mai 2026, 14:00 »).
- [x] 12 pages migrées vers les helpers (32 sites d'appel au total), formats
  identiques garantis (options strictement égales) :
  - `formaterDateCourte` : admin/personnes, admin/journal.
  - `formaterDateHeure` : admin/images.
  - `formaterDateMoyenne` : journal (×2), media (×2), agir/assemblee,
    tresorerie/[caisseId] (le `NumberFormat` euro de cette page est conservé).
  - `formaterDateLongueHeure` : decider/[slug]/[reunionId], decider/[slug],
    moderation/reservations.
- [x] 3 nouveaux tests unitaires (couvrent les 2 helpers).

## Non migré (intentionnel)

- Formats réellement spécifiques laissés inline : `moments-solidaires/[slug]`
  (heure en `numeric`, et un format jour+mois sans année), `decider` (index :
  jour de semaine abrégé sans année), `reseau/messages` (`dateStyle` +
  `timeStyle`). Les centraliser changerait la sortie ou multiplierait les
  helpers à un seul usage.

## Tests

- Unitaires : 1005 tests verts (1002 + 3).
- Lint (biome) : 14 fichiers touchés impeccables. Typecheck : vert.
- Vérifié : plus aucun `Intl.DateTimeFormat` inline dans les 12 fichiers
  (hormis le `NumberFormat` euro conservé).

## Notes pour les chantiers suivants

- Tout nouveau besoin de format date doit passer par `lib/format-date.ts`.
