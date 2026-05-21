# Manifest : Phase 12, Chantiers 12.1 à 12.6 — Polish global post-revue de copie

**Date de fin** : 2026-05-21
**Branche** : `feature/phase-12-polish-revue-globale`
**Commit final** : `6b686af`
**Durée approximative** : 1 session Claude Code (revue + polish complet)

---

## Stratégie

À la suite d'une revue de copie en mode « professeur·e corrige une copie d'examen » sur l'état livré post-phase 11, la phase 12 attaque six blocs de polish ordonnés du moins risqué au plus structurel. Chaque bloc fait l'objet d'un commit dédié, validé par `lint`, `typecheck`, `npm test` et `npm run build`.

Aucune fonctionnalité métier nouvelle. Que des corrections, du nettoyage et de la documentation honnête.

---

## 12.1 — Corrections mécaniques (commit `2e89fa2`)

### Livré

- [x] **Vérification `lucide-react`** : la version installée `1.16.0` est la dernière sur npm (le paquet a sauté de 0.577 à 1.0 récemment). Aucune action requise, l'alerte initiale était fausse.
- [x] **Suppression doublon `app/(admin)/`** : le route group vide (chantier 0.1) n'a jamais été peuplé ; le chantier 9.x a livré dans `app/admin/`. Le README orphelin est supprimé.
- [x] **Suppression doublon `lib/stripe/`** : ancien stub du chantier 0.1 remplacé par `lib/payments/` au chantier 3.3. L'unique import (test `factories.test.ts`) est migré vers `@/lib/payments`, puis les 4 fichiers `lib/stripe/` sont supprimés.
- [x] **Nettoyage `lib/` orphelins** : `lib/queries/home.ts` déplacé en `lib/home/requetes.ts` (pattern cohérent avec les autres domaines), import ajusté dans `app/(public)/page.tsx`. Suppression de `lib/brevo/`, `lib/i18n/`, `lib/permissions/` qui n'étaient que des README placeholder.
- [x] **Garde-fous scripts destructeurs** : `scripts/import-communes.ts` et `scripts/migrer-base44.ts` exigent désormais `--dry-run` ou `--confirm` pour démarrer. Le dry-run trace ce qui serait écrit sans toucher à la base.

### Non livré

- [ ] Néant.

## 12.2 — Design system et dark mode (commit `90d7657`)

### Livré

- [x] **Popup MapLibre** (`components/carte/CarteUnifiee.tsx`) : remplacement des couleurs hexa codées en dur (`#888`, `#111`, `#555`, `#9333ea`) par les variables CSS du thème (`var(--text-1)`, `var(--text-2)`, `var(--text-3)`, `var(--brand)`, `var(--surface)`). Le popup est désormais lisible en clair comme en sombre.
- [x] **Documentation des marqueurs hexa** : `COULEUR_PAR_TYPE` reste en hexa (MapLibre isole les SVG des tokens), mais un commentaire JSDoc explique le pourquoi et pose la piste si la palette dark mode change.
- [x] **Hauteur de carte responsive** : `CarteUnifiee.tsx` et `CarteWrapper.tsx` passent de `h-[70vh]` à `h-[60vh] min-h-[400px] sm:h-[70vh]`. En paysage téléphone, la carte garde au moins 400px de haut.
- [x] **Largeurs d'inputs responsives** : 4 occurrences de `max-w-[Xpx]` passent à `w-full sm:max-w-[Xpx]` (durée SEL, montant don, code postal don, objectif cagnotte). Sous 380px de viewport, les champs prennent 100 % de la largeur du parent.
- [x] **Commentaire QR 2FA** (`FormulaireEnrollementTotp.tsx`) : le `bg-white` reste volontaire (un QR a besoin d'un fond clair pour rester scannable) et est désormais explicitement commenté et arrondi `rounded-sm`.
- [x] **Audit `bg-white` / `text-black` / `bg-gray-*`** : aucun autre usage hors-tokens dans le code applicatif.

## 12.3 — Tests responsive cross-format (commit `6caa711`)

### Livré

- [x] **`playwright.config.ts` enrichi** : 5 projets Chromium par viewport (mobile portrait/paysage 375×667 et 667×375, tablette portrait/paysage 768×1024 et 1024×768, desktop 1440×900) + 2 projets cross-browser (Firefox et WebKit) sur viewport desktop. Toutes les suites E2E existantes (60+ scénarios) tournent automatiquement sur chacun des 7 projets.
- [x] **`tests/e2e/responsive-screenshots.spec.ts`** (nouveau) : pour 7 pages publiques clés (home, agir, doctrine, mobiliser/petitions, s-entraider/marche, carte, connexion), prend une capture pleine page dans `tests/screenshots/responsive/<projet>/<page>.png`. Audit visuel reproductible.

### Non livré (à faire par Lilou/Ben au moment du polish manuel)

- [ ] **Première exécution complète** : `npx playwright install` pour télécharger Firefox + WebKit en local, puis `npm run test:e2e` pour générer les screenshots de référence et valider que tous les viewports passent.

## 12.4 — Centralisation des contenus à arbitrer (commit `febefb7`)

### Livré

- [x] **`docs/CONTENUS-A-ARBITRER.md`** (nouveau) : index unique de tout ce que Lilou/Ben doit fournir pour la publication réelle. Sections : 8 pages éditoriales, données associatives, données externes (communes, Base44), clés API et accès, arbitrages politiques Q5/Q13/Q14, crons opérationnels.
- [x] **`components/home/PageEditorialeStub.tsx`** : double affichage selon l'environnement. En dev (`NODE_ENV !== 'production'`) : placeholder technique détaillé. En prod sans flag : bannière neutre « Page en cours de rédaction » plus invitation à revenir. En prod avec `NEXT_PUBLIC_AFFICHER_PLACEHOLDERS=true` : redevient visible (preview interne).
- [x] Les 8 pages éditoriales (`contact`, `confidentialite`, `mentions-legales`, `comprendre/doctrine`, `comprendre/faq`, `comprendre/monnaie`, `comprendre/ressources`, `a-propos`) bénéficient automatiquement de ce comportement sans changement individuel.
- [x] **CLAUDE.md §11** : ajout d'une référence explicite vers `docs/CONTENUS-A-ARBITRER.md`.

## 12.5 — Architecture et lisibilité (commit `84e7ed7`)

### Livré

- [x] **JSDoc Zod sur `lib/validations/autres-moyens.ts` et `lib/validations/campagne.ts`** : ajout de blocs JSDoc descriptifs sur les schemas exportés (3 schemas dans campagne, 2 dans autres-moyens). Couverture passée de 25 % à 100 % pour ces fichiers. Un·e dev débutant·e peut lire le schéma sans deviner le métier.
- [x] **README internes mis à jour** :
  - `lib/README.md` : ne mentionne plus `lib/stripe`, `lib/brevo`, `lib/i18n`, `lib/permissions` (tous supprimés au P1) ; liste la vingtaine de dossiers métier présents.
  - `app/(auth)/README.md` : décrit le contenu réellement livré (au lieu de « chantier prévu »).
  - `app/(membre)/README.md` : décrit les 7 onglets profil réalisés.
  - `app/api/README.md` : explique pourquoi le dossier reste vide (Server Actions privilégiées).
  - `supabase/README.md` : reflète les 33 migrations livrées et la procédure backup.

### Non livré (volontairement repoussé post-MVP)

- [ ] **Split des 3 fichiers `actions.ts` massifs** (`marche` 600 lignes, `cagnottes` 504, `communes` 502). Refacto pur sans bénéfice fonctionnel, risque de casser la convention Next.js Server Actions trop élevé dans le scope polish. Documenté comme dette technique consciente.

## 12.6 — Sécurité (commit `3a36283`)

### Livré

- [x] **CSP réelle dans `next.config.mjs`** : la doc 11.x annonçait une CSP « posée dans next.config.ts » mais le fichier `.mjs` n'avait aucun header HTTP. Maintenant corrigé avec un bloc `async headers()` qui définit :
  - `Content-Security-Policy` : self par défaut + Turnstile, Stripe, Supabase, LiveKit, OpenStreetMap explicitement autorisés ; `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`.
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(self), geolocation=(self), payment=(self)`.
- [x] **`docs/securite.md §2.3`** : remplacement de la phrase générique par la liste détaillée des directives CSP et la note « à tester en preview Cloudflare ». Tableau de synthèse : « CSP stricte » passe de « À renforcer » à « Posée (12.6) ».
- [x] **CLAUDE.md §11 reformulé honnêtement** : passage de « TOUS LES CHANTIERS LIVRÉS » (formulation trompeuse) à « squelette technique complet, chantiers 7.3/7.5/7.6 livrés en stubs, Lighthouse mobile et WCAG complets pendants pour la phase staging Cloudflare ». Liste des préalables mise à jour avec les flags `--dry-run` / `--confirm` et l'install Playwright multi-browser.
- [x] **Vérification RLS** : la migration `011_rls_policies.sql` contient 33 `create policy` couvrant les 11 tables des chantiers 002-009. La centralisation est complète, pas de policy manquante.

### Non livré

- [ ] **Test CSP en environnement réel** : à faire au premier déploiement preview Cloudflare Pages. Si une ressource est bloquée (console DevTools), ajuster la directive concernée.

---

## Tests globaux phase 12

- Unitaires : **245 tests verts** (inchangés ; aucune logique métier modifiée).
- E2E Playwright : configuration multi-viewports prête, à exécuter par Lilou/Ben avec `npx playwright install && npm run test:e2e`.
- Lint, typecheck, build : tous verts après chaque commit P1 à P6.

## Décisions techniques prises

- **lucide-react** : version 1.16.0 conservée (c'est bien la dernière, pas un héritage cassé). Aucune migration nécessaire.
- **Doublon `lib/payments/` vs `lib/stripe/`** : on garde `lib/payments/` (importé par 3 Server Actions de prod) et on supprime `lib/stripe/` (importé par 1 test seulement). API publique préservée.
- **`app/(admin)/` vs `app/admin/`** : on supprime le route group fantôme `app/(admin)/`. Décision conservatrice plutôt que migration du contenu `app/admin/` vers le route group (risque de régression trop élevé pour un polish).
- **Bannière neutre en prod** : on n'attend pas la rédaction des 8 pages éditoriales pour pouvoir publier le squelette. Une bannière « page en cours de rédaction » remplace les `[TEXTE À FAIRE]` techniques en prod, sauf si `NEXT_PUBLIC_AFFICHER_PLACEHOLDERS=true`.
- **Split `actions.ts` 600 lignes repoussé** : refactor pur sans bénéfice fonctionnel, risque de casser la convention Next.js Server Actions trop élevé dans le scope polish. Documenté en dette technique consciente.

## Incertitudes résolues sans intervention de Lilou/Ben

- Version `lucide-react` : doute initial levé par lecture des `dist-tags` npm.
- Doublon adapter paiement : tranché en regardant qui importe quoi (statistique 3-1).
- CSP fantôme : confirmé en lisant `next.config.mjs` ligne par ligne.

## Notes pour la suite

- **Prochain pas opérationnel pour Lilou/Ben** : voir la section « Compte rendu » qui suit ce manifest dans la session de revue.
- **Polish UI ultérieur (post-MVP)** :
  - Split des 3 `actions.ts` massifs en sous-dossiers par sous-domaine.
  - Audit WCAG 2.1 AA complet par un cabinet spécialisé.
  - Test Lighthouse mobile sur preview Cloudflare Pages.
  - Test CSP réel en preview, ajustement éventuel des directives.
  - Configuration des crons Cloudflare Workers (cf. `docs/LANCEMENT.md`).
