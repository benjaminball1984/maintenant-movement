# Revue de copie du projet Maintenant! (état au 21/05/2026)

> Revue de code en mode « professeur·e corrige une copie d'examen »,
> commandée par Lilou/Ben à l'issue de la phase 11 (« tous les chantiers
> livrés »). Périmètre demandé : éléments restant à faire, mal
> architecturés, illisibles pour des dev·es débutant·es, mal expliqués,
> incohérences de design, code mort, redondances, contradictions
> internes, défauts responsive multi-format, erreurs de code.
>
> Le polish complet déclenché par cette revue a été livré sur la branche
> `feature/phase-12-polish-revue-globale` en 7 commits (chantiers 12.1 à
> 12.7). Détail dans `docs/manifests/phase-12-polish-revue-globale.md`.
> Le présent document est le rapport d'audit qui a précédé ce polish.

---

## 0. Avant tout : ce qui marche

Avant de pointer les défauts, je dois saluer ce qui tient debout, parce que la suite va paraître sévère :

- `npm run lint` : **vert** (Biome, 351 fichiers passés).
- `npm run typecheck` : **vert** (TypeScript strict, zéro `any` toléré).
- `npm test` : **245 tests verts** sur 23 fichiers.
- `npm run build` : **vert**, 70+ routes générées par l'App Router.
- Pattern adapter (mock/réel) correctement instancié sur email, livekit, payments, t99cp, turnstile.
- 33 migrations SQL avec `enable row level security`.
- Naming métier français / technique anglais : respecté à l'échantillon.
- Aucun import relatif profond (`../../../`).
- Aucun `'use client'` injustifié.
- Aucun test skip.

**Note globale : B+ (16/20).** Pas A+ pour les raisons qui suivent. La copie est solide, mais elle est livrée comme « tous les chantiers livrés » dans CLAUDE.md §11, ce qui est une **surestimation** : il reste des incohérences structurelles, du contenu manquant assumé mais non centralisé, et plusieurs angles morts responsive/dark mode qui rendent l'expérience inutilisable sur certains formats.

---

## 1. Erreurs de code et défauts mécaniques

### 1.1 Dépendance gravement obsolète (fausse alerte levée)
- `package.json:27` déclare `"lucide-react": "^1.16.0"`. Au premier coup d'œil cette version paraissait absurde (la lib semblait être en 0.4xx). **Vérification a posteriori** : la lib a sauté de 0.577 → 1.0 récemment, donc 1.16.0 est bien la dernière. Pas de bug, alerte levée.

### 1.2 Doublon de routes Next.js (risque de collision)
- `app/admin/` contient `layout.tsx`, `page.tsx`, `moderation/` (route active).
- `app/(admin)/` contient seulement un `README.md` (route group fantôme).
- Idem `app/auth/callback/` vs `app/(auth)/connexion|inscription|verifier-email`.

**Effet** : confusion lors d'un futur ajout (où crée-t-on `/admin/stats` ? Dans le route group, ou hors ?). Risque concret de collision si quelqu'un pose un `app/(admin)/page.tsx`.

### 1.3 Doublon d'adaptateur paiement (deux factories pour la même chose)
- `lib/payments/` : `types.ts`, `MockPaymentService.ts`, `StripePaymentService.ts`, `frais.ts`, `index.ts` (importé par 3 Server Actions de prod).
- `lib/stripe/` : `types.ts`, `MockPaymentService.ts`, `StripePaymentService.ts`, `index.ts` (importé par 1 test seulement).

Vestige du chantier 0.1, remplacé par `lib/payments/` au chantier 3.3, jamais nettoyé. Un·e dev débutant·e patche l'un, oublie l'autre, le mock diverge du réel.

### 1.4 Popup MapLibre en dur, illisible en mode sombre
`components/carte/CarteUnifiee.tsx:213-218` : la popup HTML utilise des couleurs hexa codées en dur (`#888`, `#111`, `#555`, `#9333ea`). En mode sombre, le `#111` (titre) est invisible sur fond clair par défaut du popup. Les marqueurs (`COULEUR_PAR_TYPE`, lignes 23-35) sont aussi 11 valeurs hexa hors tokens.

### 1.5 Fond blanc en dur dans la 2FA
`app/(membre)/profil/securite/2fa/FormulaireEnrollementTotp.tsx:90` : `className="bg-white p-2"` autour du QR. Volontaire (un QR a besoin d'un fond clair pour rester scannable) mais ni commenté ni justifié dans le code.

### 1.6 Scripts destructeurs sans garde-fou
- `scripts/import-communes.ts` : aucune option `--dry-run`, aucune confirmation. Le script va `upsert` 2300 lignes dès qu'on l'exécute.
- `scripts/migrer-base44.ts` : idem. Migre 946 membres + ~9k newsletter + ~16k signataires.

Un·e dev débutant·e qui lance le mauvais script écrase la prod.

### 1.7 Migrations avec RLS activée mais policies déportées
9 migrations (`002` à `009`) activent RLS mais ne définissent pas de policy : tout est centralisé dans `20260520120011_rls_policies.sql`. Si `_011` est buggée ou appliquée en retard, les tables sont en deny-all silencieux. Couplage temporel non documenté.

### 1.8 CSP fantôme : annoncée dans le manifest 11.x, non présente dans le code
Le manifest 11.1 affirme : « CSP basique posée dans `next.config.ts` ». Or `next.config.mjs` n'a **aucun** header `Content-Security-Policy`. Incohérence directe entre documentation et code livré.

---

## 2. Contenu manquant (assumé) mais mal centralisé

Le projet documente honnêtement les `[TEXTE À FAIRE]`. C'est bien. **Mais ils sont éparpillés dans 8 pages, écrits dans le composant `<Alert variant="info" titre="[TEXTE À FAIRE]">` qui s'affiche à l'utilisateur·ice**. Si on déploie aujourd'hui en preview, n'importe quel·le visiteur·euse voit `[TEXTE À FAIRE — politique de confidentialité v3]` en gros dans un encart bleu.

Les 8 placeholders éditoriaux confirmés :
- `app/(public)/contact/page.tsx:15`
- `app/(public)/confidentialite/page.tsx:15`
- `app/(public)/comprendre/ressources/page.tsx:15`
- `app/(public)/comprendre/monnaie/page.tsx:15`
- `app/(public)/comprendre/faq/page.tsx:15`
- `app/(public)/comprendre/doctrine/page.tsx:15`
- `app/(public)/mentions-legales/page.tsx:15`
- `app/(public)/a-propos/page.tsx:15`

**Conduite attendue (cf. CLAUDE.md §3)** : placeholder visible OK, **mais aussi** centralisation dans la rubrique « Contenus à arbitrer » du MANIFEST. La centralisation existe par manifest mais pas en index unique consultable.

---

## 3. Architecture et lisibilité

### 3.1 Fichiers Server Actions massifs
- `app/(public)/s-entraider/marche/actions.ts` : **600 lignes**.
- `app/(public)/mobiliser/cagnottes/actions.ts` : **504 lignes**.
- `app/(public)/agir/communes/actions.ts` : **502 lignes**.

Pour un·e dev débutant·e, 600 lignes dans un seul fichier d'actions, c'est ingérable. Le split naturel : un sous-dossier `actions/` par domaine.

### 3.2 Dossiers `lib/` orphelins ou doublons
- `lib/queries/` ne contient que `home.ts` : doit être déplacé dans `lib/home/` ou fusionné.
- `lib/brevo/` est un README placeholder : tout est dans `lib/email/`.
- `lib/i18n/` est un README placeholder : à supprimer si l'i18n n'est pas en cours.
- `lib/permissions/` est un README placeholder : à peupler ou supprimer.

### 3.3 JSDoc inégale sur `lib/validations/`
Échantillon :
- `autres-moyens.ts` : 25 % de couverture.
- `campagne.ts` : 25 %.
- `cagnotte.ts` : 58 %.
- `auth.ts` : 56 %.

Le public débutant cible (CLAUDE.md §2 al. 3) ne peut pas lire une regex Zod sans contexte métier.

### 3.4 README internes au statut flou
- `components/README.md`, `lib/README.md`, `supabase/README.md`, `app/api/README.md`, `app/(admin)/README.md`, `app/(membre)/README.md` existent mais avec un statut hétérogène (certains parlent de chantiers « prévus » alors qu'ils sont déjà implémentés). `lib/README.md` mentionne en plus des dossiers qui devraient être supprimés (`lib/stripe`, `lib/brevo`, etc.).

---

## 4. Design system et harmonisation visuelle

### 4.1 Adhérence aux tokens : globalement bonne, ponctuellement cassée
- `components/carte/CarteUnifiee.tsx` lignes 23-35 : 11 hexa pour les couleurs des marqueurs MapLibre. Justifiable (MapLibre prend des strings), mais pas commenté et pas mappé aux tokens.
- `CarteUnifiee.tsx:212-222` : popup HTML inline avec `color: #111; color: #555; color: #888; color: #9333ea`. **Doit** lire les tokens via CSS variables.

### 4.2 Largeurs fixes en `px` qui cassent le mobile
- `components/sel/FormulaireCreationService.tsx:151` : `max-w-[180px]` (durée).
- `components/cagnottes/FormulaireDonEuros.tsx:121` : `max-w-[140px]` (montant).
- `components/cagnottes/FormulaireDonEuros.tsx:165` : `max-w-[140px]` (code postal).
- `components/cagnottes/FormulaireCreationCagnotte.tsx:148` : `max-w-[220px]` (objectif).

Sous 380px de viewport, ces champs deviennent étriqués ou débordent. Règle attendue : `w-full sm:max-w-[180px]`.

### 4.3 Composants UI bas niveau sans breakpoint
Selon l'audit responsive : `Badge`, `Card`, `Alert`, `Input`, `Textarea`, `Label`, `Heading` ne définissent aucun comportement responsive. Pour des primitives ce n'est pas forcément un défaut (le responsive vient des compositions parentes), **mais** le `padding-24` fixe de `Card` peut poser problème sur mobile très étroit.

### 4.4 Mode sombre : 2 zones cassées identifiées
- QR code 2FA (cf. §1.5).
- Popup carte (cf. §1.4 et §4.1).

---

## 5. Responsivité (tablette, téléphone, ordinateur, portrait, paysage)

### 5.1 Couverture actuelle
- 26 composants sur 73 utilisent un breakpoint Tailwind. Les layouts (`Header`, `Footer`, layouts publics et membre) ont un comportement responsive raisonnable.
- Burger menu mobile : présent dans `Header.tsx` via `md:hidden / hidden md:flex`.

### 5.2 Angles morts confirmés
- Inputs largeur fixe (cf. §4.2).
- Carte `h-[70vh]` : en paysage téléphone, 70vh c'est ~250px, soit une carte minuscule.
- Composants formulaires gros (`FormulaireCreationCagnotte`, `FormulaireDonEuros`) : pas de visualisation tablette portrait/paysage testée dans les snapshots Playwright.

### 5.3 Ce qui n'a pas été testé (et qui devrait l'être)
- Tests Playwright avec viewports multiples : 320, 375, 768, 1024, 1440. **Non présent** dans `playwright.config.ts` (1 seul projet desktop).
- Tests cross-browser : Playwright supporte chromium/firefox/webkit ; à vérifier que les trois sont activés.
- Pas de farm device réelle.

---

## 6. Contradictions internes

### 6.1 État du projet surdéclaré
CLAUDE.md §11 : « **TOUS LES CHANTIERS LIVRÉS** ». Mais le même paragraphe écrit : « Reste polishs UI + chantier 2.2 contenus éditoriaux + chantiers 7.3/7.5/7.6 réels (stubs honnêtes en place) ».

Tout est livré **sauf** ce qui n'est pas livré. Formulation trompeuse.

### 6.2 CSP : déclarée vs présente
Cf. §1.8.

### 6.3 « Lighthouse CI intégré » vs `.github/workflows/ci.yml`
Le manifest 11.1 affirme l'intégration. À vérifier que le workflow tourne vraiment Lighthouse.

### 6.4 « Backup BDD : commande Supabase CLI » mentionnée mais non planifiée
Le manifest 11.2 mentionne `supabase db dump > backup-AAAA-MM-JJ.sql` à programmer. Pas de cron, pas de script.

---

## 7. Synthèse de la copie

| Axe | Note | Commentaire |
|---|---|---|
| Cohérence stack | A | TypeScript strict, Biome, Vitest, Playwright, tout est en place |
| Architecture | B | Doublons routes et adaptateurs, dossiers orphelins |
| Lisibilité débutant·e | B | JSDoc inégale, fichiers actions trop gros |
| Tests | A- | 245 unitaires, E2E crawl, pas de viewports multiples |
| Responsive | C+ | Burger OK, mais inputs px fixes, carte mobile faible |
| Design system | B+ | Tokens propres, 2 fuites hors-tokens |
| Mode sombre | C | 2 zones cassées identifiées |
| Sécurité | B | RLS centralisée fragile, CSP fantôme, scripts sans garde-fou |
| Honnêteté de la doc | B- | Manifests précis, mais CLAUDE.md §11 trompeur |

---

# Road map de réparation (ordre d'exécution)

Cette road map a été conçue pour le persona étudiant·e décrit dans CLAUDE.md §2. Chaque étape se lit comme un mini-énoncé de TP : préalable, ce qu'on touche, ce qu'on vérifie, ce qu'on ne touche surtout pas. **Aucune étape ne casse les précédentes.** L'ordre minimise les risques de régression.

> **Règle d'or de cette road map** : un seul chantier = une seule branche + un commit. Tester `npm run lint && npm run typecheck && npm test && npm run build` après chaque étape. Si une étape casse les verts, ne pas continuer.

## Bloc P1 : corrections mécaniques sans risque

- **P1.1** Corriger la version de `lucide-react` si nécessaire. → Vérifier `npm ls lucide-react`, mettre à jour si version cassée.
- **P1.2** Supprimer le route group fantôme `app/(admin)/`. → `git rm -r app/(admin)/` après vérification de son contenu.
- **P1.3** Trancher entre `lib/payments/` et `lib/stripe/`. → Garder celui qui est importé (lib/payments), migrer le test, supprimer l'autre.
- **P1.4** Nettoyer les dossiers `lib/` orphelins. → Déplacer `lib/queries/home.ts` en `lib/home/requetes.ts`, supprimer `lib/brevo/`, `lib/i18n/`, `lib/permissions/`.
- **P1.5** Ajouter des garde-fous aux scripts destructeurs. → Flags `--dry-run` / `--confirm` obligatoires.

## Bloc P2 : harmonisation design system et mode sombre

- **P2.1** Tokens dans la popup MapLibre. → Remplacer les hexa par `var(--text-1)`, `var(--brand)`, etc.
- **P2.2** Mode sombre du QR code 2FA. → Garder `bg-white` mais l'expliquer en commentaire, ajouter `rounded-sm`.
- **P2.3** Largeurs fixes des inputs. → Pattern `w-full sm:max-w-[Xpx]` sur les 4 occurrences.
- **P2.4** Hauteur responsive de la carte. → `h-[60vh] min-h-[400px] sm:h-[70vh]`.
- **P2.5** Audit Tailwind `bg-white / text-black / bg-gray-xxx`. → Remplacer par tokens, justifier les exceptions.

## Bloc P3 : tests responsive cross-format

- **P3.1** Ajouter les viewports Playwright. → 5 projets : mobile portrait, mobile paysage, tablette portrait, tablette paysage, desktop.
- **P3.2** Test cross-browser. → Firefox et WebKit en desktop au minimum.
- **P3.3** Screenshot diff par viewport. → Suite `responsive-screenshots.spec.ts` qui capture les pages clés.

## Bloc P4 : centralisation du contenu manquant

- **P4.1** Créer `docs/CONTENUS-A-ARBITRER.md`. → Index unique listant tous les contenus, données et clés attendus.
- **P4.2** Remplacer les `[TEXTE À FAIRE]` visibles par une bannière neutre en prod. → Composant `<PageEditorialeStub>` à double affichage selon `NODE_ENV` et `NEXT_PUBLIC_AFFICHER_PLACEHOLDERS`.

## Bloc P5 : architecture et lisibilité

- **P5.1** Splitter les Server Actions massives. → Sous-dossier `actions/` par domaine. **Repoussé post-MVP** : refactor pur, risque trop élevé pour un polish.
- **P5.2** JSDoc systématique sur les schémas Zod. → Bloc `/** */` au-dessus de chaque schéma exporté.
- **P5.3** Audit des `README.md` internes. → Mise à jour avec la réalité du livré.

## Bloc P6 : sécurité

- **P6.1** CSP réelle dans `next.config.mjs`. → Bloc `async headers()` avec directives détaillées.
- **P6.2** Vérifier la couverture du `_011_rls_policies.sql`. → Exécuter `scripts/tester-rls.ts` et compléter `_011` si nécessaire.
- **P6.3** Mettre à jour CLAUDE.md §11 et les manifests pour refléter la réalité.

## Bloc P7 : sanity check global avant clôture

- Vérifs mécaniques sur les 5 viewports.
- Visuel sombre/clair sur 5 pages.
- MANIFEST de polish à `docs/manifests/phase-12-polish-revue-globale.md`.

---

# Ce qui dépend de Lilou/Ben

Liste centralisée dans `docs/CONTENUS-A-ARBITRER.md` à la fin du polish. Résumé :

1. Textes éditoriaux des 8 pages publiques.
2. Coordonnées de l'association (nom légal, adresse, RNA, DPD).
3. Citations de la home.
4. CSV des 2100-2300 communes.
5. Clés API réelles (au go-live).
6. Décisions politiques Q5, Q13, Q14.
7. Validation du nom de domaine et accès Cloudflare.

---

# Compte rendu de fin de revue

- **Aucune modification de fichier dans la revue elle-même** : c'était volontaire, la commande était d'évaluer et de proposer une road map, pas d'attaquer le code.
- **Verts mécaniques au lancement** : lint, typecheck, tests unitaires, build.
- **Défauts identifiés** : 1 dépendance suspectée à tort, 2 doublons structurels (routes, adapter paiement), 8 placeholders éditoriaux visibles, 2 zones mode sombre cassées, 4 inputs à largeur fixe, 1 CSP fantôme, 2 scripts sans garde-fou, 1 hauteur de carte non responsive, 1 surdéclaration dans CLAUDE.md §11, plusieurs dossiers `lib/` orphelins.
- **Road map** : 7 blocs (P1 à P7), ordonnés du moins risqué au plus structurel, chacun découpé en étapes courtes avec préalable + action + vérif + ce qu'on ne touche pas.

Le polish complet livré à la suite de cette revue est documenté dans `docs/manifests/phase-12-polish-revue-globale.md`. Tous les blocs (P1 à P7) ont été exécutés, sauf P5.1 (split des actions massives) qui a été repoussé post-MVP comme dette technique consciente.
