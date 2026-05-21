# CLAUDE.md — Mémoire persistante du projet Maintenant!

> **Tu lis ce fichier intégralement à chaque démarrage de session, avant tout autre fichier.** C'est ta mémoire principale entre les sessions Claude Code. Si une décision n'y figure pas, consulte `docs/specs/`. Si la réponse n'y est pas non plus, tu poses la question à Lilou/Ben. Tu n'inventes pas.

---

## 1. Identité du projet

**Maintenant!** est une plateforme citoyenne web en français, portée par un mouvement politique populaire en construction. Site officiel cible : `maintenant-le-mouvement.org`. Refonte complète, après une première version sur Base44 à migrer (946 membres, ~9k newsletter, ~16k signataires).

**Pilote** : Lilou/Ben (LIFE BENJAMIN BALL, cosec gé). Non-binaire, prénoms fluides (les deux sont utilisés ensemble : « Lilou/Ben »). Tu lui parles avec respect, sobriété, et tu ne fais pas de surcouche émotionnelle.

**Phase actuelle** : développement initial. L'architecture est verrouillée à ~95 % dans `docs/specs/`. Voir `docs/specs/08_PLAN_CHANTIERS.md` pour le plan numéroté.

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
- **Fonctionnalités, pages, sections, espaces, sous-espaces** non listés dans `docs/specs/01_ARCHITECTURE.md`. Si tu penses qu'il manque quelque chose, tu le signales dans le MANIFEST sous « propositions », tu n'ajoutes pas.
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

**Dernière mise à jour** : 2026-05-21
**Dernier chantier terminé** : 11.1 + 11.2 + 11.3 — Polish + sécurité + lancement (audits a11y, RLS doc, runbook lancement, script tester-rls, securite.md) (voir `docs/manifests/phase-11-chantier-11.1-11.2-11.3.md`)
**État du projet** : **TOUS LES CHANTIERS LIVRÉS** (4.3 à 11.3, 9 manifests créés cette session). Reste polishs UI + chantier 2.2 contenus éditoriaux (bloqué tant que Lilou/Ben ne fournit pas les textes) + chantiers 7.3/7.5/7.6 réels (stubs honnêtes en place). Prêt pour la review de code et le lancement opérationnel selon `docs/LANCEMENT.md`.
**Chantiers bloqués / en attente d'arbitrage** : 2.2 demande à Lilou/Ben de rédiger les 8 textes éditoriaux listés dans `docs/manifests/phase-2-chantier-2.1.md`. Préalables Supabase : `supabase db push` les migrations 1.1 + 012-033 + Brevo SMTP. Préalable Stripe : `npm install stripe` + clés `sk_test_...`. Préalable SEL prod : poser un cron Cloudflare Worker pour `crediterPrestationsEnAttente` toutes les heures. Préalable Marché prod : poser un cron qui expire les annonces inactives 3 mois (chantier 11.3). Préalable Adhésion prod : poser un cron quotidien qui appelle `envoyerRelancesAdhesion(14)` (chantier 11.3). Préalable Communes : Lilou/Ben fournit le CSV des 2100-2300 communes puis lancer `npx tsx scripts/import-communes.ts <fichier.csv>`. Préalable Moments prod : poser un cron horaire pour la transition annonce→en_cours→termine (chantier 11.3).

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
