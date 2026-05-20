# Manifest : Phase 0, Chantier 0.2 — Système de design

**Date de fin** : 2026-05-20
**Branche** : `feature/phase-0-chantier-0.2-systeme-de-design`
**Commit final** : `e2d2576`
**Durée approximative** : 1 session Claude Code (enchaînée avec le 0.1)

---

## Livré et fonctionnel

- [x] **Tokens CSS complets** dans `styles/tokens.css` : couleurs (4 niveaux texte, brand/accent/hue, sémantique), gradients signature (4), typographie (échelle xs à 6xl, 3 leadings, 4 trackings), espacements (système 4 px), border radius (xs à pill), ombres (xs à lg + brand + focus), motion (durations + ease). Mode clair par défaut, mode sombre via `prefers-color-scheme` et override forcé `html[data-theme="dark"|"light"]`.
- [x] **Tailwind config complète** (`tailwind.config.ts`) : `colors`, `backgroundImage`, `fontFamily`, `fontSize`, `borderRadius`, `boxShadow`, `letterSpacing`, `lineHeight`, `transitionDuration`, tous mappés sur les variables CSS. `darkMode: ['class', '[data-theme="dark"]']` pour le toggle manuel.
- [x] **Polices Sora + Inter + JetBrains Mono** via `next/font/google` (auto-hébergées au build, conformes RGPD, cf. ADR-004). Variables CSS exposées sur `<html>`.
- [x] **`app/globals.css`** : import tokens, body sur fond `--bg` avec Inter, hiérarchie typographique h1-h4 avec Sora (h1 responsive 4xl → 5xl en md+), code/kbd/pre en mono, focus-visible avec focus-ring magenta, `::selection` avec teinte brand, `prefers-reduced-motion: reduce` respecté, règle `@media print` de base.
- [x] **Toggle de thème** (`components/ui/ThemeToggle.tsx`) : composant client, 3 états (auto / light / dark), persistance `localStorage` clé `theme`, icônes lucide-react (Monitor / Sun / Moon), libellés ARIA explicites en français.
- [x] **Script anti-FOUC** (`ScriptInitTheme` dans le même fichier) : injecté dans `<head>` avant le rendu, applique `data-theme` depuis `localStorage` avant l'hydratation. `suppressHydrationWarning` sur `<html>` pour éviter le warning React.
- [x] **10 composants UI bas niveau** dans `components/ui/` :
  - `Button` (3 variants : gradient / ghost / outline / link, 3 tailles : sm / md / lg, état disabled)
  - `IconButton` (3 tailles, `aria-label` obligatoire en types)
  - `Input` (texte, état d'erreur via `aria-invalid`)
  - `Textarea` (multi-lignes, 6 rangées par défaut, resize vertical)
  - `Label` (`htmlFor` obligatoire en types, prop `obligatoire` qui ajoute un astérisque sémantique)
  - `Card` (3 variants : plat / ombre / élevée)
  - `Badge` (9 variants dont la signature « ✨ Vous » avec icône Sparkles intégrée)
  - `Alert` (4 variants sémantiques avec icône, rôle ARIA `status` ou `alert` selon gravité)
  - `Container` (4 tailles responsive sm / md / lg / xl)
  - `Heading` (niveaux 1-4, prop `apparenceComme` pour dissocier balise HTML et apparence)
- [x] **`components/ui/index.ts`** : barrel export propre pour `import { ... } from '@/components/ui'`.
- [x] **Page `/design-system`** complète : sommaire navigable, 10 sections (palette, gradients, typographie, boutons, formulaires, badges, alertes, cartes, ombres, espacements). Toggle thème en haut. Un Server Component avec un `<FormulaireExemple>` Client extrait pour démontrer le formulaire avec `preventDefault`.
- [x] **Page d'accueil** (`app/(public)/page.tsx`) mise à jour : utilise `Container`, `Heading`, `Alert`, classes mappées sur tokens (`text-text-2`, `bg-bg`, `text-brand`). Titre Sora via la hiérarchie globale.
- [x] **Tests unitaires (Vitest)** : `tests/unit/utils/cn.test.ts` (5 tests sur le helper de concaténation de classes). Plus les 7 tests des factories de 0.1, total **12 tests verts**.
- [x] **Tests E2E (Playwright)** : `tests/e2e/design-system.spec.ts` (3 tests : chargement + présence des 10 sections, cycle toggle thème auto → light → dark → auto avec vérification de `data-theme` sur `<html>`, formulaire de démo qui ne soumet pas). Plus les 3 tests de 0.1, total **6 tests verts**.
- [x] **Build production** vert (`next build`) : home 1.06 kB, /design-system 2.27 kB, shared JS 87.2 kB.
- [x] **ADR-003** (composants UI maison sans shadcn CLI ni Radix) et **ADR-004** (polices Sora/Inter/JetBrains via next/font/google) ajoutées à `docs/ARCHITECTURE-decisions.md`.
- [x] **Branche `master` renommée en `main`** et chantier 0.1 fusionné en fast-forward.

## Livré partiellement

- (rien)

## Non livré (et pourquoi)

- [ ] **Préférence thème miroitée en BDD** : la persistance est en `localStorage` uniquement. La synchronisation avec `personne.preferences_ui` (cf. 04_DESIGN-TOKENS.md §3) arrivera au **chantier 1.3** (profil utilisateurice).
- [ ] **Composants UI complexes** : Dialog, Popover, Combobox, Toast, Tabs. Pas requis avant le chantier 1.2 (modale d'auth) au plus tôt. Le choix d'installer Radix ponctuellement plutôt que la CLI shadcn complète est tranché par ADR-003 et sera réévalué quand le premier besoin se présentera.
- [ ] **Page « Design system » dans la navigation publique** : le lien existe sur la home temporaire mais ne sera pas exposé dans le header définitif (chantier 2.1). C'est un outil de référence pour les contributeurices, pas une page éditoriale.

## Contenus à arbitrer

- (aucun. Le seul texte du chantier sont des étiquettes utilitaires de showcase, autorisées par CLAUDE.md §3.)

## Décisions techniques prises (ADR à archiver)

- **ADR-003** : composants UI reconstruits maison, sans shadcn/ui CLI ni Radix. Voir `docs/ARCHITECTURE-decisions.md`.
- **ADR-004** : Sora + Inter + JetBrains Mono via `next/font/google`. Voir idem.

## Incertitudes techniques résolues avec Lilou/Ben

- **Polices** : confirmées par la spec `04_DESIGN-TOKENS.md` (Sora / Inter / JetBrains Mono), pas Fraunces / Atkinson comme évoqué prématurément dans le MANIFEST 0.1.

## Tests

- **Unitaires (Vitest)** : 2 fichiers (`factories.test.ts` + `cn.test.ts`), 12 tests verts.
- **E2E (Playwright, chromium)** : 3 fichiers (`home.spec.ts` + `design-system.spec.ts` + `crawl.spec.ts`), 6 tests verts. Durée totale : 42 s.
- **Lint (Biome)** : 0 erreur sur 62 fichiers.
- **Typecheck (tsc strict)** : 0 erreur.
- **Build (`next build`)** : OK, 5 routes statiques pré-rendues, bundle home 1.06 kB.
- **Lighthouse** : non mesuré (la page d'accueil reste temporaire). Sera mesuré dès le chantier 2.1 (home définitive).

## Notes pour les chantiers suivants

- **Convention `cn()` partout** : ne pas réintroduire de package `clsx` / `classnames` / `tailwind-merge` tant que `cn()` suffit. Si une dé-duplication intelligente de classes Tailwind devient nécessaire (par exemple `cn('p-4', 'p-6')` qui devrait garder `p-6`), envisager `tailwind-merge` à ce moment-là et documenter par ADR.
- **Pattern classes en dur plutôt qu'interpolation** : Tailwind ne génère que les classes présentes en clair dans le source. Tous les `bg-${x}`, `text-${x}`, etc. doivent passer par un map `Record<K, string>` plutôt que par template literal, sinon les classes ne sont pas dans le CSS final. Exemples respectés dans `Heading.tsx` (`CLASSE_APPARENCE`) et dans `design-system/page.tsx` (helpers `NuancierItem`, `CarteGradient`, `CarteOmbre`).
- **`htmlFor` obligatoire dans `Label`** : la signature TS force la prop. Tout nouveau champ de formulaire doit suivre la paire `<Label htmlFor="ID"> + <Input id="ID">`. C'est aussi une bonne pratique d'accessibilité, validée par Biome (`a11y/noLabelWithoutControl`).
- **`'use client'` ciblé** : continuer à isoler les Client Components au minimum. La page `/design-system` est un bon exemple : tout le showcase est Server, seul le `<FormulaireExemple>` (handler onSubmit) et le `<ThemeToggle>` (state + localStorage + onClick) sont Client.
- **Polices Next** : si on ajoute une 4e police à terme (pour les pages imprimables Maintenant Médias, par exemple), passer par `next/font/google` ou `next/font/local` selon la disponibilité. Ne **jamais** ajouter un `<link>` direct vers fonts.googleapis.com (RGPD).
- **Renommage `master` → `main`** : effectué pendant ce chantier. La convention de branche `feature/phase-N-chantier-N.X-...` part désormais de `main`. Les futurs `git checkout -b ...` se font depuis `main`.
- **Préalables externes inchangés** : repo GitHub distant à créer, projet Cloudflare Pages à créer, projet Supabase Francfort à créer avant 1.1, clés API à fournir au chantier qui les branche.
