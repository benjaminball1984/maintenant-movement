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

---

## ADR-005 — `personne.id` lié à `auth.users.id` via FK avec cascade (chantier 1.1)

**Date** : 2026-05-20
**Statut** : actée

### Contexte

Supabase Auth gère sa propre table `auth.users` (id UUID, email, mots de passe hashés, providers OAuth, etc.). Notre application a besoin d'une table `personne` qui porte tous les champs métier (nom, prénom, pronom, code_postal, statut RGPD, préférences, etc.) qui n'ont pas leur place dans `auth.users`.

Deux conventions Supabase coexistent dans la littérature :
1. `personne.user_id` (UUID) référence `auth.users(id)`, `personne.id` est un UUID applicatif distinct.
2. `personne.id` (PK) **est** la même valeur que `auth.users(id)`.

### Décision

On retient la convention 2 : `personne.id uuid primary key references auth.users(id) on delete cascade`. Un seul UUID identifie une personne dans tout le schéma. `auth.uid()` (issu de Supabase Auth dans les politiques RLS) est directement comparable à `personne.id`, `appartenance_commune.personne_id`, etc.

`on delete cascade` garantit que la suppression d'un compte Auth nettoie automatiquement les références applicatives. Le flux RGPD de suppression différée 30 jours (cf. 05_RGPD.md §5A) ne passe **pas** par `delete auth.users` ; il passe par anonymisation (`personne.statut = 'anonymise'` + nullification des champs identifiants), ce qui préserve les contributions sous « Membre anonyme ». Le cascade ne s'active donc que pour les rares cas de suppression directe via la console Supabase Studio.

### Conséquences

- Les politiques RLS sont très lisibles (`auth.uid() = id` pour les politiques « soi-même »).
- Une jointure de moins par requête : pas besoin de résoudre `user_id → id` pour le mapping.
- L'insertion d'une ligne `personne` se fait après le `auth.signUp()` et utilise le `user.id` retourné.
- Si on devait un jour migrer hors Supabase Auth, il faudrait préserver les UUID. C'est de toute façon une bonne pratique.

### Alternatives considérées

- **`personne.user_id` distinct de `personne.id`** : ajoute une indirection sans bénéfice pour notre cas. Utile si on supporte plusieurs comptes Auth pour une même personne (pas notre besoin).

---

## ADR-006 — Anti-spam et max-3 sur `appartenance_commune` via triggers SQL (chantier 1.1)

**Date** : 2026-05-20
**Statut** : actée

### Contexte

Deux règles métier importantes sur l'appartenance d'une personne aux communes (cf. 01_ARCHITECTURE.md §7B) :
1. **Maximum 3 communes actives par personne** (4 = refusé).
2. **Anti-spam : 1 transition (entrée ou sortie) par mois glissant** pour éviter le « zapping ».

Trois lieux possibles pour faire respecter ces règles :
- Côté application (validation Zod + Server Action).
- Triggers SQL Postgres `BEFORE INSERT/UPDATE`.
- Contraintes d'exclusion Postgres (`EXCLUDE USING gist + btree`).

### Décision

On utilise des **triggers SQL `BEFORE INSERT/UPDATE`** dans la migration 004. La règle est posée au niveau le plus bas (base de données), ce qui :
- garantit qu'aucune mutation directe SQL (via Supabase Studio, console, script d'admin) ne puisse la contourner ;
- centralise la logique dans un seul fichier de migration auditable ;
- expose une erreur SQL claire (avec `errcode = 'check_violation'`) que l'application peut traduire en message utilisateur·ice.

L'application duplique la vérification au niveau Zod pour donner un retour avant l'appel BDD (UX), mais la BDD reste la source de vérité.

### Conséquences

- Les règles sont testables au niveau SQL (les futurs tests d'intégration avec Supabase local valideront leur comportement).
- Toute modification de la règle (par exemple passer à 4 max, ou raccourcir l'anti-spam à 15 jours) se fait par une nouvelle migration, traçable dans git.
- Les triggers ajoutent un coût de quelques requêtes supplémentaires par INSERT/UPDATE. Coût négligeable pour le volume attendu (le mouvement n'aura jamais des milliers d'inscriptions de communes par seconde).

### Alternatives considérées

- **Validation applicative seule** : non fiable (un script admin peut contourner).
- **Contrainte d'exclusion** : trop subtile pour cette règle ; les triggers sont plus lisibles et plus pédagogiques.

---

## ADR-007 — Supabase Auth pour l'auth transactionnel, Brevo pour la newsletter et le métier (chantier 1.2)

**Date** : 2026-05-20
**Statut** : actée

### Contexte

Les flux d'authentification (validation email, magic link, reset mot de passe, confirmation OAuth) déclenchent l'envoi d'emails dits « auth-transactionnels ». Deux approches possibles :

1. Laisser Supabase Auth gérer ces envois (il a un système intégré configurable via SMTP).
2. Capter chaque évènement Supabase Auth (via webhook ou hook) et déclencher nos propres envois via `BrevoEmailService`.

Par ailleurs, on a déjà `BrevoEmailService` pour le métier : newsletter mardi récap + vendredi (chantier 8.1), reçus fiscaux (chantier 3.3), notifications admin.

### Décision

**Partage clair** :
- **Supabase Auth → SMTP Brevo** (configuré côté projet Supabase, dashboard Auth → SMTP Settings) gère **tous les emails d'authentification** : confirmation d'inscription, magic link, reset mot de passe, changement d'email.
- **`BrevoEmailService` côté app** (API Brevo) gère **les emails métier non-auth** : récap mardi, newsletter vendredi, reçus, notifications admin, alertes.

Avantages :
- Pas de duplication de logique : Supabase Auth a déjà des templates et un anti-rebond éprouvés pour les mails d'auth.
- Pas de webhook fragile à maintenir entre Supabase et notre serveur pour relayer les évènements d'auth.
- Une seule clé Brevo (SMTP + API) configurée dans deux endroits (Supabase dashboard + `.env.local`).

### Conséquences

- Au moment où le projet Supabase sera créé, il faudra configurer Brevo comme provider SMTP dans Supabase Auth (paramètres : `smtp-relay.brevo.com:587`, login Brevo, mot de passe SMTP).
- Les templates d'auth sont personnalisables côté Supabase (dashboard → Authentication → Email Templates). On y met les textes en français avec le ton sobre Maintenant!.
- Si on doit un jour personnaliser un mail d'auth au-delà de ce que Supabase permet (par exemple ajouter une signature dynamique), on bascule ce mail spécifique en webhook → `BrevoEmailService`. Décision à reprendre par ADR ultérieure.

### Alternatives considérées

- **Tout passer par `BrevoEmailService`** : nécessite des webhooks Supabase → app, plus de surface de bugs, anti-rebond à réimplémenter.
- **Tout passer par Supabase Auth** : ne marche pas pour la newsletter et les reçus, qui ne sont pas des mails d'auth.
