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
