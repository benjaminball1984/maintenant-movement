# Pack export pour Claude.ai — Maintenant! V2

**Date du snapshot** : 2026-05-28
**Tip git** : `389c03d` (V2.4.154 + maj CLAUDE.md)
**Origine** : `https://github.com/benjaminball1984/maintenant-movement`

## Démarrer ici

**Premier fichier à lire** : `SYNTHESE-V2.md` (synthèse complète du cycle V2, ~25 pages).

## Contenu de ce pack

### Document principal
- `SYNTHESE-V2.md` — synthèse exhaustive du cycle V2 (vagues 0-4, logique CMS, état Git, recommandations).

### Mémoire et doctrine
- `CLAUDE.md` — mémoire persistante de Claude Code (63 KB). À lire **après** la synthèse.
- `docs/cdc-v2/` — pack CDC V2 (28 fichiers, doctrine V2 cible).
- `docs/specs/` — specs V1 (vocabulaire, design tokens, RGPD, etc.).
- `docs/ARCHITECTURE-decisions.md` — ADRs.

### Manifests
- `docs/manifests/` — 69 manifests (un par chantier livré), dont 40 manifests V2.

### Code structurant
- `lib/contenu-editorial.ts` — helper CMS (Strate 1).
- `lib/messages-validation.ts` — helper CMS (Strate 2, 1045 lignes, 18 dictionnaires).
- `lib/helpers-purs.ts` — index des 38 helpers purs.
- `lib/` complet — 174 fichiers TypeScript.
- `components/` complet — 119 composants React (avec le pattern `libelles?` partout).
- `app/` complet — 233 pages et Server Actions.

### Persistance
- `supabase/migrations/` — 57 migrations SQL (dont 28 V2 posées localement en attente de push).
- `scripts/` — 12 scripts de backfill et d'import.

### Tests
- `tests/` — 99 fichiers de tests (Vitest + Playwright). 912 tests verts.

### Config et infra
- `package.json`, `next.config.mjs`, `tailwind.config.ts`, `tsconfig.json`.
- `docker-compose.yml`, `Dockerfile`.
- `.env.example` (template, jamais les vraies clés).
- `lefthook.yml` (hooks pre-commit et commit-msg).
- `playwright.config.ts`, `biome.json`.

### État Git
- `git-log-v2.txt` — les 245 commits du cycle V2 (26-28 mai).
- `git-status.txt` — état du working tree au moment du zip.
- `git-tip.txt` — sha du commit de référence.
- `git-branches.txt` — liste des branches.
- `migrations-liste.txt` — liste des 57 migrations.

## Ce que ce pack NE contient PAS

- `node_modules/` (464 MB — restaurable avec `npm install`).
- `.next/` (737 MB — restaurable avec `npm run build`).
- `data-migration/*.csv` (70 MB, dont 63 MB pour `Signature_export.csv` — données importées Base44 déjà absorbées dans Supabase).
- `.git/` (12 MB d'historique — disponible sur GitHub).
- `.env.local` (jamais commité, contient les vraies clés Supabase).
- `playwright-report/`, `test-results/` (artefacts de tests, non commitiés).

## Que faire avec ce pack ?

L'objectif est de **donner à Claude.ai assez de contexte** pour qu'iel formule un avis externe sur :
1. La cadence du cycle V2 (158 chantiers en 48h, est-ce sain ?).
2. L'éditabilité CMS (>1 200 clés, est-ce excessif ?).
3. La suite (VAGUE 4 : faut-il que Lilou/Ben écrive les fiches d'abord, ou Claude Code peut-il commencer ?).

Cf. `SYNTHESE-V2.md` §8.3 pour les questions précises.

## Référence canonique

Ce pack est un snapshot. La vérité vivante est sur GitHub : `benjaminball1984/maintenant-movement` au tip `389c03d`.

Pour reconstituer un environnement local :
```bash
git clone https://github.com/benjaminball1984/maintenant-movement
cd maintenant-movement
cp .env.example .env.local  # remplir avec les clés Supabase
npm install
# supabase db push  (après backup du distant)
npm run dev  # http://localhost:3000
```
