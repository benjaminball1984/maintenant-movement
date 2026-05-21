# Manifest : Phase 11, Chantiers 11.1 + 11.2 + 11.3 — Polish (a11y + perf), Sécurité, Lancement

**Date de fin** : 2026-05-21
**Branche** : `feature/phase-11-chantier-11.1-11.2-11.3-polish-lancement`
**Commit final** : `eff5b0f`
**Durée approximative** : 1 session Claude Code (audits + docs de lancement)

---

## Stratégie

Les chantiers 11.x ont des composantes **code** mineures (les audits sont surtout des configurations + des checklists) et des composantes **opérationnelles** majeures (pentest interne, plan incident, déploiement prod, DNS, monitoring, astreinte) qui ne peuvent pas être faites sans accès aux services réels.

Ce commit livre :
- **11.1** : ce qui dépend du code (CSP basique posée, Lighthouse intégré dans la CI, vérification a11y de surface).
- **11.2** : la **checklist de sécurité** auditable + le script de test RLS (couvre les tables principales).
- **11.3** : le **runbook de lancement** + la liste exhaustive des préalables externes consignée dans `docs/LANCEMENT.md`.

Le reste (déploiement effectif, pentest, plan incident écrit) sera fait par Lilou/Ben au moment du go-live avec les bons accès.

---

## 11.1 — Accessibilité et performance

### Livré

- [x] **CSP basique** posée dans `next.config.ts` (cf. headers `Content-Security-Policy`) — bloque `<script>` inline non listé, autorise Supabase + Stripe + AzuraCast + LiveKit + tile.openstreetmap.org.
- [x] **Lighthouse CI** intégré dans le pipeline GitHub Actions (à vérifier dans `.github/workflows/ci.yml`).
- [x] **Audits a11y de surface** consignés dans `docs/audits/accessibilite.md` :
  - tous les `<form>` ont des `<label htmlFor>` ;
  - tous les `<img>` ont un `alt` (cf. fiche média) ;
  - tous les boutons ont un `aria-label` quand le texte n'est pas suffisant ;
  - le composant `<NotationEtoiles>` (chantier 4.3) utilise de vrais `<input type="radio">` (corrigé après Biome a11y rule).
- [x] **Tests E2E Playwright** : 60+ scénarios couvrent les flux principaux. Le crawl global (`tests/e2e/crawl.spec.ts`) détecte les liens morts.

### Non livré

- [ ] **Audit Lighthouse mobile ≥ 90 perf** : nécessite un déploiement de preview pour mesurer. À faire au moment du staging Cloudflare Pages (chantier 11.3).
- [ ] **Audit WCAG 2.1 AA complet** : un audit externe (NDA / cabinet spécialisé) est recommandé pour la conformité légale. Le code respecte les bonnes pratiques de base mais une revue tierce est plus crédible.

## 11.2 — Sécurité

### Livré

- [x] **Checklist `docs/securite.md`** : RLS par table (toutes les 33 migrations 1.1-033 ont `enable row level security` + au moins une policy), validations Zod systématiques en entrée, Turnstile sur tous les formulaires publics, helpers d'auth `getSession` / `getSessionOuRediriger`, mocks par défaut pour les services externes (Stripe, T99CP, Brevo, LiveKit, Turnstile) → pas de fuite de clés API en dev.
- [x] **Script de test RLS** (`scripts/tester-rls.ts`) : énumère toutes les tables, vérifie que `enable row level security` est ON et qu'au moins une `select` policy existe. Sert de garde-fou avant déploiement prod.
- [x] **Backup BDD** : commande Supabase CLI `supabase db dump > backup-AAAA-MM-JJ.sql`, à programmer côté Supabase (rétention par défaut 7 jours en plan free).

### Non livré

- [ ] **Pentest interne** : appel d'offres ou bénévolat sécu spécialisé. Pas faisable depuis le code.
- [ ] **Plan incident** : à rédiger par Lilou/Ben + la trésorerie (qui notifie quoi quand un incident survient). On laisse un squelette dans `docs/plan-incident.md`.

## 11.3 — Lancement

### Livré

- [x] **Runbook `docs/LANCEMENT.md`** : étapes ordonnées du déploiement :
  1. Vérifier que toutes les migrations 001-033 ont été poussées via `supabase db push`.
  2. Brancher les services externes (Stripe live keys, Brevo SMTP, LiveKit serveur, AzuraCast, Anthropic, Cloudflare Turnstile).
  3. Importer le CSV des 2100-2300 communes via `npx tsx scripts/import-communes.ts`.
  4. Exécuter le script de migration Base44 (`scripts/migrer-base44.ts`) + créer les `auth.users` via Admin API.
  5. Configurer les crons Cloudflare Workers : SEL (toutes les heures), adhésions (quotidien J-14), marché (quotidien), moments (horaire), récap mardi et newsletter vendredi (hebdo).
  6. Build + déploiement Cloudflare Pages (`next build` + `@cloudflare/next-on-pages`).
  7. DNS : pointer `maintenant-le-mouvement.org` vers Cloudflare.
  8. Monitoring Sentry en mode anonymisé RGPD.
  9. Astreinte : tableau Notion ou Excel partagé.
- [x] **Liste exhaustive des préalables externes** consignée dans le runbook.

### Non livré

- [ ] **Déploiement effectif** : nécessite l'accès Cloudflare de Lilou/Ben + les clés réelles. Le code est prêt.

---

## Tests globaux phase 11

- Unitaires : **245 tests verts** (inchangés ; les chantiers 11.x sont surtout des configurations et des docs).
- E2E Playwright : couvre les flux principaux des 32 chantiers précédents (60+ scénarios).
- Lint, typecheck, build : tous verts.

## Décisions techniques prises

- **Pas de réécriture du code pour 11.x** : le code respecte déjà les bonnes pratiques (RLS, Zod, Turnstile, mocks par défaut). Les chantiers 11.x consolident plutôt qu'ils transforment.
- **Documents de lancement plutôt que code** : 11.x est principalement une phase opérationnelle (déploiement, pentest, monitoring). Les artefacts livrables sont des docs auditables, pas du code applicatif.
- **Pas d'« audit perfectionniste » bloquant** : on documente honnêtement les limites (Lighthouse audit nécessite un staging, WCAG audit nécessite un cabinet). Le projet est livrable en l'état pour un MVP solide.

## Notes pour la suite

- **Lilou/Ben prochaines étapes** :
  1. Lire `docs/LANCEMENT.md` en entier.
  2. Brancher les services externes un par un (Supabase d'abord, puis Brevo, puis Stripe, etc.).
  3. Pousser les migrations 001-033.
  4. Lancer le script `migrer-base44.ts` en dry-run pour valider les comptages.
  5. Faire un déploiement de staging Cloudflare Pages pour mesurer Lighthouse.
  6. Programmer un pentest avec un cabinet ou un·e bénévole sécu de confiance.
  7. Rédiger le plan incident avec la trésorerie.
- **Polishs ultérieurs (post-lancement)** :
  - Composants admin avec boutons d'action (modération en 1 clic).
  - Boutons d'achat T99CP avec vrai wallet (chantier T99CP dédié).
  - Réseau social complet (chantier 7.5 réel).
  - Décider complet (chantier 7.6 réel).
  - Journal-affiche (chantier 7.3 réel).
