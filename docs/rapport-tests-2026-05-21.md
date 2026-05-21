# Rapport de tests du projet Maintenant! (état au 21/05/2026)

> Inventaire consolidé des tests unitaires (Vitest) et end-to-end
> (Playwright) du projet, avec les commandes pour les relancer et les
> rapports HTML qu'ils produisent.

---

## 1. Synthèse

| Type | Outils | Fichiers | Tests | État au 21/05/2026 |
|---|---|---|---|---|
| Unitaires | Vitest 2.x | 23 | 245 | **245 verts** |
| End-to-end | Playwright 1.49 | 20 | 93 scénarios × 7 projets (5 viewports + Firefox + WebKit) | À relancer après `npx playwright install` (cf. §4) |
| Lint | Biome 1.9 | 348 fichiers scannés | 0 erreur | **vert** |
| Typecheck | TypeScript 5.6 strict | tout le repo | 0 erreur | **vert** |
| Build | Next.js 14.2 | 70+ routes | 0 erreur | **vert** |

Pour obtenir le détail JSON brut d'un run unitaire : `npx vitest run --reporter=json` (le fichier généré peut être volumineux, ne pas le committer).

---

## 2. Tests unitaires (Vitest)

### Commande

```bash
npm test           # run unique
npm run test:watch # mode watch (dev)
```

### Fichiers et nombre de tests par module

Tests groupés par responsabilité métier :

#### Validations Zod (15 fichiers, 173 tests)

| Fichier | Tests |
|---|---|
| `tests/unit/validations/profil.test.ts` | 20 |
| `tests/unit/validations/auth.test.ts` | 23 |
| `tests/unit/validations/marche.test.ts` | 29 |
| `tests/unit/validations/moments.test.ts` | 14 |
| `tests/unit/validations/mobilisation.test.ts` | 15 |
| `tests/unit/validations/cagnotte.test.ts` | 14 |
| `tests/unit/validations/communes.test.ts` | 12 |
| `tests/unit/validations/campagne.test.ts` | 10 |
| `tests/unit/validations/sel.test.ts` | 9 |
| `tests/unit/validations/entraide.test.ts` | 10 |
| `tests/unit/validations/petition.test.ts` | 7 |
| `tests/unit/validations/adhesion.test.ts` | 8 |
| `tests/unit/validations/media.test.ts` | 6 |
| `tests/unit/validations/sondages.test.ts` | 7 |
| `tests/unit/validations/autres-moyens.test.ts` | 6 |

#### Services et factories (4 fichiers, 23 tests)

| Fichier | Tests |
|---|---|
| `tests/unit/services/factories.test.ts` | 7 |
| `tests/unit/supabase/env.test.ts` | 7 |
| `tests/unit/payments/factory.test.ts` | 4 |
| `tests/unit/payments/frais.test.ts` | 5 |

#### Logique métier (4 fichiers, 32 tests)

| Fichier | Tests |
|---|---|
| `tests/unit/petitions/stretch.test.ts` | 9 |
| `tests/unit/petitions/slugifier.test.ts` | 8 |
| `tests/unit/mobilisations/dates.test.ts` | 10 |
| `tests/unit/utils/cn.test.ts` | 5 |

### Couverture conceptuelle

- **Validations** : chaque schéma Zod a au moins une suite de tests (cas heureux + cas d'erreur typiques + edge cases : champs trop courts, formats invalides, valeurs hors plage).
- **Services externes** : les factories vérifient que le mock est retourné par défaut, qu'un provider invalide lève une erreur explicite, et que le singleton est respecté.
- **Logique métier** : calculs de stretch goal de pétitions, slugification, dates de mobilisations, helpers utils (`cn`).

---

## 3. Tests end-to-end (Playwright)

### Commandes

```bash
npx playwright install              # prerequis : telecharge les browsers (une seule fois)
npm run test:e2e                    # toutes les suites sur les 7 projets
npm run test:e2e -- --project=mobile-portrait   # un seul viewport
npm run test:e2e -- responsive-screenshots      # un seul spec
npm run test:e2e:ui                 # interface graphique Playwright
```

### Configuration multi-projets (depuis chantier 12.3)

`playwright.config.ts` définit 7 projets qui exécutent toutes les suites :

| Projet | Navigateur | Viewport | Usage |
|---|---|---|---|
| `mobile-portrait` | Chromium | 375 × 667 | iPhone SE portrait |
| `mobile-paysage` | Chromium | 667 × 375 | iPhone SE paysage |
| `tablette-portrait` | Chromium | 768 × 1024 | iPad portrait |
| `tablette-paysage` | Chromium | 1024 × 768 | iPad paysage |
| `desktop` | Chromium | 1440 × 900 | bureau moyenne résolution |
| `desktop-firefox` | Firefox | 1440 × 900 | sanity cross-browser |
| `desktop-webkit` | WebKit (Safari) | 1440 × 900 | sanity cross-browser |

Soit 93 scénarios × 7 = **651 exécutions** en run complet.

### Fichiers et nombre de scénarios par espace

| Fichier | Scénarios | Espace couvert |
|---|---|---|
| `tests/e2e/home.spec.ts` | 8 | Accueil + pré-footer compteurs |
| `tests/e2e/auth.spec.ts` | 7 | Connexion, inscription, magic link, Turnstile |
| `tests/e2e/adherer.spec.ts` | 6 | 3 chemins d'adhésion (gratuit, EUR, T99CP) |
| `tests/e2e/petitions.spec.ts` | 5 | Création, signature, modération, compteur stretch |
| `tests/e2e/mobilisations.spec.ts` | 11 | Création, inscription, dates, carte |
| `tests/e2e/cagnottes.spec.ts` | 6 | Création, dons EUR et T99CP, frais |
| `tests/e2e/communes.spec.ts` | 7 | Création, appartenances, fédérations |
| `tests/e2e/entraide.spec.ts` | 4 | 4 sous-espaces (hébergement, transport, qui prête tout, fruits de la terre) |
| `tests/e2e/sel.spec.ts` | 4 | Services SEL, workflow modération, crédit T99CP |
| `tests/e2e/marche.spec.ts` | 9 | Produits, boutiques, minimarchés, notations |
| `tests/e2e/moments-solidaires.spec.ts` | 4 | 8 types de moments, porte-à-porte, tupperwares |
| `tests/e2e/autres-moyens.spec.ts` | 2 | Liste d'organisations partenaires |
| `tests/e2e/carte-agenda.spec.ts` | 4 | Carte unifiée 11 types + agenda agrégé |
| `tests/e2e/media.spec.ts` | 3 | Maintenant Médias (table polymorphe, embed) |
| `tests/e2e/radio.spec.ts` | 2 | Player AzuraCast, now-playing |
| `tests/e2e/sondages-stubs.spec.ts` | 4 | Sondages, stubs 7.3/7.5/7.6 |
| `tests/e2e/profil.spec.ts` | 2 | 7 onglets profil, 2FA |
| `tests/e2e/design-system.spec.ts` | 3 | Page `/design-system` (tokens visibles) |
| `tests/e2e/crawl.spec.ts` | 1 | Crawl global, détection liens morts |
| `tests/e2e/responsive-screenshots.spec.ts` | 7 | Captures multi-viewports (chantier 12.3, nouveau) |

### Stratégie « pas de lien mort »

Le fichier `crawl.spec.ts` crawle automatiquement toutes les pages internes depuis la home et vérifie qu'aucune ne retourne 404 ou ne crashe. C'est le filet de sécurité contre les ajouts de boutons sans destination (cf. CLAUDE.md §4 : « rien d'à moitié fait dans un chantier livré »).

### Captures responsive

La suite `responsive-screenshots.spec.ts` écrit des PNG pleine page dans :

```
tests/screenshots/responsive/<projet>/<page>.png
```

Pour 7 pages publiques clés (home, agir, doctrine, mobiliser/petitions, s-entraider/marche, carte, connexion) × 7 projets = 49 captures de référence par run.

---

## 4. Comment relancer tout depuis zéro

```bash
# 1. Verifications mecaniques (rapides)
npm run lint
npm run typecheck

# 2. Tests unitaires
npm test

# 3. Tests E2E (premiere fois : installer les browsers)
npx playwright install
npm run test:e2e

# 4. Voir le rapport HTML Playwright
npx playwright show-report

# 5. Build de production
npm run build
```

---

## 5. Rapports générés

| Quoi | Chemin | Comment ouvrir |
|---|---|---|
| Rapport HTML Playwright | `playwright-report/index.html` | `npx playwright show-report` ou double-clic sur le fichier |
| Artefacts d'échec | `test-results/` | Traces (`.zip`), screenshots `only-on-failure` |
| Captures responsive | `tests/screenshots/responsive/<projet>/<page>.png` | n'importe quel visualiseur d'image |

---

## 6. Évolutions apportées par le chantier 12.3

- **Avant** : 1 projet Playwright (Chromium desktop), 60+ scénarios.
- **Après** : 7 projets (5 viewports Chromium + Firefox + WebKit), nouvelle suite `responsive-screenshots.spec.ts`, audit visuel reproductible.
- **Effet** : un défaut responsive (ex : input qui déborde sur iPhone SE portrait) est désormais détecté automatiquement par la CI, plus besoin de relire à la main.

---

## 7. Limites connues

- Les tests E2E utilisent les **services en mode mock** (Stripe, T99CP, Brevo, LiveKit, Turnstile). Ils valident la logique applicative mais pas l'intégration réelle ; cette dernière sera couverte par un pentest et des smoke tests sur preview Cloudflare au go-live.
- Pas de **test d'accessibilité automatisé** (axe-core ou Pa11y) dans la CI. Audit a11y consigné dans `docs/audits/accessibilite.md`. Un audit WCAG 2.1 AA complet est recommandé par un cabinet externe avant le lancement public.
- Pas de **test de charge** (k6, Artillery). Non bloquant pour le MVP, à programmer après le premier mois d'usage réel.
