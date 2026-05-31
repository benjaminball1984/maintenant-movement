# Revue 2026 — Bloc 8 : audit post-correctifs (re-audit + sécurité + qualité de code)

> Mené sur l'état après application des 13 correctifs (commits V2.6.33→38). **Build vert, 1013/1013 tests verts.** Trois volets : (A) re-vérification des audits précédents + régressions, (B) sécurité, (C) qualité/architecture du code. Respect CDC + persona vérifié.

## A. Re-audit / régressions

**Verdict : les correctifs tiennent, ZÉRO régression.**

- **12/13 correctifs pleinement résolus** (preuve au code) ; **C26 partiel assumé** (les 2 boutons « Accorder/Retirer le badge » restent à étiqueter ; impact faible car leur texte est déjà explicite).
- **Scan repo complet** : plus **aucun** `<Link><Button>`/`<a><button>` nulle part (l'anti-pattern a été éliminé partout, pas seulement aux 2 endroits signalés). Le helper `classesBouton` rend `Button` plus DRY (Button l'utilise lui-même → zéro divergence de style possible).
- Aucun nouveau `console.log`/`alert()`/`href="#"`/`TODO`/`any`/`@ts-ignore` introduit. Aucun bouton mort (les Server Actions sous-jacentes existent). Vocabulaire propre sur les fichiers neufs/touchés.
- **Manques mineurs trouvés (non régressifs, hors des 13)** :
  - 2 autres modales `<dialog>` sans `max-h` (`InvitationInterne.tsx:115`, `BoutonAttacherACampagne.tsx:115`) — même classe que C18, atténué (scroll interne ou contenu court). → à aligner.
  - `og:type` reste `website` sur l'article journal (`ogType` non passé). → ajouter `ogType:'article'`.
  - Tiret cadratin : **300** en code (était 303 ; 3 corrigés). Flèches résiduelles. → C2/C12, passe dédiée reportée.

## B. Sécurité

**Posture générale : forte et mûre.** RLS comme barrière primaire + contrôles applicatifs en défense en profondeur, Zod + Turnstile sur les formulaires publics, sanitize-on-write du rich text, 3 clients Supabase cloisonnés (`service_role` jamais côté client, jamais `NEXT_PUBLIC_`), CSP/headers soignés, séparation des rôles sur l'argent (C7), anti-énumération sur le reset. Deux failles concrètes + un risque opérationnel à traiter **avant la mise en ligne publique** (le site est local jusqu'à la Phase M, donc non exploitables aujourd'hui).

| Sévérité | Catégorie | Problème | Fichier:ligne | Correctif | Id |
|---|---|---|---|---|---|
| **Élevée** | Redirection ouverte | `next` lu en query string et passé à `redirect()` sans valider qu'il est interne → `?next=//evil.com` redirige hors-site après auth légitime (phishing). | `app/auth/callback/route.ts:57,70,82` | N'accepter que `next` commençant par un seul `/` (refuser `//` et `/\`), sinon `/profil/dashboard`. ~3 lignes. | **S1** |
| **Moyenne** | Injection de filtre PostgREST | Recherches admin : `%${motCle}%` interpolé dans `.or(\`col.ilike.${motif},…\`)` sans échapper `,()%` → peut casser/injecter la grammaire du filtre. Admin-only + RLS limitent l'impact. | `lib/admin/personnes.ts:74`, `sondages.ts:54`, `moments.ts:55`, `groupes-entraide.ts:49`, `medias.ts:50` (+ vérifier campagnes/federations/communes/reservations) | Réutiliser le pattern `termeSecurise()` (déjà présent dans `admin/national/droits/actions.ts:165`) : `saisie.replace(/[%,()]/g, ' ')`. Centraliser un helper `echapperFiltreOr()`. | **S2** |
| **Moyenne** | Secret / opérationnel | `SUPABASE_ACCESS_TOKEN` (jeton Management = contrôle total du projet) **encore actif dans `.env.local`** alors que le journal note « à révoquer en fin de session ». Gitignoré (pas dans git) mais actif au repos. | `.env.local` (non versionné) | **Révoquer le jeton** dans Supabase (Account → Access Tokens) dès la fin de session. | **S3** |
| Faible | Upload | MIME validé via `fichier.type` (déclaré client), pas via magic bytes. Impact limité (Storage non exécutant + `nosniff` + bucket `allowed_mime_types`). | `app/actions/storage.ts:52-60` | Optionnel : sniffer la signature binaire, ou recompresser côté serveur. | S4 |
| Faible | CSP | `'unsafe-inline'` dans `script-src`/`style-src` (compromis Next.js 14 documenté). | `next.config.mjs:82-84,102` | Migrer vers nonces CSP quand Sentry sera branché. | S5 |
| Faible | PII en logs | `MockEmailService` logue les destinataires ; un script logue un email en cas d'erreur. | `lib/email/MockEmailService.ts:20,27,33` ; `scripts/importer-signataires.ts:390` | Dev only ; masquer en prod (`a***@domain`). | S6 |

**Bonnes pratiques sécurité en place (à préserver)** : cloisonnement des 3 clients Supabase ; autorisation systématique sur les mutations (session + rôle/propriété, souvent doublée par des RPC `SECURITY DEFINER` + `set search_path`) ; tables financières/messagerie verrouillées par RLS ; double-validation reversement (C7) + justificatif obligatoire ; gardes `garantirAccesAdmin`/`garantirAdminNational` ; sanitize-on-write (allowlist stricte) sur tous les chemins HTML ; Turnstile vérifié serveur ; anti-énumération reset ; CSP sans wildcard, `object-src 'none'`, HSTS prod ; secrets hors git (`.env.example` seul versionné).

## C. Qualité et architecture du code

**Note : A− au sens du persona §2, A+ franc sur la rigueur de typage.** ~82 400 lignes. `tsconfig` strict renforcé (`noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `noImplicitReturns`…), **0 `@ts-ignore`, 0 non-null `!`, 10 `any` tous justifiés par `biome-ignore` commenté**. Doctrine adapter parfaitement tenue (6 services mock/réel + factory ; **pas de doublon `lib/payments` vs `lib/stripe`** : la dette suspectée n'existe pas). Modules purs (droits, machine à états réservation) documentés + testés = code A+. Gestion d'erreur uniforme (`{ok,message}`, 0 `throw` dans `app/actions`). 0 `TODO`/`FIXME` dans le source.

**Améliorations (toutes additives, aucune urgente) :**

| Catégorie | Constat | Exemple | Reco | Id |
|---|---|---|---|---|
| DRY | Type `StatutReservation` réinliné 5× alors qu'il est exporté ET déjà importé | `app/actions/reservation.ts:619-626,700-707` | `as StatutReservation` | Q1 |
| DRY | `LIBELLE_TYPE` cagnotte byte-identique dans 3 fichiers ; ~27 maps d'enum locales (certaines divergentes : « Membres » vs « Membres uniquement ») | `cagnottes/[slug]:65`, `moderation/cagnottes:16`, `CarteCagnotte:14` | Centraliser (idéalement clés CMS) | Q2 |
| DRY | Guard `if (session===null) return {ok:false,'Connexion requise.'}` copié 28× | `app/actions/*` | Helper `exigerSession()` / wrapper `actionAuthentifiee()` | Q3 |
| Cohérence | `formaterEuros` (testé, résilient) importé par 4 composants ; ≥8 fichiers formatent l'euro à la main | `tresorerie/page`, `dashboard/page`, `JaugeT99CPEuros` | Migrer vers le helper | Q4 |
| Validation | Le seul formulaire à IBAN ne valide pas l'IBAN alors que `lib/iban.ts` existe | `FormulaireInitierReversement.tsx:130` | Brancher `estIbanValide` dans le Zod (§4) | Q5 |
| Lisibilité | `app/actions/reservation.ts` (863 l.) : 5 transitions quasi-identiques | `:577-649`, `:677-720` | Extraire `executerTransitionDemandeur(...)` | Q6 |

**Dette technique recensée :**
- **Code mort** (à retirer, 0 référence) : `components/home/PageEspaceStub.tsx`, `PageSousEspaceStub.tsx`, `PageEditorialeStub.tsx` (~180 lignes, orphelins depuis V2.5.46). Helpers « musée » testés mais non branchés : `lib/siret.ts`, `lib/distance-gps.ts`, `lib/iban.ts` (à câbler ou retirer) ; barrel `lib/helpers-purs.ts` importé 1×.
- **`any`** : 10 occurrences, toutes commentées/justifiées (typage polymorphe Supabase). Les pires (`archivage.ts`) resserrables avec une union de tables, effet local.
- **Casts `as <DomainType>`** (~120) : faute de types DB générés (`types/database.ts` à la main). Se résorberaient via la CLI Supabase.
- **Pas de route group fantôme** : les paires (`/carte` vs `/cartes`, `/communes` vs `/agir/communes`) sont intentionnelles et documentées. RAS.
- **Répertoires racine parasites** : `V2/` et `export-claudeai/` (zip + md, hors build) polluent la racine → déplacer sous `docs/archives/`.

## D. Recommandations consolidées (priorisées, après cette revue)

> Toutes additives / surgicales, aucune ne touche aux données réelles. À appliquer avec test, avant mise en ligne publique pour S1/S2/S3.

1. **S1 — open redirect** (`auth/callback`) : 3 lignes, sûr, à faire avant le public. **Prioritaire sécurité.**
2. **S2 — échappement filtre admin** : réutiliser `termeSecurise()`, sûr.
3. **S3 — révoquer le jeton Management** (action manuelle Lilou/Ben).
4. **Q1, Q4, Q5** : DRY/validation, gains rapides sûrs (`StatutReservation`, `formaterEuros`, IBAN Zod).
5. Retrait du code mort (3 Stubs) — **seulement après confirmation** (le code est conservé dans l'historique git de toute façon).
6. Restes du Bloc 6 (C16, C17, C24, C26-badge, C6, migrations C5/C13/C14/C15, C31) et la passe C2/C12.
7. P3 (décisions) : D1-D5 inchangées.

Aucune de ces actions n'a été appliquée à l'aveugle : elles sont décrites pour arbitrage, conformément à la consigne « aucune régression ».
