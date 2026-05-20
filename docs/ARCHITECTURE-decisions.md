# ADR — Architecture Decision Records

Journal des décisions techniques notables prises pendant le développement du site Maintenant!. Format : Contexte / Décision / Conséquences / Alternatives considérées (cf. CLAUDE.md §7 et `docs/specs/08_PLAN_CHANTIERS.md`).

Numérotation contigüe (ADR-001, ADR-002, ...). Une décision = une entrée datée. Ne pas réécrire une ADR : si elle est invalidée, en créer une nouvelle qui la révoque.

---

## ADR-001 — Conservation de la ligne Next.js 14.x (chantier 0.1)

**Date** : 2026-05-20
**Statut** : actée

### Contexte

Le pack de specs (`docs/specs/02_STACK.md §2`) prescrit Next.js 14+. Au moment de l'initialisation du dépôt (chantier 0.1, mai 2026), Next.js 15 et Next.js 16 sont publiés. La dernière version de la ligne 14 (`14.2.18` puis `14.2.35` au moment du build) accumule plusieurs avis `npm audit` de sévérité « high », principalement liés au déploiement self-hosted en production (DoS via Image Optimizer, cache poisoning RSC, etc.).

### Décision

On reste sur Next.js 14.2.x pour le chantier 0.1 et les chantiers suivants tant qu'aucun arbitrage explicite n'est pris par Lilou/Ben.

### Conséquences

- Cohérence avec le pack de specs (App Router, Server Components, Server Actions documentés en visant Next 14).
- Réduction du risque de drift API entre versions majeures pendant les phases de pose.
- Avis npm audit présents : à mitiger par les bonnes pratiques (CSP stricte au chantier 11.2, validation des `remotePatterns` images, headers de sécurité) plutôt que par un upgrade précoce.
- Une dette technique est consignée : un upgrade vers Next 15 ou Next 16 sera évalué au plus tard avant le chantier 11.3 (mise en ligne).

### Alternatives considérées

- **Upgrade immédiat vers Next 16** : aurait fermé les avis npm audit mais introduit des risques de divergence avec les patterns documentés dans les specs, et un travail de migration non budgété au chantier 0.1.
- **Pin sur une version mineure spécifique** (ex : `14.2.35`) : envisageable mais le caret (`^14.2.18`) suffit tant que la ligne 14.2 reste maintenue côté Vercel.

---

## ADR-002 — Choix de Biome plutôt qu'ESLint + Prettier (chantier 0.1)

**Date** : 2026-05-20
**Statut** : actée

### Contexte

`docs/specs/02_STACK.md` proposait « Biome (ou ESLint + Prettier) ». Le `CLAUDE.md §6` tranche : « Lint/format : Biome ». Le chantier 0.1 acte cette ligne.

### Décision

Biome (`@biomejs/biome`) est l'outil unique de lint et de formatage. Pas d'ESLint, pas de Prettier, pas de `eslint-config-next` (les conventions Next/React qu'on veut activer le sont via les règles Biome).

### Conséquences

- Un seul binaire pour lint + format + organize imports : pipeline CI plus court, hook pre-commit plus rapide (parallèle avec `tsc`).
- Configuration unique dans `biome.json`, schéma versionné (`https://biomejs.dev/schemas/1.9.4/schema.json`).
- Quelques règles Biome diffèrent d'ESLint+Prettier (ex : `useLiteralKeys` qui pousse `process.env.X` plutôt que `process.env['X']`, ou exigence de `noNonNullAssertion`). On les accepte telles quelles, le code est plus propre.
- Si une lint coverage manquait à terme (ex : règles React très spécifiques), on pourra ajouter ESLint en complément sans changer la décision sur Biome pour le format.

### Alternatives considérées

- **ESLint + Prettier classique** : standard de marché, mais double outil, double config, hook pre-commit plus lent, et les règles `eslint-config-next` apportent peu par rapport à ce que Biome détecte déjà sur App Router.
- **Oxlint** : prometteur en vitesse, mais moins mature que Biome au moment de la décision et ne couvre pas le formatage.

---

## ADR-003 — Composants UI reconstruits maison, sans shadcn/ui CLI ni Radix (chantier 0.2)

**Date** : 2026-05-20
**Statut** : actée

### Contexte

`docs/specs/02_STACK.md` et CLAUDE.md mentionnent shadcn/ui comme bibliothèque de composants. shadcn/ui est habituellement utilisé via une CLI qui copie des fichiers de composants Radix UI dans le projet. Radix gère beaucoup de cas complexes (popovers, dropdown, dialog accessibles) mais ajoute du JavaScript côté client et des dépendances non triviales (`@radix-ui/react-*`).

Pour le chantier 0.2, le besoin est limité à des composants atomiques : `Button`, `Input`, `Textarea`, `Label`, `Card`, `Badge`, `Alert`, `Container`, `Heading`, `IconButton`. Aucun composant avancé nécessitant Radix (Dialog, Popover, Combobox) n'est requis avant le chantier 1.2 (modale d'auth) au plus tôt.

### Décision

On reconstruit les composants UI bas niveau à la main, en TypeScript strict + Tailwind, sans installer `shadcn-ui` CLI ni les paquets `@radix-ui/*`. Le pattern est : un fichier par composant dans `components/ui/`, `forwardRef` pour les éléments DOM, props typées strictement, classes assemblées via `cn()` + maps `STYLES_VARIANT`/`STYLES_TAILLE` en const.

L'index `components/ui/index.ts` réexporte tout, pour permettre des imports compacts (`import { Button, Card } from '@/components/ui'`).

### Conséquences

- Surface de dépendances réduite : seul `lucide-react` est ajouté (icônes). Pas de Radix en bundle pour les composants triviaux.
- Code visible, modifiable, sans copier-coller depuis une CLI tierce.
- Cohérence pédagogique : un·e étudiant·e en master info peut lire chaque composant en entier en 30 secondes.
- Quand un composant complexe sera nécessaire (Dialog modal, Popover, Combobox, focus trap), on installera ponctuellement les primitives Radix nécessaires plutôt que tout le package shadcn. Décision à reprendre dans une ADR ultérieure quand le besoin se présentera.

### Alternatives considérées

- **CLI shadcn/ui complet** : aurait apporté Radix et beaucoup de boilerplate inutile pour la quantité de composants nécessaires en 0.2. Reportable au moment où on aura besoin d'un Dialog ou d'un Popover.
- **Headless UI (Tailwind Labs)** : alternative à Radix, plus légère, à reconsidérer au moment où le premier composant complexe sera nécessaire.

---

## ADR-004 — Polices Sora + Inter + JetBrains Mono via next/font/google (chantier 0.2)

**Date** : 2026-05-20
**Statut** : actée (corrige une mention prématurée de Fraunces/Atkinson dans le MANIFEST de 0.1)

### Contexte

CLAUDE.md §6 mentionnait des polices possibles (« Fraunces + Atkinson + JetBrains Mono »). La spec validée `docs/specs/04_DESIGN-TOKENS.md §4` tranche : **Sora (display) + Inter (body) + JetBrains Mono (mono)**. Toutes trois sous licence libre et disponibles via Google Fonts.

La question est : comment les charger sans appeler Google au runtime (doctrine RGPD minimale, pas de tiers tracker côté client) ?

### Décision

Les trois polices sont chargées via `next/font/google`. Next télécharge les fichiers de polices au moment du `next build` et les sert depuis la propre origine du site. **Aucun appel runtime à Google Fonts côté client.** Chaque police expose une variable CSS (`--font-display`, `--font-body`, `--font-mono`) consommée par Tailwind.

### Conséquences

- Conformité RGPD préservée (pas de cookie tiers, pas de fingerprint Google).
- Polices auto-hébergées sans gestion manuelle de fichiers `.woff2` dans `public/fonts/`.
- Le `display: 'swap'` évite le FOIT (flash of invisible text).
- Subsets latin + latin-ext : couvre le français avec accents et caractères étendus européens.

### Alternatives considérées

- **`@font-face` manuel avec fichiers WOFF2 dans `public/fonts/`** : plus de contrôle mais plus de maintenance (versions, mises à jour, sous-ensembles). On y reviendra si Next/font pose un problème spécifique.
- **`next/font/local`** : nécessite de versionner les fichiers de polices dans le repo, augmente le poids du dépôt sans gain pour notre cas.
