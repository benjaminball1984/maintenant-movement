# CLAUDE.md — Mémoire persistante du projet Maintenant!

> **Tu lis ce fichier intégralement à chaque démarrage de session, avant tout autre fichier.** C'est ta mémoire principale entre les sessions Claude Code. Si une décision n'y figure pas, consulte `docs/cdc-v2/` (cible V2) puis `docs/specs/` (V1). Si la réponse n'y est pas non plus, tu poses la question à Lilou/Ben. Tu n'inventes pas.

---

## 0. Bloc de préséance V2 (à lire AVANT la section 1)

> Ce bloc prime sur le reste du CLAUDE.md. Il désamorce les contradictions entre le V1 (le code actuel, phases 0-13 livrées) et le V2 (cible doctrinale formalisée dans `docs/cdc-v2/CDC-Maintenant-V2/`).

### 0.1 Pourquoi ce bloc existe

Le projet a sédimenté en trois couches successives, chacune pensée avec les principes de son époque :

- **V0** : première plateforme sur Base44 (abandonnée le 17/05/2026).
- **V1** : reconstruction sur Claude Code (le code actuel du repo : ~46 tables, ~90 pages, phases 0 à 13 livrées, réseau social inclus). C'est ce qui tourne aujourd'hui en distant Francfort.
- **V2** : nouvelle doctrine d'architecture, formalisée dans le pack `docs/cdc-v2/CDC-Maintenant-V2/` (principes transversaux, schéma de données D1-D13, matrice de droits MD0-MD6, fiches de sous-espaces).

Il est NORMAL qu'il y ait des écarts entre la V1 (le code) et la V2 (la cible). Ce ne sont pas des bugs : ce sont des décisions prises plus tard. Ce bloc dit comment l'agent doit se comporter face à ces écarts, pour qu'il n'y ait jamais de contradiction vécue du type « on me dit que c'est un principe, puis on me dit le contraire ».

### 0.2 Règle de préséance des sources (NOUVELLE, prime sur tout)

Quand l'agent cherche la vérité sur un point, il consulte les sources dans cet ordre. **La première qui répond gagne.**

1. **Doctrine de greffe** (§0.3 ci-dessous) : règle de comportement la plus haute. Elle ne décrit pas QUOI construire, elle décrit COMMENT toucher l'existant.
2. **Pack CDC V2** (`docs/cdc-v2/CDC-Maintenant-V2/`) pour tout ce qui touche **l'architecture cible** : modèle de données, liste des espaces/sous-espaces autorisés, droits de plateforme, principes transversaux. **Le CDC V2 prime sur `docs/specs/01_ARCHITECTURE.md` partout où ils divergent sur l'architecture.**
3. **`docs/specs/`** (specs V1) pour tout ce que le CDC V2 ne traite pas encore : design tokens (`04_DESIGN-TOKENS.md`), RGPD (`05_RGPD.md`), stack (`02_STACK.md`), et surtout **vocabulaire** (`03_VOCABULAIRE.md`).
4. **Le reste du CLAUDE.md** (persona, exhaustivité, conventions, MANIFEST) : INCHANGÉ, toujours valable, jamais contredit par le V2.

**Cas particulier du VOCABULAIRE** : le vocabulaire fixé (`03_VOCABULAIRE.md` + CLAUDE.md §9) **n'est PAS de l'architecture**. Il prime sur le CDC V2 même là où le CDC V2 emploie une autre forme. Exemple : « **Maintenant Médias** » (avec S) est la forme correcte, jamais « Maintenant Média ». L'agent applique le vocabulaire V1, et signale toute coquille du V2 dans le MANIFEST.

### 0.3 Doctrine de greffe (règle de comportement la plus haute)

La V2 se construit **par greffe** sur la V1, jamais par refonte. Trois interdits absolus, sans exception :

1. **On additionne, on ne soustrait jamais.** On crée de nouvelles tables, colonnes, entités à côté de l'existant. On ne `DROP` aucune table ni colonne portant des données réelles. Une colonne devenue « historique » est conservée comme source de vérité du passé, jamais supprimée.
2. **On backfill, on ne réinitialise jamais.** Quand une nouvelle structure doit reprendre des données anciennes, on la remplit (backfill) en LISANT l'ancienne. On ne remet aucun compteur à zéro. Les 17 746 signatures restent 17 746. Les 15 737 profils restent 15 737. Les 35 011 communes restent 35 011.
3. **Le grand modèle V2 (tronc `Objet`, `Espace` générique) est une CIBLE, pas un chantier immédiat.** On n'entreprend AUCUNE migration lourde du modèle de données sans décision explicite et nominative de Lilou/Ben pour ce chantier précis. Tant que cette décision n'est pas donnée, on ne touche pas aux tables métier existantes (`petition`, `cagnotte`, `commune`, etc.) pour les fondre dans un tronc commun.

**Corollaire** : la majorité des chantiers V2 sont *additifs* (nouveaux espaces, nouveaux outils, retrait du wallet intégré, nouvelles entités à côté). Ce sont eux qu'on fait en premier. La convergence vers le modèle tronc+filles se fait plus tard, table par table, sur décision.

### 0.4 Comportement face à un écart V1 ↔ V2 (arbitrage acté par Lilou/Ben)

Quand l'agent constate qu'une décision du CDC V2 contredit une spec V1 ou le code existant sur un point d'architecture :

- **Le V2 gagne** (l'agent applique la décision V2, il ne se fige pas, il ne demande pas la permission à chaque fois).
- **MAIS l'agent le SIGNALE systématiquement** dans le MANIFEST du chantier, sous une rubrique dédiée **« Écarts V1→V2 appliqués »**, avec pour chaque écart : ce que disait la V1, ce que dit le V2, ce qui a été fait concrètement, et la garantie qu'aucune donnée n'a été perdue.

C'est le même contrat que les « Contenus à arbitrer » : l'agent avance avec une trace visible, plutôt que de s'arrêter ou d'arbitrer en douce. Lilou/Ben lit le MANIFEST en fin de chantier et corrige a posteriori si un écart le surprend.

**Exception (l'agent s'arrête et demande)** : si l'écart implique de toucher des données réelles d'une manière qui pourrait en perdre, ou de lancer une migration lourde du modèle. Dans ce cas, la doctrine de greffe prime : l'agent met `// CHANTIER-EN-ATTENTE-DE-DÉCISION-LL/B` et remonte la question.

---

## 1. Identité du projet

**Maintenant!** est une plateforme citoyenne web en français, portée par un mouvement politique populaire en construction. Site officiel cible : `maintenant-le-mouvement.org`. Refonte complète, après une première version sur Base44 à migrer (946 membres, ~9k newsletter, ~16k signataires).

**Pilote** : Lilou/Ben (LIFE BENJAMIN BALL, cosec gé). Non-binaire, prénoms fluides (les deux sont utilisés ensemble : « Lilou/Ben »). Tu lui parles avec respect, sobriété, et tu ne fais pas de surcouche émotionnelle.

**Phase actuelle** : cycle V2 (greffe additive) ouvert le 26/05/2026. L'architecture V1 est dans `docs/specs/`. L'architecture CIBLE est dans le pack CDC V2 (`docs/cdc-v2/CDC-Maintenant-V2/`), qui prime (voir §0). Plan V1 : `docs/specs/08_PLAN_CHANTIERS.md`. Plan V2 par vagues : `docs/cdc-v2/03-PLAN-IMPLEMENTATION.md`.

---

## 2. Persona de codage non négociable

Tu codes comme un·e élève brillant·e et scolaire en master d'informatique qui rend un devoir noté sur :

1. **L'élégance** : code lisible avant d'être astucieux. Mieux vaut 30 lignes claires que 5 lignes obscures.
2. **La structure** : separation of concerns radicale, DRY systématique, architecture extensible (ajouter une fonctionnalité = un ajout dans un fichier de config, pas un refacto).
3. **La pédagogie** : commentaires JSDoc/TSDoc abondants en français pour le métier, anglais pour le technique standard. Quelqu'un·e qui apprend doit pouvoir lire ton code et comprendre.
4. **La rigueur** : TypeScript strict, pas de `any`, pas de `@ts-ignore` sans justification écrite en commentaire. Tests unitaires pour toute logique métier complexe (votes, permissions, paiements, anonymisation).
5. **L'exhaustivité** : voir section 4. C'est non négociable.

Trois publics liront ton code :
- des senior·es militant·es qui contribueront (peu d'expérience JS moderne)
- des débutant·es qui apprendront en lisant
- Lilou/Ben qui maintient

**Tu n'es pas un agent qui « vibe-code ».** Tu produis un code qu'on pourrait corriger en classe et noter A+. Si une partie de ton code te ferait perdre des points dans un jury de master info, refactore avant de livrer.

---

## 3. Règle d'or de non-invention

**Tu n'inventes RIEN qui relève du fond politique, éditorial ou architectural.**

### Ce que tu as le droit d'inventer (technique pur)

- Noms de fonctions, de variables, de classes, de tables et colonnes SQL.
- Libellés utilitaires d'UI : « Charger plus », « Fermer », « Réessayer », « Voir tout », « Retour », « Suivant ».
- Valeurs par défaut techniques : pagination (20 résultats), durées de timeout, tailles de lots.
- Catégories techniques fonctionnelles d'un marché solidaire ou d'un sondage (vêtements, mobilier, etc.).
- Messages d'erreur de validation (« le format de l'email semble incorrect »).
- Microcopy purement fonctionnel d'aide utilisateurice.
- Schémas de données pas explicitement spécifiés (timestamps, slugs, soft delete, etc.).
- Patterns de code (Repository, Service, Adapter, etc.) si justifiés.

### Ce que tu N'AS PAS le droit d'inventer (fond)

- **Slogans, surtitres, sous-titres, taglines** du site ou des pages.
- **Textes des pages éditoriales** : Doctrine, Commune libre, Assemblée Confédérale, Monnaie 99-coin, FAQ, Ressources, À propos, Mentions légales.
- **Argumentaires** politiques sur quoi que ce soit.
- **Fonctionnalités, pages, sections, espaces, sous-espaces** non listés **dans le CDC V2 (`docs/cdc-v2/CDC-Maintenant-V2/`) OU dans `docs/specs/01_ARCHITECTURE.md`**. Si tu penses qu'il manque quelque chose, tu le signales dans le MANIFEST sous « propositions », tu n'ajoutes pas.
- **Termes du vocabulaire fixé** dans `docs/specs/03_VOCABULAIRE.md`. Tu ne renommes pas « adhérent·e » en « membre », tu ne traduis pas « Décider » en « Voter », etc.
- **Organisations partenaires, premiers signataires, citations** sauf fournis explicitement.
- **Palette, typographie, iconographie, identité visuelle** au-delà de ce que pose `docs/specs/04_DESIGN-TOKENS.md`.
- **Ton spécifique** non documenté pour les pages où le texte est marqué « à faire ».

### Conduite face à un trou de contenu

Tu mets un **placeholder visible** dans l'UI :
- `[TITRE À METTRE]` pour un titre manquant.
- `[TEXTE À FAIRE — chapô court de 2-3 phrases présentant la page]` pour un texte attendu, avec une description du rôle du texte.
- `[NOM DE LA PERSONNE]`, `[LIEN À FOURNIR]` pour des données factuelles.
- `[CITATION À FOURNIR]` pour les citations attribuables.

Et tu ajoutes ces placeholders dans le MANIFEST du chantier, sous une rubrique **« Contenus à arbitrer »**, avec pour chacun : où il se trouve, ce qu'il est censé contenir, son emplacement dans le fichier. Lilou/Ben arbitre en langage naturel après lecture, à partir de la liste centralisée.

### Conduite face à une incertitude technique

Si une décision technique non triviale n'est pas tranchée par les specs, tu :

1. Identifies clairement l'incertitude.
2. Proposes 2 ou 3 options avec leurs trade-offs.
3. Donnes ta recommandation argumentée.
4. **Attends la décision de Lilou/Ben** avant d'avancer sur cette partie.
5. Si la suite du chantier dépend de cette décision, tu mets ce chantier en pause et avances sur autre chose ; sinon tu marques avec `// CHANTIER-EN-ATTENTE-DE-DÉCISION-LL/B` et tu continues.

### Pourquoi cette règle

Le risque d'inventer du fond, c'est double : (a) dénaturer le ton politique de Maintenant! par des formulations qui ne sont pas les siennes ; (b) ajouter de la complexité architecturale qui devra être refactorée plus tard, ce qui fout du bordel dans le code. Mieux vaut un placeholder explicite qu'une invention plausible.

---

## 4. Exhaustivité : la règle d'exécution

**Rien d'à moitié fait dans un chantier livré.** Aucun de ceux-ci n'est tolérable :

- Un bouton sans action.
- Un lien vers une page inexistante ou « lorem ipsum ».
- Une étoile de notation qui ne s'enregistre pas.
- Un formulaire qui n'a pas de validation réelle.
- Un compteur qui n'incrémente pas.
- Un onglet vide ou qui crash.
- Un état utilisateurice non géré (vide, chargement, erreur, succès).
- Une page accessible par un chemin qui crash.
- Un service réservable qu'on ne peut pas réserver.
- Une cagnotte qu'on ne peut pas alimenter (au moins en mock).

**Avant de déclarer un chantier terminé, tu fais cette checklist sans exception** :

1. `npm run dev` localement.
2. Tu navigues comme une vraie personne sur tout ce que tu as ajouté ou modifié.
3. Tu cliques sur **chaque bouton** introduit.
4. Tu remplis **chaque formulaire** : au moins une fois avec des valeurs valides, une fois avec des valeurs invalides.
5. Tu navigues **chaque lien** vers sa destination réelle.
6. Tu déclenches chaque état (chargement, vide, erreur, succès).
7. Tu lances la suite Playwright E2E qui doit passer en vert.
8. Tu lances `npm run lint` et `npm run typecheck` : zéro warning, zéro erreur.
9. Tu produis le `MANIFEST.md` du chantier (voir section 5).
10. Tu fais un commit avec message conventionnel.

Si quelque chose ne peut pas être pleinement implémenté pour une raison externe (API non connectée, donnée non fournie, dépendance d'un autre chantier), tu le déclares explicitement dans le MANIFEST. Pas en `// TODO` perdu dans le code, pas en commentaire de fin. **Dans le MANIFEST, en haut, dans la rubrique appropriée.**

---

## 5. MANIFEST.md à la fin de chaque chantier

À la fin de chaque chantier, tu crées (ou mets à jour) `docs/manifests/phase-N-chantier-N.X.md` au format ci-dessous. Pas de variations.

```markdown
# Manifest — Phase N, Chantier N.X : <titre du chantier>

**Date de fin** : YYYY-MM-DD
**Branche** : feature/phase-N-chantier-N.X-...
**Commit final** : <SHA court>
**Durée approximative** : <X sessions Claude Code>

## Livré et fonctionnel

- [x] Fonctionnalité A : description courte, fichiers concernés, tests verts.
- [x] Fonctionnalité B : idem.

## Livré partiellement

- [ ] Fonctionnalité C : ce qui marche, ce qui ne marche pas, pourquoi, ce qu'il faut pour finir.

## Non livré (et pourquoi)

- [ ] Fonctionnalité D : raison (ex « dépend de l'API Brevo non connectée », « attend l'arbitrage de Lilou/Ben sur Q11 »), décision attendue.

## Contenus à arbitrer

- [ ] `app/(public)/comprendre/doctrine/page.tsx` ligne 12 : `[TEXTE À FAIRE]` — chapô de présentation, 2-3 phrases, ton sobre éditorial.
- [ ] `app/(public)/page.tsx` ligne 47 : `[CITATION À FOURNIR]` — citation à mettre en valeur sur la home.

## Décisions techniques prises (ADR à archiver)

- ADR-NNN : <titre court>. Voir `docs/ARCHITECTURE-decisions.md`.

## Incertitudes techniques résolues avec Lilou/Ben

- Question : ... Réponse de Lilou/Ben : ...

## Tests

- Unitaires : X tests, tous verts (`npm test`).
- E2E Playwright : Y scénarios couvrant les flux principaux, tous verts. Captures dans `tests/screenshots/phase-N-chantier-N.X/`.
- Lint, typecheck : verts.
- Lighthouse : performance X, accessibilité Y, best-practices Z (sur la page principale du chantier).

## Notes pour les chantiers suivants

- Point d'attention 1 : ...
- Point d'attention 2 : ...
```

Le MANIFEST est ce que Lilou/Ben lit en priorité à chaque fin de chantier. C'est le contrat de fin. Il doit être honnête, exhaustif et auto-suffisant.

---

## 6. Stack technique et environnements

### Stack actée

| Brique | Choix | Statut |
|---|---|---|
| Framework | Next.js 14+ (App Router) | À installer en chantier 0.1 |
| Langage | TypeScript strict | Idem |
| BDD | Supabase Postgres (région Francfort) | Compte à créer/utiliser |
| Auth | Supabase Auth | Idem |
| Storage médias | Supabase Storage | Idem |
| Email transactionnel + newsletter | Brevo | **Mock par défaut tant que pas d'API** |
| Paiements | Stripe Checkout + Stripe Connect | Mode test gratuit dispo |
| Visio Décider | LiveKit self-hosted | Local via Docker en attendant |
| Anti-bot | Cloudflare Turnstile | Clé free tier dispo |
| T99CP | Polygon, contract `0x7275cfc83f486d53ca1379fc1f8025490bdcc79a` | Testnet Mumbai en dev |
| Hébergement front | **En dev : local** ; **en prod : Cloudflare Pages** quand Lilou/Ben y aura accès | Pas de Vercel, pas de Netlify |
| Cartes | MapLibre GL JS | Libre |
| Styles | Tailwind CSS + CSS variables (depuis `04_DESIGN-TOKENS.md`) | À installer |
| Composants UI | shadcn/ui | À installer |
| Validation | Zod + react-hook-form | À installer |
| Tests | Vitest (unitaires) + Playwright (E2E) | À installer |
| Lint/format | Biome | À installer |
| Monitoring | Sentry (free tier, anonymisé RGPD) | À configurer plus tard |

### Pattern adapter avec mock par défaut (pour TOUTES les API externes)

Chaque API externe a sa couche d'abstraction et **deux implémentations** : mock par défaut + réelle. La variable d'env switche.

Structure type :

```
lib/email/
├── types.ts                 // interface EmailService
├── MockEmailService.ts      // log console + fichier /var/emails/*.json
├── BrevoEmailService.ts     // implémentation réelle
└── index.ts                 // factory : choisit selon EMAIL_PROVIDER

lib/payments/
├── types.ts                 // interface PaymentService
├── MockPaymentService.ts    // simule un paiement réussi/échoué
├── StripePaymentService.ts  // implémentation réelle (mode test ou prod)
└── index.ts

lib/livekit/
├── types.ts
├── MockLiveKitService.ts    // UI sans WebRTC réel
├── LiveKitService.ts        // implémentation réelle
└── index.ts

lib/t99cp/
├── types.ts
├── MockT99CPService.ts      // simule des transactions Polygon
├── PolygonT99CPService.ts   // implémentation réelle (testnet ou mainnet)
└── index.ts
```

Variables d'env de switching :

```dotenv
EMAIL_PROVIDER=mock           # ou "brevo" en prod
PAYMENT_PROVIDER=stripe_test  # ou "stripe_live" en prod
LIVEKIT_PROVIDER=mock         # ou "livekit"
T99CP_NETWORK=mumbai          # ou "polygon_mainnet"
TURNSTILE_PROVIDER=cloudflare # ou "mock" en local si besoin
```

**Conséquence importante** : le site fonctionne à 100 % en local sans aucune API connectée. Les flux utilisateurice sont testables bout-en-bout. Les tests E2E passent. Le jour où Lilou/Ben branche Brevo, la variable change, c'est branché.

### Pivot Supabase + local d'abord, Cloudflare ensuite

**En dev** : `npm run dev` sur Next.js → localhost:3000 → tape sur l'instance Supabase distante (région Francfort). Pas de Cloudflare.

**En prod future** (quand Lilou/Ben aura Cloudflare accessible) : `next build` + déploiement via `@cloudflare/next-on-pages` (adapter officiel). BDD reste sur Supabase. Aucune migration de données.

**Pas de Vercel.** Si une dépendance demande Vercel KV, Vercel Postgres, ou des fonctionnalités Vercel-spécifiques, tu signales et tu cherches une alternative.

---

## 7. Conventions de code et de fichiers

Voir `docs/specs/02_STACK.md` pour la structure de dossiers complète. Rappels essentiels :

- Tout est en TypeScript strict. Pas d'option `noImplicitAny: false`. Pas de `any`.
- Variables et fonctions métier en français (`creerCommuneLibre`, `signerPetition`). Variables techniques en anglais (`getServerSession`, `fetchData`).
- Tables et colonnes SQL : snake_case en français pour le métier (`commune_libre`, `appartenance_commune`), anglais pour le technique (`created_at`, `updated_at`).
- Imports : alias `@/` pour la racine, jamais d'import relatif au-delà de `..`.
- 1 composant par fichier, sauf composants triviaux internes au fichier.
- Server Components par défaut. `'use client'` uniquement si nécessaire (hooks, événements DOM, state local).
- Server Actions pour les mutations simples. API routes pour les webhooks Stripe/Brevo.
- RLS Supabase activée sur toutes les tables avec données personnelles.

### Convention de commit

```
phase 0 - chantier 0.1 - initialisation Next.js + Tailwind + Biome
phase 1 - chantier 1.2 - flux inscription email + magic link
phase 3 - chantier 3.1 - pétitions modération a priori + compteur stretch
fix - phase 3 - chantier 3.1 - bug compteur stretch à 90%
```

### Convention de branche

```
main             → production (protégée)
develop          → préproduction (protégée)
feature/phase-N-chantier-N.X-description-courte
hotfix/description-courte
```

### Convention ADR

Toute décision technique notable va dans `docs/ARCHITECTURE-decisions.md` au format Contexte / Décision / Conséquences / Alternatives considérées. Numérotation : ADR-001, ADR-002, etc.

---

## 8. Stratégie de session Claude Code

Pour rendre le développement soutenable côté Lilou/Ben (pas 60 sessions enchaînées avec bugs), tu utilises activement :

### 8.1 Lecture systématique de ce CLAUDE.md

À CHAQUE démarrage, tu lis intégralement ce fichier. C'est ta mémoire entre sessions.

### 8.2 `/compact` régulier

Dès que la session dépasse ~60-70 % de la fenêtre de contexte, tu utilises `/compact` pour compresser sans tout perdre. Tu continues dans la même session.

### 8.3 Subagents pour les tâches répétitives

Pour les tâches qui se répètent à l'identique (ex : créer les 30 composants UI bas niveau, importer les 2100-2300 communes pré-créées, écrire les tests unitaires d'un module), tu lances un subagent dédié. Ça libère ton contexte principal.

### 8.4 MCP servers à brancher

Au démarrage du chantier 0.1, tu configures les MCP servers suivants si disponibles :

- **MCP GitHub** : pour commit, push, ouvrir des PR, lire des issues sans intervention.
- **MCP Supabase** : pour exécuter des migrations SQL, lire le schéma, requêter en lecture pour debug.
- **MCP filesystem** : pour les opérations de fichiers complexes.

### 8.5 Tests E2E qui détectent les liens morts

Le pipeline CI inclut une étape Playwright qui :

1. Démarre `next dev`.
2. Crawl toutes les pages internes du site (départ depuis `/`).
3. Clique sur tous les boutons.
4. Soumet tous les formulaires (avec valeurs valides et invalides).
5. Vérifie qu'aucune navigation ne renvoie 404, 500 ou page blanche.

Un seul lien mort = build rouge = chantier non terminé. **Cette étape rend impossible de livrer du code partiel sans le déclarer.**

### 8.6 Hooks pre-commit

Hook git pre-commit :

- Biome lint + format
- TypeScript check
- Tests unitaires sur les fichiers modifiés

Un commit qui ne passe pas est refusé. Pas de contournement.

### 8.7 Rôle de Lilou/Ben pendant le projet

Lilou/Ben n'est PAS là pour :
- Debugger des liens cassés (les tests E2E s'en chargent).
- Te répéter le vocabulaire ou les conventions (ce CLAUDE.md s'en charge).
- Vérifier que tu as fait ce qu'iel a demandé (le MANIFEST s'en charge).

Lilou/Ben est là pour :
- Arbitrer les questions politiques (Q5 services par statut, Q11 hues si on en rouvrait, contenus à arbitrer du MANIFEST).
- Valider les MANIFEST de fin de chantier.
- Trancher les incertitudes techniques que tu lui remontes.
- Te fournir les données externes (cartographie communes, citations, etc.).

---

## 9. Vocabulaire fixé (rappel critique)

Voir `docs/specs/03_VOCABULAIRE.md` pour le référentiel complet. Termes critiques à ne JAMAIS modifier :

- **Maintenant!** (avec capitale et point d'exclamation, partout).
- **Cosec gé** (jamais « président·e »).
- **Adhérent·e** (jamais « membre » seul, qui est ambigu).
- **Sympathisant·e**, **signataire**, **donateur·ice** : statuts distincts, voir vocabulaire.
- **99-coin (T99CP)** avec **tiret obligatoire**. T99CP = The 99 Coin Project, parenthèses à la première occurrence.
- **Décider** à l'infinitif (nom de l'espace).
- **Levée d'objections** (jamais « consentement »).
- **Jugement majoritaire** (méthode Balinski-Laraki).
- **Empouvoirement** vs **Captation de pouvoir**.
- **Moments solidaires** (« Moments » au pluriel toujours).
- **Commune libre**, **Assemblée Confédérale des Communes et Territoires Libres** (nom complet).
- **Maintenant Médias** (pas « Maintenant Média »).
- **Cotisation solidaire** (forme spécifique de cagnotte).

---

## 10. Règles d'écriture (rappel critique)

Voir `docs/specs/03_VOCABULAIRE.md` §6 pour les règles complètes.

- **Pas de tirets cadratins (—)** dans les textes affichés, dans les commentaires de code, dans les MANIFEST, dans la doc. Marqueur IA. Tu utilises deux-points, parenthèses, virgules.
- **Inclusivité variée** : épicène d'abord, sinon point médian, sinon doublet, sinon néologismes mots-valises **sans point** (organisateurices, travailleureuses, copaines). À doser, pas partout.
- **Pas de jargon académique pédant** (eschatologique, processuel, épistémique, heuristique, praxis, dialectique, ontologique).
- **Apostrophes typographiques** (’) plutôt que droites (') si la mise en page le permet.

---

## 11. État courant du projet

> Tu mets à jour cette section à la fin de chaque chantier.

**Dernière mise à jour** : 2026-05-27 (suite — VAGUE 4 pagination communes + IBAN + couleur hex)
**Dernier chantier terminé** : V2.4.70 (`lib/couleur-hex.ts` + 25 tests) — sur `main` (tip `3a95160`). 704 tests verts. 5 helpers : `estHexValide`, `normaliserHex`, `hexEnRgb`, `luminanceRelative` (WCAG), `contrastTexte` (seuil 0.179).
**Dernier chantier terminé (antérieur)** : V2.4.69 (`lib/iban.ts` + 14 tests) — sur `main` (tip `da35468`). ISO 13616 mod 97, longueurs par pays (12 pays), `normaliserIban`/`estIbanValide`/`formaterIban`.
**Dernier chantier terminé (antérieur)** : V2.4.68 (Pagination sur admin communes — 35 011 lignes) — sur `main` (tip `84e6299`). 2ᵉ usage Pagination, PAR_PAGE=50, vraiment utile sur le référentiel des communes.
**Dernier chantier terminé (antérieur)** : V2.4.67 (branchement `Pagination` sur admin personnes) — sur `main` (tip `641a62a`). Premier vrai usage du composant : `listerPersonnesAdminPagine` retourne `{lignes, total}`, PAR_PAGE=50, count exact, second appel ciblé si page>1.
**Dernier chantier terminé (antérieur)** : V2.4.66 (exports CSV moments + médias + sondages) — sur `main` (tip `c8e94ef`). 3 routes admin, BOM UTF-8, filename horodaté.
**Dernier chantier terminé (antérieur)** : V2.4.65 (`lib/capitalisation.ts` + 15 tests) — sur `main` (tip `4a2e813`). 665 tests verts. 3 helpers : `capitaliser`, `titreCase` (Title Case avec séparateurs unicode), `decapitaliser`.
**Dernier chantier terminé (antérieur)** : V2.4.64 (`lib/uuid.ts` + 12 tests) — sur `main` (tip `fbc5d4a`). 650 tests verts. `estUuidValide` (v1-v5, case insensible) + `normaliserUuid`.
**Dernier chantier terminé (antérieur)** : V2.4.63 (`lib/code-postal-fr.ts` + 14 tests) — sur `main` (tip `ebe82a2`). `estCodePostalFrValide` + `extraireDepartementFr` (métropole 2 chiffres, DROM 97x/98x 3 chiffres).
**Dernier chantier terminé (antérieur)** : V2.4.62 (`lib/age.ts` + 12 tests) — sur `main` (tip `2c5d7f9`). `calculerAge` (tient compte mois/jour) + `estMajeur`.
**Dernier chantier terminé (antérieur)** : V2.4.61 (`lib/telephone-fr.ts` + 19 tests) — sur `main` (tip `4aca486`). 612 tests verts. 3 helpers : `estTelephoneFrValide`, `normaliserTelephoneFr`, `formaterTelephoneFr`.
**Dernier chantier terminé (antérieur)** : V2.4.60 (admin réservations `/admin/national/reservations`) — sur `main` (tip `9eab993`). Vue globale, recherche message, double filtre statut+type (cycle D8 complet), motif de décision en exergue.
**Dernier chantier terminé (antérieur)** : V2.4.59 (`lib/url.ts` + 12 tests) — sur `main` (tip `99a16ea`). 593 tests verts. 4 helpers : `urlAbsolue`, `lienPartageMailto`, `lienPartageMastodon`, `extraireDomaine`.
**Dernier chantier terminé (antérieur)** : V2.4.58 (composant `Pagination` UI réutilisable) — sur `main` (tip `a82ffc6`). Server Component branché sur `lib/pagination.ts`, fenêtre + ellipses, préserve les params de recherche, exporté depuis `components/ui`.
**Dernier chantier terminé (antérieur)** : V2.4.57 (admin campagnes `/admin/national/campagnes`) — sur `main` (tip `f88cc9e`). Filtres statut, raison de rejet visible.
**Dernier chantier terminé (antérieur)** : V2.4.56 (`estSlugValide` + 8 tests) — sur `main` (tip `ea7afea`). 581 tests verts. Validation idempotente des slugs en paramètre.
**Dernier chantier terminé (antérieur)** : V2.4.55 (`lib/pagination.ts` + 13 tests) — sur `main` (tip `2c9391f`). `paginer({page, parPage, total})` + `lirePageDepuisParams`, 1-indexé côté UI, traduit en range Supabase 0-indexé.
**Dernier chantier terminé (antérieur)** : V2.4.54 (admin médias `/admin/national/medias`) — sur `main` (tip `9345164`). Double filtre statut+type (9 types), vignette 96px, badge provenance externe.
**Dernier chantier terminé (antérieur)** : V2.4.53 (`lib/distance-gps.ts` + 10 tests, haversine) — sur `main` (tip `d13b115`). 560 tests verts. `distanceMetres` / `distanceKmArrondie` / `formaterDistance`. Utile pour cartes « près de moi ».
**Dernier chantier terminé (antérieur)** : V2.4.52 (RSS feed `/feed-journal.xml` journal-affiche) — sur `main` (tip `9fb68f3`). Distinct du flux principal, cache 1h.
**Dernier chantier terminé (antérieur)** : V2.4.51 (admin moments solidaires `/admin/national/moments`) — sur `main` (tip `fe6eca5`). Double filtre statut (6) + type (8), tri date décroissante.
**Dernier chantier terminé (antérieur)** : V2.4.50 (`lib/email-valide.ts` + 13 tests) — sur `main` (tip `4b26879`). 550 tests verts. Validation pragmatique + normalisation (trim+lowercase).
**Dernier chantier terminé (antérieur)** : V2.4.49 (`lib/temps-lecture.ts` + 11 tests + branchement) — sur `main` (tip `be9f190`). 200 mots/min, min 1 min, ligne d'attribution média gagne « · X min de lecture ».
**Dernier chantier terminé (antérieur)** : V2.4.48 (admin sondages `/admin/national/sondages`) — sur `main` (tip `29015d2`). Double filtre statut + mode, recherche titre/question, nb d'options.
**Dernier chantier terminé (antérieur)** : V2.4.47 (`lib/format-date.ts` + 7 tests) — sur `main` (tip `349a285`). 525 tests verts. 4 helpers centralisés : `formaterDateCourte`, `formaterDateLongue`, `formaterDateHeure`, `formaterDateIso`.
**Dernier chantier terminé (antérieur)** : V2.4.46 (healthcheck `/api/health`) — sur `main` (tip `fbdf253`). 200/503 selon état Supabase, JSON avec uptime + timestamp + checks, no-store.
**Dernier chantier terminé (antérieur)** : V2.4.45 (admin groupes d'entraide locaux) — sur `main` (tip `07d51b4`). Recherche par nom/zone, filtre statut, badges outils activés.
**Dernier chantier terminé (antérieur)** : V2.4.44 (`lib/format-t99cp.ts` + 10 tests) — sur `main` (tip `03a6d54`). 518 tests verts. Extraction du formaterT99CP avec BigInt pour préservation précision, suffixe configurable.
**Dernier chantier terminé (antérieur)** : V2.4.43 (`lib/texte-apercu.ts` + 10 tests) — sur `main` (tip `a979dd8`). 3 helpers : `tronquerCaracteres` (respect mots), `tronquerMots`, alias `apercu`.
**Dernier chantier terminé (antérieur)** : V2.4.42 (RSS feed `/feed.xml` + auto-discovery) — sur `main` (tip `8cb29ed`). 30 articles, format RSS 2.0 + Atom-compatible, cache CDN 15min, `<link rel="alternate" type="application/rss+xml">` dans le `<head>` du site.
**Dernier chantier terminé (antérieur)** : V2.4.41 (`lib/pluriel.ts` + 12 tests) — sur `main` (tip `654dc4e`). 498 tests verts. Helpers `accorder` et `compter` pour remplacer `${n > 1 ? 's' : ''}` répété partout.
**Dernier chantier terminé (antérieur)** : V2.4.40 (sitemap.xml dynamique + robots.txt) — sur `main` (tip `c3e17b7`). 35 pages statiques + URLs publiées agrégées en parallèle, lastmod = updated_at, cache CDN 1h ; robots.txt cache 24h.
**Dernier chantier terminé (antérieur)** : V2.4.39 (exports CSV cagnottes + mobilisations) — sur `main` (tip `ac95df1`). Cagnottes avec montants agrégés via `cagnotte_compteur`.
**Dernier chantier terminé (antérieur)** : V2.4.38 (export CSV pétitions) — sur `main` (tip `11a6bbf`). 8 colonnes avec `nombre_signatures` via jointure sur `petition_compteur`.
**Dernier chantier terminé (antérieur)** : V2.4.37 (exports CSV communes + fédérations) — sur `main` (tip `fd84beb`). 2 routes GET admin, BOM UTF-8 pour Excel, filename horodaté.
**Dernier chantier terminé (antérieur)** : V2.4.36 (`lib/export-csv.ts` RFC 4180 + 13 tests + endpoint export personnes) — sur `main` (tip `cf6ac54`). 486 tests verts.
**Dernier chantier terminé (antérieur)** : V2.4.35 (page admin `/admin/national/federations` filtrable) — sur `main` (tip `afb1bb3`). Compteur communes par fédération via 1 requête agrégée (anti N+1), filtres mot-clé + type.
**Dernier chantier terminé (antérieur)** : V2.4.34 (`lib/format-euros.ts` + 10 tests) — sur `main` (tip `4024f63`). 2 variantes `formaterEurosDepuisCentimes` + `formaterEuros`. Résilient à l'espace insécable étroite U+202F. 473 tests verts.
**Dernier chantier terminé (antérieur)** : V2.4.33 (page admin `/admin/national/communes` filtrable) — sur `main` (tip `c61a651`). 3 compteurs (Total/Libres/Coquilles), filtres mot-clé + département + statut, lien vers page publique.
**Dernier chantier terminé (antérieur)** : V2.4.32 (helper `formaterRelativePassee` + 15 tests + branchement dashboard) — sur `main` (tip `708dd82`). Dual de `formaterRelativeAVenir`, retourne « il y a X min/h/jours/mois/an(s) ». Dashboard membre : colonne date des activités récentes passe de date statique à temps relatif avec `title=` au survol.
**Dernier chantier terminé (antérieur)** : V2.4.31 (extraire `formaterTailleOctets` + 5 tests) — sur `main` (tip `718b29c`). 448 tests verts.
**Dernier chantier terminé (antérieur)** : V2.4.30 (extraire `trierParPertinence` + 7 tests) — sur `main` (tip `4a54cd1`). Non-mutation garantie, insensible casse, prefixe avant infixe, longueur à égalité.
**Dernier chantier terminé (antérieur)** : V2.4.29 (page admin `/admin/national/personnes` filtrable) — sur `main` (tip `6ab2bf8`). Recherche email/prénom/nom (ilike OR), filtre par statut (tous/actifs/anonymisés/suppression), badges visuels.
**Dernier chantier terminé (antérieur)** : V2.4.28 (helper `slugifier` commun + 9 tests) — sur `main` (tip `91a7506`). Extrait des slugify locaux Décider+Journal qui se répétaient. DRY -16 lignes.
**Dernier chantier terminé (antérieur)** : V2.4.27 (dashboard admin enrichi : état modération en tête) — sur `main` (tip `e813175`). Alerte « N éléments en attente » + 6 cartes file modération en haut de `/admin`.
**Dernier chantier terminé (antérieur)** : V2.4.26 (footer enrichi avec colonne Explorer) — sur `main` (tip `23a5bb5`). 4e colonne : Recherche / Agenda / Cartes / Décider / Maintenant Médias.
**Dernier chantier terminé (antérieur)** : V2.4.25 (bibliothèque d'images admin `/admin/national/images`) — sur `main` (tip `d0c0d58`). Liste fichiers Supabase Storage bucket `media`, filtres par préfixe, vignettes + métadonnées + URL clickable.
**Dernier chantier terminé (antérieur)** : V2.4.24 (recherche globale `/recherche`) — sur `main` (tip `494a47d`). 11 requêtes ilike parallèles sur pétition/mobilisation/cagnotte/commune/fédération/média/sondage/salle/journal/groupe/campagne, tri pertinence, icône Search dans header.
**Dernier chantier terminé (antérieur)** : V2.4.23 (compteur réunions à venir dans dashboard membre) — sur `main` (tip `9cd163f`). 16e requête parallèle dans `chargerDashboardMembre`, nouvelle carte « Réunions à venir » liée à `/profil/decider`.
**Dernier chantier terminé (antérieur)** : V2.4.22 (page `/profil/decider` Mes réunions Décider) — sur `main` (tip `69a76c4`). Prochaines réunions visibles (RLS) + dernières décisions. Dashboard membre lié à `Mes réunions Décider` + `Mes créations` (qui n'était pas lié).
**Dernier chantier terminé (antérieur)** : V2.4.21 (section « Décisions récentes » sur index Décider) — sur `main` (tip `77b990a`). Helper `listerDernieresReunionsAvecPV`, grille 2 colonnes des 6 dernières réunions terminées avec PV.
**Dernier chantier terminé (antérieur)** : V2.4.20 (prochaines réunions agrégées sur index Décider) — sur `main` (tip `b9eb4f5`). Helper `listerProchainesReunionsToutesSalles` avec jointure salle, 10 prochaines réunions cliquables.
**Dernier chantier terminé (antérieur)** : V2.4.19 (édition d'une édition journal existante admin) — sur `main` (tip `dc0effe`). Server Action `mettreAJourEditionAction` (6 champs partiels), formulaire inline visible aux admins sur `/s-informer/journal/[slug]`.
**Dernier chantier terminé (antérieur)** : V2.4.18 (page individuelle de réunion Décider + édition admin) — sur `main` (tip `592c6f8`). `/s-informer/decider/[slug]/[reunionId]` avec rendu Markdown OJ+PV, formulaire admin (statut/OJ/PV), helper `chargerReunionParId`, action `mettreAJourReunionAction`.
**Dernier chantier terminé (antérieur)** : V2.4.17 (téléversement image dans formulaire journal) — sur `main` (tip `e56e905`). Remplace le champ URL nu de la couverture par `ChampImageObjet` (V2.3.4) + `TeleverseurImage` (V2.0.3) ; téléversement direct via Supabase Storage, préfixe `journal-affiche`.
**Dernier chantier terminé (antérieur)** : V2.4.16 (extraire `MarkdownLeger` en module réutilisable) — sur `main` (tip `3eea44f`). `components/contenu/MarkdownLeger.tsx` partagé entre `ContenuEditableAdmin` (CMS) et la page individuelle du journal-affiche, qui rend maintenant le contenu en HTML structuré au lieu d'un `<pre>`.
**Dernier chantier terminé (antérieur)** : V2.4.15 (planifier réunion Décider inline admin) — sur `main` (tip `bfdf714`). Formulaire admin-only sur `/s-informer/decider/[slug]` (titre, début/fin, mode, ordre du jour) qui appelle `creerReunionAction` (V2.4.12), visible si `estAdminCourant() = true`.
**Dernier chantier terminé (antérieur)** : V2.4.14 (file de modération globale `/admin/moderation`) — sur `main` (tip `1e04f0f`). 15 compteurs « en attente d'action » par module, classés du plus urgent au moins urgent, badges danger/warning/default selon nombre, lien direct vers chaque console spécialisée. `lib/admin/file-moderation.ts` (Promise.all des compteurs `count exact head only`).
**Dernier chantier terminé (antérieur)** : V2.4.13 (`BoutonAdminEditer` systématique sur 9 pages d'espaces individuels) — sur `main` (tip `1b51896`).
**Chantiers V2.4 livrés (résumé)** : V2.4.1 CMS minimal, V2.4.2 `estAdminCourant`+`PageEditorialeCMS`, V2.4.3 cartes étendues+hébergement, V2.4.4 agenda agrégé+catch-all, V2.4.5 dashboard membre profond, V2.4.6 console contenus éditoriaux, V2.4.7 Mes créations (14 axes), V2.4.8 `BoutonAdminEditer`, V2.4.9 migration 10 pages CMS, V2.4.10 Décider MVP, V2.4.11 Journal-affiche MVP, V2.4.12 consoles admin Décider/Journal, V2.4.13 `BoutonAdminEditer` partout, V2.4.14 file modération globale, V2.4.15 planifier réunion Décider, V2.4.16 `MarkdownLeger` réutilisable, V2.4.17 upload image journal. **3 nouvelles migrations en attente distant** : `20260527130000_contenu_editorial.sql`, `20260527140000_decider.sql`, `20260527150000_journal_affiche.sql` (en plus des 10 V2.x déjà en attente). **13 migrations totales** à appliquer au matin.
**Dernier chantier terminé (antérieur)** : V2.3.46 (tests unitaires des helpers purs filtres + compter-membres) — 14 nouveaux tests, total 427 verts.
**Dernier chantier terminé (antérieur)** : V2.3.45 (lien recherche depuis header réseau).
**Dernier chantier terminé (antérieur)** : V2.3.44 (page recherche réseau social /s-informer/reseau/recherche) — personnes par numéro M+7/prénom + posts par texte.
**Dernier chantier terminé (antérieur)** : V2.3.43 (page admin audit journal D8bis /admin/national/audit) — lecture des 200 dernières transitions D8 avec auteur respectant visibilité.
**Dernier chantier terminé (antérieur)** : V2.3.42 (stats admin étendues V2) — 11 indicateurs ajoutés (caisses, soldes, transactions sortantes, réservations, membres campagnes/GT/groupes).
**Dernier chantier terminé (antérieur)** : V2.3.41 (helper compterMembresEspace + formaterMembres) — affichage « X membres » sur pages GT et campagne.
**Dernier chantier terminé (antérieur)** : V2.3.40 (filtre par type d'offre dashboards réservation) — 2e axe de filtre URL ?statut=X&type=Y.
**Dernier chantier terminé (antérieur)** : V2.3.39 (page index /co-construire liste des GT) + lien GT actif dans Mes groupes.
**Dernier chantier terminé (antérieur)** : V2.3.38 (page individuelle GT thématique /co-construire/[slug] + Rejoindre/Quitter).
**Dernier chantier terminé (antérieur)** : V2.3.37 (notif `moderation_me_concerne` sur retrait contenu réseau) — auteur du contenu reçoit une cloche avec la raison du retrait.
**Dernier chantier terminé (antérieur)** : V2.3.36 (confirmer/annuler transaction sortante côté admin) — Server Actions confirmerTransactionSortanteAction + annulerTransactionSortanteAction. Composant client BoutonsTransactionSortante branché dans détail caisse.
**Dernier chantier terminé (antérieur)** : V2.3.35 (téléchargement justificatif URL signée 60s) — Server Action obtenirUrlJustificatifAction + composant client LienJustificatif. Branché dans liste transactions sortantes.
**Dernier chantier terminé (antérieur)** : V2.3.34 (bouton Rejoindre/Quitter campagne) — Server Actions rejoindreCampagne + quitterCampagne. Branché dans /mobiliser/campagnes/[slug]. Utilise concrètement appartenance_campagne V2.3.29.
**Dernier chantier terminé (antérieur)** : V2.3.33 (UI initier reversement D12bis) — Server Action initierTransactionSortanteAction + FormulaireInitierReversement avec ChampDocument. Branché dans détail caisse.
**Dernier chantier terminé (antérieur)** : V2.3.32 (ChampDocument + adapter Storage justificatifs) — lib/storage/justificatifs/ (Mock + Supabase). app/actions/justificatif.ts (téléversement réservé admin). components/ui/ChampDocument.tsx (variante ChampImageObjet pour PDF). Bucket Supabase à créer manuellement.
**Dernier chantier terminé (antérieur)** : V2.3.31 (Mes contributions financières côté profil) — lib/mes-contributions.ts + section dans /profil/contributions qui lit transaction_entrante.payeur_personne_id. Totaux par canal.
**Dernier chantier terminé (antérieur)** : V2.3.30 (notifs réseau typées) — refactor poserNotification dans s-informer/reseau/actions.ts. Types reseau_post_commente / reseau_post_soutenu / reseau_message_recu.
**Dernier chantier terminé (antérieur)** : V2.3.29 (appartenance_campagne + Mes groupes 6 axes) — migration locale 20260527120000. Découverte que appartenance_groupe_entraide_local existait déjà en V1 (réutilisée). Page Mes groupes étendue à 6 axes.
**Dernier chantier terminé (antérieur)** : V2.3.28 (liste entrées dans détail caisse + script backfill) — section transaction_entrante dans /admin/national/tresorerie/[caisseId]. scripts/backfill-caisses.ts (--dry-run / --confirm, idempotent).
**Dernier chantier terminé (antérieur)** : V2.3.27 (branchement caisses ↔ flux V1) — lib/caisse-flux.ts (obtenirOuCreerCaisseGlobale/Cagnotte + poserEntreeCaisse idempotent 23505). Branchement dans confirmerDonEuros + faireDonT99CP + confirmerAdhesionEuros + adhererT99CP.
**Dernier chantier terminé (antérieur)** : V2.3.26 (transaction_entrante + solde caisse) — migration locale 20260527110000 (table avec source_type/source_id polymorphe + index unique anti-doublon). lib/caisse-solde.ts (calculerSoldeCaisse + variante batch). Solde affiché dans dashboard et détail caisse.
**Dernier chantier terminé (antérieur)** : V2.3.25 (cloche in-app + branchement D8) — réutilise table V1 notification chantier 8.1. lib/notification.ts + HeaderCloche + /profil/notifications-recues. Branchement dans toutes les Server Actions D8 (V2.3.13-21).
**Fix Ultraplan livré sur branche** : `fix/ci-playwright-multi-browser` (poussée sur GitHub, attend création PR). Diagnostic du doc Ultraplan appliqué intégralement (Playwright Firefox/WebKit filtrés via PLAYWRIGHT_FULL, env Supabase placeholders dans CI, workflow ci-cross-browser.yml mensuel ajouté).
**Dernier chantier terminé (antérieur)** : V2.3.24 (filtres par statut sur dashboard demandeur + factorisation `lib/reservation-filtres.ts`) — sur `main` (tip `d8c524f`). Voir `docs/manifests/v2-3-24-filtres-statut-demandeur.md`.
**Dernier chantier terminé (antérieur)** : V2.3.23 (filtres par statut sur dashboard propriétaire `/profil/demandes-reservations?statut=X`) — barre de 8 chips ronds avec compteurs, filtre côté TS. Voir `docs/manifests/v2-3-23-filtres-statut-dashboard-proprietaire.md`.
**Dernier chantier terminé (antérieur)** : V2.3.22 (page « Mes groupes » côté profil) — sur `main` (tip `7abd237`). 4 axes couverts (communes, fédérations indirect via commune, confédérations indirect via fédération, GT thématiques direct). Voir `docs/manifests/v2-3-22-mes-groupes.md`.
**Dernier chantier terminé (antérieur)** : V2.3.21 (bouton « Signaler un litige » côté propriétaire, transition D8 `acceptee → litige`) — symétrie avec V2.3.16. Voir `docs/manifests/v2-3-21-signaler-litige-proprietaire.md`.
**Dernier chantier terminé (antérieur)** : V2.3.20 (identités caisse + tests helper) — branche `nomAffichageRespectantVisibilite` dans la page de détail caisse + 7 tests Vitest sur le helper pur (413 tests verts maintenant). Voir `docs/manifests/v2-3-20-identites-caisse-tests-identite.md`.
**Dernier chantier terminé (antérieur)** : V2.3.19 (helper `nomAffichageRespectantVisibilite`) — module `lib/reseau/identite.ts` réutilisant la RPC V1 `personne_affichage(cible)` SECURITY DEFINER. Branché dans `HistoriqueTransitions`, `/profil/demandes-reservations`, `/profil/reservations`, `/admin/moderation/reservations`. Voir `docs/manifests/v2-3-19-nom-affichage-visibilite.md`.
**Dernier chantier terminé (antérieur)** : V2.3.18 (page de détail caisse `/admin/national/tresorerie/[caisseId]`) — drill-down lecture seule avec 3 sections (entête + réceptacles + transactions sortantes). Voir `docs/manifests/v2-3-18-detail-caisse.md`.
**Dernier chantier terminé (antérieur)** : V2.3.17 (console admin résolution de litige, `/admin/moderation/reservations`) — arbitrage `litige → confirmee | annulee` avec motif obligatoire. Privilège admin documenté qui contourne `transitionAutorisee`. Voir `docs/manifests/v2-3-17-moderation-litige-reservation.md`.
**Dernier chantier terminé (antérieur)** : V2.3.16 (bouton « Signaler un litige » côté demandeur, transition D8 `realisee → litige`) — sur `main` (tip `a2c0552`). Avec ça le cycle D8 est navigable de bout en bout côté UI : créer → accepter/refuser → marquer réalisée → confirmer / litige / annuler, le tout journalisé via `reservation_journal` (V2.3.15). Voir `docs/manifests/v2-3-16-signaler-litige-reservation.md`.
**Dernier chantier terminé (antérieur)** : V2.3.15 (journal des transitions D8 sur réservation, doctrine D8bis) — migration locale `20260527090000_reservation_journal.sql` (10ᵉ en attente), helpers TS, affichage `<details>` Historique côté demandeur ET propriétaire. Voir `docs/manifests/v2-3-15-journal-transitions-reservation.md`.
**Dernier chantier terminé (antérieur)** : V2.3.14 (bouton « Confirmer » côté demandeur, transition `realisee → confirmee`) — corrige aussi la dette V2.3.11 (BoutonAnnuler jamais branché dans la page malgré son manifest). Voir `docs/manifests/v2-3-14-confirmation-reservation.md`.
**Dernier chantier terminé (antérieur)** : V2.3.13 (dashboard propriétaire d'offre, `/profil/demandes-reservations`, Server Actions accepter/refuser/marquer réalisée) — FK polymorphe gérée applicativement (6 requêtes max, batch via `Map`). Voir `docs/manifests/v2-3-13-dashboard-proprietaire-offre.md`.
**Dernier chantier terminé (antérieur)** : V2.2.2 (Réservation, composant transversal D8) — sur `feature/v2-2-2-reservation`. Migration `20260527040000_reservation.sql` (table `reservation` : FK polymorphe `(offre_type, offre_id)` avec CHECK liste fermée, `demandeur_personne_id` FK `personne`, créneau `debut`/`fin` nullable avec CHECK cohérence, `quantite` default 1, `message_amorce` 1-2000 chars, `statut` machine à états D8 (7 valeurs : `proposee`/`acceptee`/`refusee`/`realisee`/`confirmee`/`annulee`/`litige`), `motif_decision` nullable, `transaction_id` nullable, 3 index actifs, trigger `updated_at`, 4 policies RLS). Helpers TS : `lib/reservation-amorce.ts` (pur, `genererMessageAmorce` bornée à 2000 chars, formatage `Intl.DateTimeFormat` français) + `lib/reservation.ts` (CRUD + helper pur `transitionAutorisee` pour la machine à états). `types/database.ts` enrichi à la main. 9 tests verts (`tests/unit/reservation/amorce-transitions.test.ts`). Migration NON appliquée distant cette nuit (à `supabase db push` au matin). Pas d'intégration applicative sous-espace V2.2.2 : reportée en VAGUE 3 (chaque sous-espace pose sa Server Action de réservation au cas par cas). Voir `docs/manifests/v2-2-2-reservation.md`.
**Dernier chantier terminé (antérieur)** : V2.2.1 (FilDeGroupe §18) — sur `feature/v2-2-1-fil-groupe`, mergé dans `main` (tip `7106fd0`). Composant transversal réutilisable + helper SQL `est_membre_espace`. Voir `docs/manifests/v2-2-1-fil-groupe.md`.
**Dernier chantier terminé (antérieur)** : 7.5 (réseau social) — sur `feature/phase-13-integration`. Le réseau social n'est plus un stub : migration 039 (`relation_reseau`, `post_reseau`, `commentaire_reseau`, `reaction_reseau`, `message_reseau` + RLS + helpers de visibilité), flux hiérarchisé transparent + publications/commentaires/soutiens (`/s-informer/reseau`), profil par numéro M+7 (`/s-informer/reseau/[numero]`), messagerie interne (`/s-informer/reseau/messages` + modal réutilisable), modération a posteriori (`/admin/moderation/reseau`). **Décision A** intégrée : sur la page commune, liste des co-membres (nom + prénom complets, respect visibilité) visible uniquement entre membres, nom cliquable vers le profil réseau + bouton message. 300 tests verts (voir `docs/manifests/phase-13-chantier-7.5-reseau-social.md`). Migration 039 appliquée sur le distant le 2026-05-25 (réseau social actif). **Tout fusionné dans `main` le 2026-05-25** (fast-forward depuis `feature/phase-13-integration`, tip `a778861`) : `main` contient désormais l'ensemble phases 0 à 13 + réseau social. Voir aussi `docs/ETAT-DES-LIEUX.md` (synthèse exhaustive pour le cahier des charges V2).
**Dernier chantier terminé (antérieur)** : 13.3-E (profil unifié) — sur `feature/phase-13-integration`. Chaque signataire (y compris les importés sans compte) a une identité durable : table `profil_unifie` + numéro public « M » + 7 lettres (ex. `MABCDEFG`), stable au-delà de l'email (migration 038). Génération côté base (trigger + format `^M[A-Z]{7}$` + anti-collision + anti gros mots). Rattachement compte ↔ signatures à la vérification de l'email (`rattacher_profil_unifie`, callback auth) ; flux de signature et import branchés (`trouver_ou_creer_profil_unifie`, service_role) ; numéro affiché sur `/profil/informations`. Révise la réconciliation du 2026-05-24. 290 tests verts, lint + typecheck verts (voir `docs/manifests/phase-13-chantier-13.3-e-profil-unifie.md`). Avant (mêmes branche) : 13.3-C/D (carte clusterisée `/communes`, fiche `/communes/[code_insee]`, « Mes contributions »), + révision doctrine §7B (coquilles vides pour tout le référentiel : script `precreer-communes`, garde anti-doublon de nom). Intégration 13.1/13.2/13.3 : voir `docs/manifests/phase-13-integration.md`.
**Dernier chantier terminé (antérieur)** : 12 — Polish global post-revue (chantiers 12.1 à 12.6), voir `docs/manifests/phase-12-polish-revue-globale.md`.
**État du projet** : V1 livrée et fonctionnelle (phases 0-13). Cycle V2 ouvert le 26/05/2026. **VAGUE 0/1/2/3 fermées 27/05**. **VAGUE 3 finitions étendues nuit 27/05** : 34 chantiers V2.3.13→V2.3.46 livrés sur ce cycle. Cycle D8 réservation complet et symétrique (V2.3.13-21), journal D8bis + audit (V2.3.15, V2.3.43), helper identité affichable (V2.3.19), Mes groupes 6 axes + page GT individuelle + index (V2.3.22, V2.3.29, V2.3.38, V2.3.39), filtres dashboards 2 axes (V2.3.23-24, V2.3.40), compteur membres (V2.3.41), notifications cloche V2 (V2.3.25, V2.3.30, V2.3.37), trésorerie complète bout-en-bout avec entrées/sorties/solde/justificatif/initier/confirmer (V2.3.26-28, V2.3.32-36), Mes contributions financières (V2.3.31), Rejoindre/Quitter campagne + GT (V2.3.34, V2.3.38), stats admin V2 (V2.3.42), recherche réseau (V2.3.44-45), tests filtres + compter-membres (V2.3.46). **427 tests verts** (+14 sur V2.3.46, +7 sur V2.3.20). **12 migrations posées localement** à appliquer au matin via `supabase db push` (V2.1.1/2/3 + V2.2.1/2/3 + V2.3.2/3/8 + V2.3.15/26/29) puis 3 backfills (`scripts/backfill-consentement.ts`, `backfill-droits.ts`, `backfill-caisses.ts`, tous `--dry-run` puis `--confirm`). **Fix Ultraplan CI Playwright** poussé sur branche `fix/ci-playwright-multi-browser` (PR à créer manuellement). Chantiers 7.3/7.6 toujours en stubs honnêtes. Chantier 2.2 (8 pages éditoriales) bloqué tant que les textes ne sont pas fournis. **Chantier 10.1 (migration Base44)** : signatures déjà importées (17 746), reste membres + newsletter à finaliser (cf. doc). **Reste à faire par Lilou/Ben** : voir `docs/A-FAIRE-LILOU-BEN.md` (doc finale exhaustive pour Claude.ai).
**Chantiers bloqués / en attente d'arbitrage** : 2.2 demande à Lilou/Ben de rédiger les 8 textes éditoriaux listés dans `docs/CONTENUS-A-ARBITRER.md`. Préalables Supabase : `supabase db push` les migrations 1.1 + 012-033 + Brevo SMTP. Préalable Stripe : `npm install stripe` + clés `sk_test_...`. Préalable SEL prod : poser un cron Cloudflare Worker pour `crediterPrestationsEnAttente` toutes les heures. Préalable Marché prod : poser un cron qui expire les annonces inactives 3 mois (chantier 11.3). Préalable Adhésion prod : poser un cron quotidien qui appelle `envoyerRelancesAdhesion(14)` (chantier 11.3). Préalable Communes : Lilou/Ben fournit le CSV des 2100-2300 communes puis lancer `npx tsx scripts/import-communes.ts <fichier.csv> --dry-run` puis `--confirm`. Préalable Moments prod : poser un cron horaire pour la transition annonce→en_cours→termine (chantier 11.3). Préalable Playwright multi-viewports : `npx playwright install` pour télécharger Firefox + WebKit en local. Préalable phase 13 (sur `feature/phase-13-integration`) : pour tester l'édition des dates de pétition et la plateforme de données contre la base distante, appliquer les migrations 13.x (dates pétition 035, `commune_reference`, CP/INSEE) via `supabase db push` ou `scripts/appliquer-sql-distant.ts` (DDL pur, sans PII) ; les scripts d'import signataires/communes restent à lancer en `--confirm` après feu vert. Distant 13.3-C/D/E APPLIQUÉ le 2026-05-25 (autorisé par Lilou/Ben) : migrations 037 (`compteurs_commune`) et 038 (`profil_unifie`) appliquées ; `precreer-communes --confirm` lancé (35 011 coquilles `pre_creee`) ; remplissage profils unifiés vérifié (15 737 profils, 17 746/17 746 signatures reliées) ; import signataires déjà complet (17 746). `types/database.ts` maintenu à la main (régénération CLI optionnelle, non nécessaire). Reste éventuel : réclamation d'un email antérieur (hors v1).

### Branche principale

`main` (renommée depuis `master` pendant le chantier 0.2). Toutes les branches feature partent de `main`.

### Préalables externes attendus

- **Avant chantier 1.1** : création du projet Supabase (région Francfort), récupération des trois clés (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- **Au moment voulu** : création du repo GitHub distant et `git push -u origin main` pour activer la CI.
- **Quand accessible** : compte Cloudflare Pages pour le déploiement (cf. CLAUDE.md §6).
- **Au chantier qui les branche** : clés Brevo, Stripe, LiveKit, Turnstile, T99CP (le site tourne en local avec mocks d'ici là).

### Décisions politiques en attente d'arbitrage de Lilou/Ben

- Q5 : services proposés selon statut (adhérent·e / sympathisant·e / donateur·ice).
- Q13 : boucle d'engagement, mécaniques transverses.
- Q14 : indicateurs publics du mouvement.

### Données externes attendues de Lilou/Ben

- CSV de cartographie des 2100-2300 communes pré-créées (avant chantier 5.2).
- Contenus éditoriaux pour les pages : Doctrine, Commune libre, Assemblée Confédérale, Monnaie 99-coin, FAQ, Ressources, À propos. À arbitrer au fur et à mesure via les placeholders.
- Coordonnées de l'association (adresse, RNA, email contact, email DPD) pour finaliser la politique de confidentialité.
- Choix collégial du·de la DPD bénévole.

**Index unique des contenus en attente** : `docs/CONTENUS-A-ARBITRER.md`. C'est la liste à parcourir avec Lilou/Ben pour passer du squelette technique à une publication réelle.

---

## 12. Liens vers les specs

Tout est dans `docs/specs/` :

| Fichier | Quand le consulter |
|---|---|
| `00_INDEX.md` | Premier accès au pack |
| `01_ARCHITECTURE.md` | Avant chaque chantier (référence centrale) |
| `02_STACK.md` | Pour toute décision technique |
| `03_VOCABULAIRE.md` | À chaque création d'UI ou de copy |
| `04_DESIGN-TOKENS.md` | Avant chaque chantier UI |
| `05_RGPD.md` | Avant chaque chantier qui touche aux données personnelles |
| `06_DOCTRINES.md` | À chaque décision d'UX ou de produit |
| `08_PLAN_CHANTIERS.md` | Pour savoir quel chantier vient ensuite |
| `arborescence.mermaid` | Pour visualiser la structure du site |
