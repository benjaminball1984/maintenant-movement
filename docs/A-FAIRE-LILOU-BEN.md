# À faire par Lilou/Ben pour finaliser le site Maintenant!

> **Date** : 2026-05-27 (fin nuit autonome Claude Code)
> **Objet** : liste exhaustive de tout ce que Claude Code N'A PAS PU faire seul. Classée pour que Claude.ai puisse t'accompagner étape par étape.
> **Périmètre** : VAGUE 0/1/2/3 et début de la VAGUE 4 ont été livrés en code. Le déploiement, les comptes externes, les secrets API et les contenus restent à mettre en place côté humain.

---

## Comment utiliser ce document

Donne ce fichier (ou des sections de ce fichier) à Claude.ai. Chaque section est autonome :

- **Catégorie 1-3** : configuration des comptes externes. Tu peux faire ça d'abord, sans toucher au code.
- **Catégorie 4-6** : application des migrations + données. Demande Supabase configuré.
- **Catégorie 7-9** : déploiement + DNS. Demande hébergeur configuré.
- **Catégorie 10-12** : finitions (contenus, crons, tests). Demande tout le reste.

Quand tu auras fait ta part, **lance `npm run dev` localement, dis-moi ce qui marche/ne marche pas**, et je finaliserai.

---

## Catégorie 1 — Secrets & clés API à obtenir

Tu auras besoin de créer/récupérer ces secrets. Tous vont dans `.env.local` pour le dev local et dans les Secrets GitHub Actions + Cloudflare Pages pour la production.

| Service | Variables d'env attendues | Mode mock dispo ? | Où obtenir |
|---|---|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`<br>`NEXT_PUBLIC_SUPABASE_ANON_KEY`<br>`SUPABASE_SERVICE_ROLE_KEY` | non (clés réelles obligatoires) | Dashboard Supabase → Settings → API |
| Brevo (emails) | `BREVO_API_KEY`<br>`BREVO_SENDER_EMAIL`<br>`EMAIL_PROVIDER=brevo` | oui (`EMAIL_PROVIDER=mock`) | https://app.brevo.com/ → SMTP & API → API Keys |
| Stripe (paiements) | `STRIPE_SECRET_KEY` (sk_test_ puis sk_live_)<br>`STRIPE_WEBHOOK_SECRET`<br>`STRIPE_TRESORERIE_ACCOUNT_ID`<br>`PAYMENT_PROVIDER=stripe_test` puis `stripe_live` | oui (`PAYMENT_PROVIDER=mock`) | https://dashboard.stripe.com/test/apikeys |
| Cloudflare Turnstile (anti-bot) | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`<br>`TURNSTILE_SECRET_KEY`<br>`TURNSTILE_PROVIDER=cloudflare`<br>`NEXT_PUBLIC_TURNSTILE_PROVIDER=cloudflare` | oui (mock) | https://dash.cloudflare.com/?to=/:account/turnstile (free tier) |
| LiveKit (visio Décider) | `LIVEKIT_URL`<br>`LIVEKIT_API_KEY`<br>`LIVEKIT_API_SECRET`<br>`LIVEKIT_PROVIDER=livekit` | oui (`mock`) | LiveKit Cloud OU self-hosted Docker |
| T99CP / Polygon (monnaie) | `T99CP_NETWORK=mumbai` puis `polygon_mainnet`<br>`T99CP_RPC_URL`<br>`T99CP_CONTRACT_ADDRESS=0x7275cfc83f486d53ca1379fc1f8025490bdcc79a`<br>`T99CP_TRESORERIE_WALLET_ADRESSE` | oui (`mock`) | RPC public Mumbai puis Polygon mainnet |
| Sentry (monitoring) | `SENTRY_DSN`<br>`SENTRY_AUTH_TOKEN` | oui (omission) | https://sentry.io/ free tier |
| GitHub (CI + PR) | (pas de secret env, juste un repo connecté) | n/a | https://github.com/benjaminball1984/maintenant-movement (déjà créé) |

### Variables Storage

| Variable | Valeur | Effet |
|---|---|---|
| `IMAGE_STORAGE_PROVIDER` | `mock` ou `supabase` | Choix de l'adapter images (V2.0.3) |
| `JUSTIFICATIF_STORAGE_PROVIDER` | `mock` ou `supabase` | Choix de l'adapter justificatifs (V2.3.32) |

### Variables Stripe Connect

| Variable | Valeur | Effet |
|---|---|---|
| `STRIPE_TRESORERIE_ACCOUNT_ID` | `acct_xxx` du compte Stripe Connect de l'asso centrale | Pour les adhésions et cotisations qui vont à la trésorerie |

---

## Catégorie 2 — Comptes & services externes à créer

### 2.1 Supabase

**Statut** : déjà créé (Francfort). Vérifier que les **3 clés** sont accessibles via Dashboard.

**À configurer en plus** :

- **Storage bucket `media`** (pour V2.0.3 images) :
  - Dashboard Supabase → Storage → New bucket → nom `media`, **public**.
  - RLS Storage : autoriser lecture publique, écriture pour authentifiés.
- **Storage bucket `justificatifs`** (pour V2.3.32 D12bis) :
  - Dashboard Supabase → Storage → New bucket → nom `justificatifs`, **privé**.
  - RLS Storage à activer : lecture admin national + trésorier·ière + propriétaire ; écriture admin/trésorier.
  - Concrètement, dans le Dashboard SQL Editor, exécuter :
    ```sql
    insert into storage.buckets (id, name, public) values ('justificatifs', 'justificatifs', false);
    -- Lecture admin général
    create policy "justificatifs_select_admin" on storage.objects
      for select using (bucket_id = 'justificatifs' and public.est_admin_general());
    -- Écriture admin général
    create policy "justificatifs_insert_admin" on storage.objects
      for insert with check (bucket_id = 'justificatifs' and public.est_admin_general());
    ```
- **Email Templates** (pour magic link, reset password) :
  - Dashboard Supabase → Authentication → Email Templates.
  - Vérifier que les templates en français sont configurés (cf. `scripts/configure-supabase-email-templates.mjs`).
- **SMTP Brevo** (pour que les emails partent depuis Brevo, pas le SMTP par défaut Supabase) :
  - Dashboard Supabase → Project Settings → Auth → SMTP Settings.
  - Sender email : `noreply@maintenant-le-mouvement.org` (ou domaine vérifié).
  - SMTP host : `smtp-relay.brevo.com`, port 587.
  - Login : ton email Brevo. Password : clé SMTP Brevo (à générer dans Brevo).

### 2.2 Brevo (emails transactionnels + newsletter)

**Statut** : compte à créer.

Étapes :

1. https://www.brevo.com/ → créer compte gratuit (jusqu'à 300 emails/jour).
2. Vérifier le domaine d'envoi (SPF/DKIM/DMARC — cf. catégorie 6).
3. Settings → SMTP & API → API Keys → créer une clé. → mettre dans `BREVO_API_KEY`.
4. Settings → SMTP & API → SMTP credentials → générer un mot de passe SMTP. → utiliser dans Supabase SMTP Settings.

### 2.3 Stripe

**Statut** : compte à créer.

Étapes :

1. https://dashboard.stripe.com/register → créer un compte Stripe (asso).
2. **Compte Connect** : activer Stripe Connect (pour permettre aux porteur·euse·s de cagnottes de recevoir des dons).
3. Récupérer la clé **secret key de TEST** d'abord (`sk_test_...`) → `STRIPE_SECRET_KEY`.
4. Activer le compte (KYC) → quand prêt, basculer vers `sk_live_...`.
5. Créer un **compte Connect platform** pour l'asso centrale → `STRIPE_TRESORERIE_ACCOUNT_ID`.
6. Webhooks : créer un endpoint webhook qui pointe vers `https://maintenant-le-mouvement.org/api/webhook/stripe` (à brancher ultérieurement) → `STRIPE_WEBHOOK_SECRET`.

### 2.4 Cloudflare (Pages + Turnstile + plus tard Workers)

**Statut** : compte à créer.

Étapes :

1. https://dash.cloudflare.com/ → créer un compte.
2. **Pages** : New project → Connect to Git → choisir `benjaminball1984/maintenant-movement`.
3. Settings du projet Pages :
   - Build command : `npx @cloudflare/next-on-pages@1`
   - Build output : `.vercel/output/static`
   - Node version : 20
   - Environment variables : tous les secrets ci-dessus (catégorie 1).
4. **Turnstile** : Settings → Turnstile → Add a site → domaine `maintenant-le-mouvement.org`.
   - Récupérer Site key (public) → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
   - Récupérer Secret key → `TURNSTILE_SECRET_KEY`.

### 2.5 LiveKit (visio Décider)

**Statut** : pas urgent (mock suffit).

Quand on activera l'espace Décider en visio, soit :

- **LiveKit Cloud** : https://livekit.io/cloud → free tier.
- **Self-hosted Docker** : `docker run -p 7880:7880 livekit/livekit-server`.

Variables : `LIVEKIT_URL` (wss://...), `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.

### 2.6 Sentry (monitoring)

**Statut** : pas urgent (omettre = pas d'erreur en local).

https://sentry.io/ → free tier → créer projet Next.js. Récupérer DSN → `SENTRY_DSN`.

---

## Catégorie 3 — Configuration de la base Supabase distante

### 3.1 Migrations à appliquer dans l'ordre

**12 migrations en attente** depuis la nuit du 27/05 (toutes en local, jamais poussées). Toutes idempotentes (CREATE TABLE IF NOT EXISTS).

```bash
# Dans le dossier projet, avec les vars Supabase dans l'env :
supabase db push
```

Ou via le script `scripts/appliquer-sql-distant.ts` qui peut appliquer un fichier précis :

```bash
npx tsx scripts/appliquer-sql-distant.ts supabase/migrations/20260527000000_t99cp_hash_consomme.sql
# Répéter pour chaque migration ci-dessous dans l'ordre :
```

Ordre :

1. `20260527000000_t99cp_hash_consomme.sql` (V2.1.1)
2. `20260527010000_consentement.sql` (V2.1.2)
3. `20260527020000_droit.sql` (V2.1.3)
4. `20260527030000_fil_groupe.sql` (V2.2.1)
5. `20260527040000_reservation.sql` (V2.2.2)
6. `20260527050000_caisse.sql` (V2.2.3)
7. `20260527060000_groupe_entraide_local.sql` (V2.3.2)
8. `20260527070000_location_mutualisee.sql` (V2.3.3)
9. `20260527080000_est_membre_espace_fix.sql` (V2.3.8 — fix critique helper SQL)
10. `20260527090000_reservation_journal.sql` (V2.3.15)
11. `20260527110000_transaction_entrante.sql` (V2.3.26)
12. `20260527120000_appartenance_campagne_groupe.sql` (V2.3.29 — uniquement appartenance_campagne car appartenance_groupe_entraide_local existait déjà)

### 3.2 Vérification post-migration

```bash
# Liste les tables dans Supabase
npx tsx scripts/tester-rls.ts
```

Doit renvoyer toutes les tables sans erreur de RLS.

### 3.3 Régénération des types TS (optionnel)

`types/database.ts` a été maintenu à la main pendant cette nuit. Pour le régénérer via CLI Supabase (assure que tous les types correspondent au distant) :

```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.ts
```

Mais cela écrasera les ajouts manuels. Préférer vérifier qu'il n'y a pas de divergence avant.

---

## Catégorie 4 — Backfills à lancer (idempotents, --dry-run obligatoire d'abord)

Tous suivent le pattern V2 : `--dry-run` par défaut (analyse sans écrire), `--confirm` explicite (écriture distante). Lancer **dans l'ordre suivant** après que les migrations distantes ont été appliquées :

### 4.1 Consentements (V2.1.2)

```bash
npx tsx scripts/backfill-consentement.ts --dry-run
# Vérifier la sortie : ~16k consentements seront créés depuis signature_petition.
npx tsx scripts/backfill-consentement.ts --confirm
```

### 4.2 Droits granulaires (V2.1.3)

```bash
npx tsx scripts/backfill-droits.ts --dry-run
# Vérifier les ~10-20 droits attendus depuis droit_admin.
npx tsx scripts/backfill-droits.ts --confirm
```

### 4.3 Entrées de caisse historiques (V2.3.28)

Préalable : migrations 50 (caisse) et 110 (transaction_entrante) appliquées.

```bash
npx tsx scripts/backfill-caisses.ts --dry-run
# Vérifier le récap : nb dons confirmés + nb adhésions payantes.
npx tsx scripts/backfill-caisses.ts --confirm
```

### 4.4 Communes (si pas déjà fait)

Préalable : CSV des communes pré-créées fourni.

```bash
# 1. Précréation des coquilles vides depuis le référentiel INSEE :
npx tsx scripts/precreer-communes.ts --dry-run
npx tsx scripts/precreer-communes.ts --confirm
# (déjà fait le 2026-05-25 selon CLAUDE.md, vérifier)

# 2. Import du CSV fourni (à fournir, cf. catégorie 9) :
npx tsx scripts/import-communes.ts mon-fichier.csv --dry-run
npx tsx scripts/import-communes.ts mon-fichier.csv --confirm
```

---

## Catégorie 5 — Configuration DNS pour le domaine

### 5.1 Domaine cible

`maintenant-le-mouvement.org` (acheté chez Ionos selon le CDC).

### 5.2 Records DNS à poser

| Type | Nom | Valeur | Effet |
|---|---|---|---|
| A | @ | (IP Cloudflare Pages, fournie après création projet) | Site principal |
| CNAME | www | `maintenant-le-mouvement.org` | Redirection www |
| TXT | @ | `v=spf1 include:_spf.brevo.com -all` | SPF |
| TXT | _dmarc | `v=DMARC1; p=quarantine; rua=mailto:dpd@maintenant-le-mouvement.org` | DMARC |
| CNAME | brevo._domainkey | (clé DKIM fournie par Brevo) | DKIM Brevo |

Vérification : https://mxtoolbox.com/SuperTool.aspx

### 5.3 Email contact

Récupérer ou créer une adresse `noreply@maintenant-le-mouvement.org` chez Ionos pour les emails sortants automatiques.

---

## Catégorie 6 — Crons à poser

Tous à créer en **Cloudflare Workers + Cron Triggers** quand le déploiement Cloudflare sera fait.

### 6.1 Adhésion : relances J+365

Endpoint à exposer : `/api/cron/adhesions/relances`. Cron : `0 9 * * *` (chaque jour 9h).

Appelle la fonction `envoyerRelancesAdhesion(14)` (jours avant expiration) dans `app/(public)/agir/adherer/actions.ts`.

### 6.2 Marché solidaire : expiration annonces

Endpoint : `/api/cron/marche/expirer-anciennes`. Cron : `0 9 * * 0` (dimanche 9h).

À écrire : passe en `statut='expiree'` les annonces inactives depuis 3 mois.

### 6.3 Moments solidaires : transition annonce → en_cours → terminé

Endpoint : `/api/cron/moments/transitions`. Cron : `0 * * * *` (chaque heure).

À écrire : avance les Moments selon leurs dates.

### 6.4 SEL : crédit prestations en attente

Endpoint : `/api/cron/sel/crediter-prestations`. Cron : `0 * * * *` (chaque heure).

Appelle `crediterPrestationsEnAttente()` dans `lib/sel/`.

### 6.5 CI cross-browser mensuel

Déjà fait (V2.3.32 fix Ultraplan). Workflow GitHub : `.github/workflows/ci-cross-browser.yml`, schedule `0 4 1 * *`.

---

## Catégorie 7 — Pull Request CI à merger

**Branche** : `fix/ci-playwright-multi-browser` (poussée sur GitHub).

**URL à ouvrir** : https://github.com/benjaminball1984/maintenant-movement/pull/new/fix/ci-playwright-multi-browser

**Action** :

1. Ouvrir l'URL ci-dessus.
2. Créer la PR en draft.
3. Vérifier que la CI passe (job test-e2e devrait être vert grâce au fix).
4. Marquer comme « ready for review » puis merger dans main.

**Pourquoi** : fix du workflow CI Playwright (filtre Firefox/WebKit + variables Supabase placeholders + workflow cross-browser mensuel séparé). Diagnostic complet dans `docs/diagnostic ultraplan.txt`.

---

## Catégorie 8 — Déploiement initial Cloudflare Pages

Préalable : compte Cloudflare créé (catégorie 2.4).

### 8.1 Connection au repo

Cloudflare Dashboard → Pages → Create a project → Connect to Git → choisir `maintenant-movement`.

### 8.2 Build settings

| Champ | Valeur |
|---|---|
| Framework preset | Next.js |
| Build command | `npx @cloudflare/next-on-pages@1` |
| Build output | `.vercel/output/static` |
| Root directory | `/` |
| Node version | 20 |

### 8.3 Environment variables (Production + Preview)

Coller tous les secrets de la catégorie 1 + `NEXT_PUBLIC_SITE_URL=https://maintenant-le-mouvement.org`.

### 8.4 Custom domain

Settings → Custom domains → Add → `maintenant-le-mouvement.org`. Suivre instructions pour les records DNS.

### 8.5 Premier déploiement

Branch `main` → Deploy. Vérifier l'URL `*.pages.dev` d'abord, puis le domaine custom.

---

## Catégorie 9 — Données externes à fournir

### 9.1 CSV des communes pré-créées (2 100 à 2 300 communes)

Format attendu (à confirmer avec Lilou/Ben) :

```csv
nom,code_insee,code_postal,latitude,longitude,description_courte
```

Lancer ensuite `scripts/import-communes.ts` (cf. catégorie 4.4).

### 9.2 Contenus éditoriaux des 8 pages

Cf. `docs/CONTENUS-A-ARBITRER.md` pour la liste exacte. Pages :

1. Doctrine — texte long de présentation
2. Commune libre — qu'est-ce que c'est, comment en créer une
3. Assemblée Confédérale — gouvernance
4. Monnaie 99-coin — qu'est-ce que T99CP, contrat, fonctionnement
5. FAQ — questions fréquentes
6. Ressources — guides, kits militants
7. À propos — l'asso, l'équipe, les origines
8. Mentions légales — texte juridique (RNA, DPD, etc.)

Fournir le texte à Claude.ai qui peuplera les pages.

### 9.3 Coordonnées de l'association

- Nom légal de l'asso
- N° RNA
- Adresse postale
- Email contact (`contact@maintenant-le-mouvement.org`)
- Email DPD (`dpd@maintenant-le-mouvement.org`)
- Choix collégial du·de la DPD bénévole

### 9.4 Premiers signataires & organisations partenaires

Liste pour la page Doctrine et la home. Format libre.

### 9.5 Citations (page d'accueil)

À fournir. Avec attribution.

### 9.6 Identité visuelle

Vérifier `docs/specs/04_DESIGN-TOKENS.md` (déjà posé). Si modifications voulues (logo final, palette ajustée), passer par les tokens CSS.

---

## Catégorie 10 — Décisions politiques en attente d'arbitrage

À trancher avec Lilou/Ben, puis Claude.ai peut appliquer.

### Q5 — Services proposés selon statut

Quels services sont accessibles aux **adhérent·e·s** (12€/an) vs **sympathisant·e·s** (gratuit) vs **donateur·ice·s** ?

Exemples à arbitrer :

- SEL : tous statuts ou adhérents seulement ?
- Cagnottes : créer une cagnotte = adhérent only ?
- Visio Décider : tous statuts ou seulement adhérent·e·s d'une commune ?

### Q13 — Boucle d'engagement

Mécaniques transverses : comment fidéliser les sympathisant·e·s qui ne paient pas ? Notifs, gamification (interdit), recommandations ?

### Q14 — Indicateurs publics du mouvement

Quoi afficher publiquement ? Nombre d'adhérent·e·s ? Nombre de signataires ? Trésorerie globale (somme des soldes caisses) ?

---

## Catégorie 11 — Tests à lancer (local + CI)

### 11.1 Tests unitaires + lint + typecheck

Déjà verts. Re-vérifier après application des migrations :

```bash
npm run lint
npm run typecheck
npm test
```

Doit retourner **413 tests verts**, lint OK, typecheck OK.

### 11.2 Tests E2E Playwright local

Préalable : installer Playwright Chromium (déjà fait normalement).

```bash
npm run test:e2e
```

### 11.3 Tests E2E multi-viewports + cross-browser

Préalable : `npx playwright install` (télécharge Firefox + WebKit).

```bash
PLAYWRIGHT_FULL=1 npm run test:e2e
```

### 11.4 Tests UI manuels (golden path)

Lancer `npm run dev` et naviguer manuellement :

1. **Pages publiques** : `/`, `/mobiliser/petitions`, `/mobiliser/cagnottes`, `/s-entraider`, `/agir/adherer`, `/s-informer/reseau`.
2. **Inscription** : créer un compte, vérifier email magic link.
3. **Adhésion gratuite** : depuis profil.
4. **Cagnotte + don** (mode mock) : créer cagnotte, faire un don.
5. **Réseau social** : publier, commenter, soutenir.
6. **Réservation D8** : créer offre entraide, demander réservation depuis un autre compte, accepter, marquer réalisée, confirmer.
7. **Trésorerie admin** : `/admin/national/tresorerie` (avec compte admin national). Vérifier solde, liste entrées/sorties. Initier un reversement (test).
8. **Notifications cloche** : observer la cloche header se mettre à jour après actions.

---

## Catégorie 12 — Notes pour les chantiers V2.4+ (à coder plus tard)

Ces chantiers sont **listés dans le CDC mais pas encore codés** parce qu'ils demandent une spec ou un branchement externe. À traiter quand Lilou/Ben sera prête.

### 12.1 Notifications canaux 3-5

- **Canal 3 — Mail récap hebdo (mardi)** : Server Action `genererMailRecap(personneId)` + cron Cloudflare Worker mardi 9h + template Brevo.
- **Canal 4 — Newsletter (vendredi)** : éditorial humain. Côté tech : envoi via Brevo aux personnes ayant accepté la newsletter (consentement V2.1.2).
- **Canal 5 — Push** : service worker + VAPID keys. Opt-in via préférences (déjà UI).

### 12.2 Vision D8 améliorée

- Litige admin : table `litige_reservation` dédiée avec décision arbitre, contre-arguments.
- Realtime Supabase : la cloche s'actualise sans refresh.

### 12.3 Pages éditoriales

Une fois les textes fournis (cf. 9.2), créer les routes :

- `/comprendre/doctrine/page.tsx`
- `/comprendre/commune-libre/page.tsx`
- etc.

### 12.4 GT thématiques

Route `/co-construire/[slug]/page.tsx` à poser (lien depuis Mes groupes V2.3.22 est vide tant que pas livrée).

### 12.5 Convergence tronc Objet (VAGUE 5 CDC)

**REPORTÉE** — ne lancer que sur décision nominative explicite. Doctrine de greffe §0.3.

---

## Catégorie 13 — Suite progressive recommandée

**Ordre suggéré pour avancer sans se perdre :**

1. **Soirée 1** : Catégorie 2 (créer les comptes externes Supabase + Brevo + Stripe test + Cloudflare).
2. **Soirée 2** : Catégorie 1 (récupérer toutes les clés) + Catégorie 3 (appliquer migrations + buckets Storage).
3. **Soirée 3** : Catégorie 4 (lancer backfills) + Catégorie 7 (merger PR CI).
4. **Soirée 4** : Catégorie 5 (DNS) + Catégorie 8 (déploiement Cloudflare Pages).
5. **Soirée 5** : Catégorie 9 (fournir CSV communes + premiers contenus).
6. **Soirée 6** : Catégorie 10 (arbitrages Q5/Q13/Q14) + Catégorie 11 (tests UI manuels).
7. **Soirée 7+** : Catégorie 12 (V2.4 si volonté).

Entre deux soirées, **dis-moi où tu en es** et je débloque/finalise ce qui peut l'être côté code.

---

## Catégorie 14 — Migration Base44 (chantier 10.1)

État partiel selon CLAUDE.md :

- ✅ **Signatures importées** : 17 746 signatures liées via `signature_petition` + `profil_unifie` (chantier 13.3-E).
- ✅ **Profils unifiés** : 15 737 profils générés (numéro M+7).
- ❓ **946 membres Base44** : pas confirmé qu'ils ont été basculés en `adhesion` avec date_adhesion préservée.
- ❓ **~9 000 abonnés newsletter** : pas confirmé exportés vers Brevo.
- ❓ **Pétitions Base44** : importées en statut `archivee` via `scripts/migrer-base44.ts`. À réécrire avant repub.
- ❓ **2 articles Base44** : à reprendre manuellement.

### 14.1 Vérifier l'état actuel

```bash
# 1. Combien d'adhésions actives existent ?
psql "$DATABASE_URL" -c "select count(*) from adherent_actif;"

# 2. Combien de pétitions « archivees » ?
psql "$DATABASE_URL" -c "select slug, titre from petition where statut='archivee';"

# 3. Combien de signatures avec profil_unifie ?
psql "$DATABASE_URL" -c "select count(*) from signature_petition where profil_unifie_id is not null;"
```

### 14.2 Si les 946 membres ne sont pas importés

Lancer `scripts/migrer-base44.ts <dossier_csv> --dry-run` pour rapport, puis `--confirm`. Vérifier que `membres.csv` existe dans le dossier fourni (export depuis Base44 admin).

Le script actuel rapporte mais n'insère pas les adhésions effectivement (cf. commentaires dans `scripts/migrer-base44.ts`). Pour finir le travail :

- Récupérer les emails des 946 membres.
- Pour chacun, créer un compte `auth.users` via **Supabase Admin API** (`supabase.auth.admin.createUser`) avec le mail Base44, mot de passe initial aléatoire.
- Envoyer à chacun un mail « Reset your password » via Brevo (Supabase Auth peut le faire en webhook).
- Une fois `auth.users` créés, insérer dans `adhesion` :
  - `personne_id` = `auth.users.id` du membre
  - `chemin` = `'gratuit'` (ou `'euros'` selon Base44)
  - `debute_le` = `date_adhesion` originale
  - `expire_le` = `date_adhesion + 365 jours`

### 14.3 Si les ~9k newsletter ne sont pas dans Brevo

Le script `migrer-base44.ts` affiche le nombre mais ne pousse pas vers Brevo. Pour finir :

1. Récupérer le CSV `newsletter.csv` (email, code_postal, inscrit_le).
2. Via Brevo Dashboard → Contacts → Import. Mapper les colonnes.
3. Ajouter un **tag « base44-newsletter »** pour distinguer les imports historiques.
4. Vérifier le quota gratuit (300 emails/jour) avant tout envoi.

### 14.4 Réécriture des pétitions Base44

Les 2-3 pétitions Base44 ont été importées en `statut='archivee'` avec le texte d'origine. Pour les republier :

1. Aller sur `/admin/petitions` (édition).
2. Pour chacune, éditer titre + texte (Lilou/Ben a un nouveau ton politique).
3. Passer le statut à `publiee`.

### 14.5 Reprise des 2 articles Base44

Articles à transférer manuellement depuis Base44 vers la table `media` côté Maintenant! :

1. `/admin/media` (mod section).
2. Création manuelle des 2 articles avec le texte original.
3. Statut `publie`.

---

## Récapitulatif chiffré

- **Code livré** : 46 chantiers V2.3.x (V2.3.1 à V2.3.46) + fix Ultraplan CI + VAGUE 0/1/2 entières.
- **Tests** : **427 verts**.
- **Migrations en attente distant** : 12.
- **Backfills à lancer** : 3 (consentement, droits, caisses).
- **PR à merger** : 1 (fix CI Playwright).
- **Buckets Storage à créer** : 2 (media + justificatifs).
- **Services externes** : 6 (Supabase, Brevo, Stripe, Cloudflare, LiveKit, Sentry).
- **Crons à poser** : 4.
- **Contenus éditoriaux à fournir** : 8 pages.
- **Migration Base44** : 946 membres + 9k newsletter à finaliser (cf. catégorie 14).

---

**Bonne suite.** Quand tu as fait ta part, dis-moi simplement « j'ai fait X, Y, Z » et je reprends à partir de là.
